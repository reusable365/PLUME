import { GoogleGenAI } from "@google/genai";
import { supabase } from './supabaseClient';
import { BookStructure, BookStructureMode, BookChapter, User } from '../types';
import { logger } from '../utils/logger';

/**
 * Book Architect Service
 * Analyzes all memories and generates intelligent book structures
 */

interface Memory {
    id: string;
    title: string;
    content: string;
    created_at: string;
    metadata?: {
        dates?: string[];
        characters?: string[];
        tags?: string[];
    };
}

/**
 * Fetch all published memories for a user
 */
const fetchUserMemories = async (userId: string): Promise<Memory[]> => {
    const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: true });

    if (error) {
        logger.error('Failed to fetch user memories', error);
        throw error;
    }

    return data as Memory[];
};

/**
 * Generate a chronological book structure
 */
export const generateChronologicalStructure = async (
    userId: string,
    userProfile: User | null
): Promise<BookStructure> => {
    const memories = await fetchUserMemories(userId);

    if (memories.length === 0) {
        throw new Error('Aucun souvenir disponible pour générer une structure');
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Prepare context for AI
    const memoriesSummary = memories.map(m => ({
        id: m.id,
        title: m.title,
        dates: m.metadata?.dates || [],
        excerpt: m.content.substring(0, 200)
    }));

    const birthYear = userProfile?.birthDate ? new Date(userProfile.birthDate).getFullYear() : null;

    const prompt = `
Tu es un expert en biographie et en architecture narrative.

MISSION: Créer une structure de livre CHRONOLOGIQUE basée sur ces souvenirs.

CONTEXTE AUTEUR:
${birthYear ? `- Année de naissance: ${birthYear}` : '- Date de naissance inconnue'}
- Nombre de souvenirs: ${memories.length}

SOUVENIRS DISPONIBLES:
${JSON.stringify(memoriesSummary, null, 2)}

INSTRUCTIONS:
1. Analyse les dates et périodes mentionnées dans les souvenirs
2. Identifie les grandes phases de vie (ex: Enfance 1950-1960, Adolescence 1960-1968, etc.)
3. Crée des chapitres chronologiques cohérents
4. Assigne chaque souvenir au chapitre approprié
5. Propose un titre de livre évocateur
6. Estime le nombre de pages par chapitre (1 souvenir ≈ 3 pages)

FORMAT JSON STRICT:
{
  "title": "Titre du livre",
  "subtitle": "Sous-titre optionnel",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Titre du chapitre",
      "description": "Description courte de cette période",
      "memoryIds": ["id1", "id2"],
      "order": 1,
      "estimatedPages": 12,
      "period": "1950-1960"
    }
  ],
  "rationale": "Explication de ta structure en 2-3 phrases"
}

Réponds UNIQUEMENT avec le JSON.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.7,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.text.trim();
        const parsedData = JSON.parse(responseText);

        const totalPages = parsedData.chapters.reduce((sum: number, ch: any) => sum + (ch.estimatedPages || 0), 0);

        const structure: BookStructure = {
            mode: 'chronological',
            title: parsedData.title || 'Mon Histoire',
            subtitle: parsedData.subtitle,
            chapters: parsedData.chapters.map((ch: any, idx: number) => ({
                id: ch.id || `chapter-${idx + 1}`,
                title: ch.title,
                description: ch.description || '',
                memoryIds: ch.memoryIds || [],
                order: ch.order || idx + 1,
                estimatedPages: ch.estimatedPages || 10,
                period: ch.period
            })),
            totalEstimatedPages: totalPages,
            rationale: parsedData.rationale,
            generatedAt: new Date().toISOString()
        };

        return structure;

    } catch (error) {
        logger.error('Failed to generate chronological book structure', error);
        throw error;
    }
};

/**
 * Generate a thematic book structure
 */
export const generateThematicStructure = async (
    userId: string,
    userProfile: User | null
): Promise<BookStructure> => {
    const memories = await fetchUserMemories(userId);

    if (memories.length === 0) {
        throw new Error('Aucun souvenir disponible pour générer une structure');
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const memoriesSummary = memories.map(m => ({
        id: m.id,
        title: m.title,
        tags: m.metadata?.tags || [],
        excerpt: m.content.substring(0, 200)
    }));

    const prompt = `
Tu es un expert en biographie et en architecture narrative.

MISSION: Créer une structure de livre THÉMATIQUE basée sur ces souvenirs.

CONTEXTE:
- Nombre de souvenirs: ${memories.length}

SOUVENIRS DISPONIBLES:
${JSON.stringify(memoriesSummary, null, 2)}

INSTRUCTIONS:
1. Identifie les grands thèmes récurrents (ex: Famille, Voyages, Carrière, Passions, Épreuves)
2. Regroupe les souvenirs par thème
3. Crée des chapitres thématiques captivants
4. Assigne chaque souvenir au thème le plus pertinent
5. Propose un titre de livre évocateur
6. Ordonne les chapitres de manière cohérente (pas forcément alphabétique)

FORMAT JSON STRICT:
{
  "title": "Titre du livre",
  "subtitle": "Sous-titre optionnel",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Titre du chapitre thématique",
      "description": "Description du thème",
      "memoryIds": ["id1", "id2"],
      "order": 1,
      "estimatedPages": 15,
      "theme": "Famille"
    }
  ],
  "rationale": "Explication de ta structure en 2-3 phrases"
}

