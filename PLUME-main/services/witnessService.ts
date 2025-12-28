import { GoogleGenAI } from "@google/genai";
import { supabase } from "./supabaseClient";
import { logger } from "../utils/logger";

// Types for witness contributions
export interface WitnessContribution {
    id: string;
    chapter_id: string;
    guest_name: string;
    guest_relation?: string;
    content: string;
    raw_responses?: WitnessResponse[];
    contribution_type: 'text' | 'audio' | 'photo';
    status: 'pending' | 'accepted' | 'rejected' | 'integrated';
    created_at: string;
}

export interface WitnessResponse {
    question: string;
    answer: string;
    step: number;
}

export interface ContradictionDetection {
    hasContradiction: boolean;
    findings: {
        topic: string;
        authorVersion: string;
        witnessVersion: string;
        severity: 'low' | 'medium' | 'high';
    }[];
}

export interface WitnessInvitation {
    id: string;
    chapter_id: string;
    author_name: string;
    memory_title: string;
    memory_context: {
        location?: string;
        date?: string;
        tags?: string[];
        excerpt?: string;
    };
    custom_question: string;
    suggested_questions?: string[];
    guest_name?: string;
    guest_relation?: string;
    created_at: string;
}

// Generate guided questions for the witness based on memory context
export const generateWitnessQuestions = async (
    memoryContext: {
        title: string;
        excerpt: string;
        location?: string;
        date?: string;
        tags?: string[];
        authorQuestion: string;
    }
): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `Tu es PLUME, un assistant bienveillant qui aide à recueillir des témoignages pour enrichir des souvenirs.

CONTEXTE DU SOUVENIR:
- Titre: "${memoryContext.title}"
- Extrait: "${memoryContext.excerpt.substring(0, 300)}..."
- Lieu: ${memoryContext.location || 'Non précisé'}
- Période: ${memoryContext.date || 'Non précisée'}
- Thèmes: ${memoryContext.tags?.join(', ') || 'Aucun'}

QUESTION DE L'AUTEUR AU TÉMOIN:
"${memoryContext.authorQuestion}"

TÂCHE:
Génère exactement 3 questions maïeutiques pour guider le témoin à se remémorer ce moment.
Les questions doivent:
1. Commencer par une question sensorielle (qu'avez-vous vu/entendu/ressenti)
2. Puis une question sur les faits (que s'est-il passé)
3. Finir par répondre à la question de l'auteur

FORMAT DE RÉPONSE (JSON strict):
{
  "questions": [
    "Question sensorielle ici...",
    "Question factuelle ici...",
    "Question de l'auteur reformulée ici..."
  ]
}`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ parts: [{ text: prompt }] }]
        });

        const text = result.text || '';
        const jsonMatch = text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.questions || [];
        }

        // Fallback questions
        return [
            "Fermez les yeux un instant... Que voyez-vous de ce moment ? Quel temps faisait-il ?",
            "Que s'est-il passé exactement ? Racontez-moi les détails dont vous vous souvenez.",
            memoryContext.authorQuestion
        ];
    } catch (error) {
        logger.error('Error generating witness questions:', error);
        return [
            "Fermez les yeux un instant... Que voyez-vous de ce moment ?",
            "Que s'est-il passé exactement selon vos souvenirs ?",
            memoryContext.authorQuestion
        ];
    }
};

// Reformulate witness responses into a coherent narrative
export const reformulateWitnessNarrative = async (
    responses: WitnessResponse[],
    guestName: string,
    memoryContext: { title: string; authorName: string }
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const responsesText = responses
        .map((r, i) => `Question ${i + 1}: ${r.question}\nRéponse: ${r.answer}`)
        .join('\n\n');

    const prompt = `Tu es PLUME, un assistant d'écriture bienveillant.

TÂCHE:
Reformule les réponses de ${guestName} en un témoignage cohérent et fluide.
Garde les détails importants et l'authenticité du témoignage.
Écris à la première personne du singulier.
Ne modifie pas les faits, juste la forme.

RÉPONSES BRUTES:
${responsesText}

FORMAT:
Écris directement le témoignage reformulé, sans introduction ni conclusion.
Maximum 3 paragraphes.`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ parts: [{ text: prompt }] }]
        });

        return result.text?.trim() || responses.map(r => r.answer).join('\n\n');
    } catch (error) {
        logger.error('Error reformulating witness narrative:', error);
        return responses.map(r => r.answer).join('\n\n');
    }
};

// Merge witness contribution into original memory
export const mergeWitnessContribution = async (
    originalContent: string,
    witnessContent: string,
    witnessName: string,
    mode: 'fusion' | 'annotation' | 'section'
): Promise<string> => {
    if (mode === 'annotation') {
        return `${originalContent}\n\n---\n📎 *Témoignage de ${witnessName}:*\n${witnessContent}`;
    }

    if (mode === 'section') {
        return `${originalContent}\n\n---\n\n## Vu par ${witnessName}\n\n${witnessContent}`;
    }

    // AI Fusion mode
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `Tu es PLUME, un assistant d'écriture.

TÂCHE:
Fusionne le témoignage de ${witnessName} avec le récit original de l'auteur.
Le résultat doit être un texte fluide et cohérent.
Conserve le style et la voix de l'auteur.
Intègre naturellement les nouveaux détails du témoin.
Ajoute une note d'attribution discrète à la fin.

RÉCIT ORIGINAL:
${originalContent}

TÉMOIGNAGE DE ${witnessName.toUpperCase()}:
${witnessContent}

FORMAT:
Écris directement le récit fusionné.
À la fin, ajoute: "📎 Enrichi grâce au témoignage de ${witnessName}"`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ parts: [{ text: prompt }] }]
        });

        return result.text?.trim() || `${originalContent}\n\n---\n📎 Témoignage de ${witnessName}:\n${witnessContent}`;
    } catch (error) {
        logger.error('Error merging witness contribution:', error);
        return `${originalContent}\n\n---\n📎 Témoignage de ${witnessName}:\n${witnessContent}`;
    }
};