Réponds UNIQUEMENT avec le JSON.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.8,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.text.trim();
        const parsedData = JSON.parse(responseText);

        const totalPages = parsedData.chapters.reduce((sum: number, ch: any) => sum + (ch.estimatedPages || 0), 0);

        const structure: BookStructure = {
            mode: 'thematic',
            title: parsedData.title || 'Mosaïque de Vie',
            subtitle: parsedData.subtitle,
            chapters: parsedData.chapters.map((ch: any, idx: number) => ({
                id: ch.id || `chapter-${idx + 1}`,
                title: ch.title,
                description: ch.description || '',
                memoryIds: ch.memoryIds || [],
                order: ch.order || idx + 1,
                estimatedPages: ch.estimatedPages || 10,
                theme: ch.theme
            })),
            totalEstimatedPages: totalPages,
            rationale: parsedData.rationale,
            generatedAt: new Date().toISOString()
        };

        return structure;

    } catch (error) {
        logger.error('Failed to generate thematic book structure', error);
        throw error;
    }
};

/**
 * Generate an expert AI-driven book structure
 * This is the most sophisticated mode where AI acts as a professional biographer
 */
export const generateExpertStructure = async (
    userId: string,
    userProfile: User | null
): Promise<BookStructure> => {
    const memories = await fetchUserMemories(userId);

    if (memories.length === 0) {
        throw new Error('Aucun souvenir disponible pour générer une structure');
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const memoriesSummary = memories.map(m => ({
        id: m.id,
        title: m.title,
        tags: m.metadata?.tags || [],
        characters: m.metadata?.characters || [],
        dates: m.metadata?.dates || [],
        excerpt: m.content.substring(0, 300)
    }));

    const birthYear = userProfile?.birthDate ? new Date(userProfile.birthDate).getFullYear() : null;

    const prompt = `
Tu es un biographe professionnel de renommée mondiale, expert en dramaturgie narrative.

MISSION: Créer la MEILLEURE structure de livre possible pour cette autobiographie.
Tu as une liberté créative totale. Utilise ton expertise pour créer quelque chose d'unique et captivant.

CONTEXTE AUTEUR:
${birthYear ? `- Année de naissance: ${birthYear}` : '- Date de naissance inconnue'}
${userProfile?.firstName ? `- Prénom: ${userProfile.firstName}` : ''}
- Nombre de souvenirs: ${memories.length}

SOUVENIRS DISPONIBLES:
${JSON.stringify(memoriesSummary, null, 2)}

INSTRUCTIONS EXPERTES:
1. Analyse la dramaturgie naturelle de cette vie
2. Identifie les arcs narratifs, les moments charnières, les thèmes récurrents
3. Détecte les connexions subtiles entre les souvenirs
4. Crée une structure qui raconte une HISTOIRE, pas juste une chronologie
5. Considère des techniques narratives avancées:
   - Commencer par un moment fort (in medias res)
   - Utiliser des flashbacks stratégiques
   - Créer des parallèles thématiques
   - Construire une montée dramatique
6. Propose un titre littéraire et évocateur
7. Explique ta vision éditoriale

FORMAT JSON STRICT:
{
  "title": "Titre littéraire du livre",
  "subtitle": "Sous-titre optionnel",
  "chapters": [
    {
      "id": "chapter-1",
      "title": "Titre du chapitre",
      "description": "Description narrative du chapitre",
      "memoryIds": ["id1", "id2"],
      "order": 1,
      "estimatedPages": 18
    }
  ],
  "rationale": "Explication détaillée de ta vision éditoriale et de tes choix narratifs (3-5 phrases)"
}

Sois audacieux et créatif. Crée une structure digne d'un best-seller.
Réponds UNIQUEMENT avec le JSON.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.9,
                topP: 0.95,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.text.trim();
        const parsedData = JSON.parse(responseText);

        const totalPages = parsedData.chapters.reduce((sum: number, ch: any) => sum + (ch.estimatedPages || 0), 0);

        const structure: BookStructure = {
            mode: 'expert',
            title: parsedData.title || 'Une Vie Extraordinaire',
            subtitle: parsedData.subtitle,
            chapters: parsedData.chapters.map((ch: any, idx: number) => ({
                id: ch.id || `chapter-${idx + 1}`,
                title: ch.title,
                description: ch.description || '',
                memoryIds: ch.memoryIds || [],
                order: ch.order || idx + 1,
                estimatedPages: ch.estimatedPages || 10
            })),
            totalEstimatedPages: totalPages,
            rationale: parsedData.rationale,
            generatedAt: new Date().toISOString()
        };

        return structure;

    } catch (error) {
        logger.error('Failed to generate expert book structure', error);
        throw error;
    }
};

/**
 * Main function to generate book structure based on selected mode
 */
export const generateBookStructure = async (
    mode: BookStructureMode,
    userId: string,
    userProfile: User | null
): Promise<BookStructure> => {
    switch (mode) {
        case 'chronological':
            return generateChronologicalStructure(userId, userProfile);
        case 'thematic':
            return generateThematicStructure(userId, userProfile);
        case 'expert':
            return generateExpertStructure(userId, userProfile);
        default:
            throw new Error(`Unknown mode: ${mode}`);
    }
};