/**
 * Detects factual contradictions between original memory and witness contribution
 */
export const detectWitnessContradictions = async (
    originalContent: string,
    witnessContent: string,
    witnessName: string
): Promise<ContradictionDetection> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `Tu es PLUME, un assistant qui analyse la cohérence des récits de vie.
TÂCHE: Compare le récit original de l'auteur et le témoignage du témoin (${witnessName}) pour détecter des contradictions factuelles (dates, lieux, présence de personnes, actions contradictoires).

RÉCIT ORIGINAL:
"${originalContent}"

TÉMOIGNAGE DE ${witnessName.toUpperCase()}:
"${witnessContent}"

RÈGLES:
- Ne relève que les contradictions réelles, pas les simples compléments d'info.
- Évalue la sévérité ('low', 'medium', 'high').

FORMAT DE RÉPONSE (JSON strict):
{
  "hasContradiction": boolean,
  "findings": [
    {
      "topic": "Sujet de la divergence",
      "authorVersion": "Version de l'auteur",
      "witnessVersion": "Version du témoin",
      "severity": "low|medium|high"
    }
  ]
}`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ parts: [{ text: prompt }] }]
        });

        const text = result.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return { hasContradiction: false, findings: [] };
    } catch (error) {
        logger.error('Error detecting contradictions:', error);
        return { hasContradiction: false, findings: [] };
    }
};

/**
 * Merges witness contribution according to 3 arbitration modes
 */
export const arbitrateWitnessContribution = async (
    originalContent: string,
    witnessContent: string,
    witnessName: string,
    mode: 'diplomatic' | 'author' | 'witness'
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const modePrompts = {
        diplomatic: "Mode Nuance : Mentionne les deux versions avec tact, en soulignant le caractère subjectif de la mémoire.",
        author: "Mode Auteur : Garde la version de l'auteur comme vérité principale. Note le doute du témoin de manière discrète ou comme une alternative possible.",
        witness: "Mode Témoin : Adopte la version du témoin si elle semble plus précise ou si elle enrichit le récit, tout en gardant le style de l'auteur."
    };

    const prompt = `Tu es PLUME, un expert en récits de vie.
TÂCHE: Fusionne le témoignage de ${witnessName} avec le récit original de l'auteur en utilisant l'approche suivante :
${modePrompts[mode]}

RÉCIT ORIGINAL:
${originalContent}

TÉMOIGNAGE DE ${witnessName.toUpperCase()}:
${witnessContent}

RÈGLES:
- Écris un récit fluide à la première personne.
- Garde l'émotion et la voix de l'auteur original.
- Ajoute la mention d'attribution à la fin.

FORMAT:
Directement le texte fusionné.`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ parts: [{ text: prompt }] }]
        });

        return result.text?.trim() || originalContent;
    } catch (error) {
        logger.error('Error arbitrating contribution:', error);
        return originalContent;
    }
};

// Save witness contribution to database
export const saveWitnessContribution = async (
    chapterId: string,
    guestName: string,
    guestRelation: string,
    content: string,
    rawResponses: WitnessResponse[]
): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
        const { data, error } = await supabase
            .from('guest_contributions')
            .insert({
                chapter_id: chapterId,
                guest_name: guestName,
                content: content,
                contribution_type: 'text',
                status: 'pending',
                // Store raw responses in metadata if the column exists
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, id: data.id };
    } catch (error: any) {
        logger.error('Error saving witness contribution:', error);
        return { success: false, error: error.message };
    }
};

// Get pending contributions for a user's chapters
export const getPendingContributions = async (
    userId: string
): Promise<WitnessContribution[]> => {
    try {
        const { data, error } = await supabase
            .from('guest_contributions')
            .select(`
        *,
        chapters!inner(id, title, user_id)
      `)
            .eq('chapters.user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        logger.error('Error fetching pending contributions:', error);
        return [];
    }
};

// Update contribution status
export const updateContributionStatus = async (
    contributionId: string,
    status: 'accepted' | 'rejected' | 'integrated'
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('guest_invites') // FIX: Use guest_invites
            .update({ status })
            .eq('id', contributionId);

        if (error) throw error;
        return true;
    } catch (error) {
        logger.error('Error updating contribution status:', error);
        return false;
    }
};

// Generate suggested questions based on memory content
export const suggestWitnessQuestions = async (
    memoryContent: string,
    memoryTitle: string
): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `Analyse ce souvenir et suggère 3 questions que l'auteur pourrait poser à un témoin pour enrichir ce récit.

TITRE: ${memoryTitle}
CONTENU: ${memoryContent.substring(0, 500)}...

Réponds avec un JSON:
{
  "questions": ["Question 1", "Question 2", "Question 3"]
}`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ parts: [{ text: prompt }] }]
        });

        const text = result.text || '';
        const jsonMatch = text.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return parsed.questions || [];
        }
        return [];
    } catch (error) {
        logger.error('Error suggesting witness questions:', error);
        return [];
    }
};
