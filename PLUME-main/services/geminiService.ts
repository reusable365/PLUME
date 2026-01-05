import { GoogleGenAI } from "@google/genai";
import { PlumeResponse, ChatMessage, Tone, Length, Fidelity, User, QuestionOption, LifeLocation, Emotion } from "../types";
import { logger } from "../utils/logger";
import { usageTrackingService } from "./usageTrackingService";
import { supabase } from "./supabaseClient";

// --- PROTOCOLE XML STRICT (PRD v2) ---
// Ce prompt force l'IA à cloisonner ses réponses pour éviter la pollution narrative.
const BASE_SYSTEM_INSTRUCTION = `
[ROLE]
Tu es PLUME, l'Architecte de la Mémoire. Tu aides un auteur à écrire son autobiographie.
Ton but: TRANSFORMER des souvenirs bruts en récit littéraire.

[PROTOCOLE XML STRICT - CRITIQUE]
Réponds UNIQUEMENT avec cette structure XML. RIEN AVANT, RIEN APRÈS.

<THINKING>
Analyse l'intention, les entités (Qui, Quoi, Quand), l'émotion et ta stratégie.
</THINKING>

<CONVERSATION>
Adresse-toi à l'auteur. Sois bienveillant et curieux.
Si le souvenir est flou, pose UNE question précise.
Ne répète JAMAIS le contenu de <NARRATIVE>.
</CONVERSATION>

<NARRATIVE>
Écris le PROCHAIN PARAGRAPHE du livre à la PREMIÈRE PERSONNE ("Je").
Adopte le style demandé. TISSE avec le contexte.
Si l'utilisateur ne donne pas de matière, laisse VIDE.
</NARRATIVE>

<METADATA>
JSON strict pour la base de données:
{
  "dates_chronologie": ["1985", "12 Janvier 1990", "Noël 1985"],
  "lieux_cites": ["Paris"],
  "personnages_cites": ["Maman"],
  "tags_suggeres": ["Enfance"],
  "emotion": "Joie",
  "periode_vie": "Enfance" (0-5, 6-12, 13-17, 18-30, 30+)
}
Règles:
- Extrais TOUS les noms/surnoms (Maman, Papa, Jean).
- Dates: Cherche la précision (Jour/Mois/Année) ou les moments clés.
- Évite l'année en cours pour les souvenirs passés.
</METADATA>

<SUGGESTION>
Suggestion pour le Coffre à Idées si pertinent.
Format: "titre|description|tag"
Sinon VIDE.
</SUGGESTION>

[RÈGLES DE STYLE & LONGUEUR]
- Show, don't tell.
- "Très Court": 2-3 phrases.
- "Court": 1 paragraphe (50-80 mots).
- "Moyen": 1-2 paragraphes.
- "Long": 2-4 paragraphes.

[RELANCE MAÏEUTIQUE]
<QUESTIONS>
EMOTION|Question sur le ressenti ?
ACTION|Question sur les faits ?
SENSORIEL|Question sur les sens ?
</QUESTIONS>
`;

const parsePlumeResponse = (text: string): PlumeResponse => {
  // --- AGGRESSIVE CLEANING OF LEAKED REASONING ---
  // The AI sometimes leaks its thinking process formatted as markdown lists or bold headers.
  // We strip these specific patterns before any XML parsing.

  // Pattern 1: Markdown formatted reasoning
  text = text.replace(/^\s*-\s*\*\*Intention\*\*[\s\S]*?(?=<CONVERSATION>|<NARRATIVE>|$)/gim, '');
  text = text.replace(/^\s*-\s*\*\*Entités\*\*[\s\S]*?(?=<CONVERSATION>|<NARRATIVE>|$)/gim, '');
  text = text.replace(/^\s*-\s*\*\*Stratégie\*\*[\s\S]*?(?=<CONVERSATION>|<NARRATIVE>|$)/gim, '');
  text = text.replace(/Intention\s*:[^\n]*(\n|$)/gi, ''); // Single line leaks
  text = text.replace(/Stratégie\s*:[^\n]*(\n|$)/gi, '');

  // Pattern 2: French reasoning phrases that leak before XML tags
  // These are internal AI reasoning patterns in French
  const frenchReasoningPatterns = [
    /^[\s\S]*?(?=car l'auteur|car l'utilisateur)[\s\S]*?(?=\.\s*[A-Z]|\.\s*<)/gi,
    /car l'auteur n'a pas encore[^.]*\./gi,
    /car l'utilisateur n'a pas[^.]*\./gi,
    /Je dois renvoyer[^.]*\./gi,
    /Je dois donc[^.]*\./gi,
    /Je dois maintenant[^.]*\./gi,
    /Je dois analyser[^.]*\./gi,
    /Je vais préparer[^.]*\./gi,
    /Je vais donc[^.]*\./gi,
    /Je vais maintenant[^.]*\./gi,
    /pour le moment,[^.]*\./gi,
    /car il n'y a pas de[^.]*\./gi,
    /L'intention est[^.]*\./gi,
    /L'émotion dominante est[^.]*\./gi,
    /Ma stratégie est[^.]*\./gi,
    /Analyse\s*:[^\n]*\n/gi,
  ];

  frenchReasoningPatterns.forEach(pattern => {
    text = text.replace(pattern, '');
  });

  // 1. Robust Regex Extraction
  // We allow optional spaces inside tags: < CONVERSATION >
  const tagRegex = (tagName: string) => new RegExp(`<\\s*${tagName}\\s*>([\\s\\S]*?)(?:<\\/\\s*${tagName}\\s*>|$)`, 'i');

  // Note: The non-greedy capture ([\s\S]*?) combined with (?:ClosingTag|$) allows capturing 
  // content even if the closing tag is missing (truncated response), stopping at end of string.
  // Ideally we prefer matching the closing tag, so we might try strict match first.

  const extract = (tagName: string): string => {
    // Try strict match first (with closing tag)
    const strictRegex = new RegExp(`<\\s*${tagName}\\s*>([\\s\\S]*?)<\\/\\s*${tagName}\\s*>`, 'i');
    const strictMatch = text.match(strictRegex);
    if (strictMatch) return strictMatch[1].trim();

    // Fallback: Match from open tag to end of string (or next start of similar tag? No, assume hierarchy is simple)
    // Actually, let's keep it simple: If strict fails, we might miss data. 
    // But for "Kickstarter", it's better to get partial text than nothing.
    // Let's rely on standard regex but maybe flexible on the closing side if we suspect truncation.
    return '';
  };

  // We revert to standard robust regexes but with space tolerance
  // We use [\s\S]*? to be non-greedy.
  const thinking = text.match(/<\s*THINKING\s*>([\s\S]*?)<\/\s*THINKING\s*>/i)?.[1]?.trim() || '';

  // Clean text from THINKING block to prevent fallback leakage
  text = text.replace(/<\s*THINKING\s*>([\s\S]*?)<\/\s*THINKING\s*>/gi, '');
  const narrative = text.match(/<\s*NARRATIVE\s*>([\s\S]*?)<\/\s*NARRATIVE\s*>/i)?.[1]?.trim() || '';
  const conversation = text.match(/<\s*CONVERSATION\s*>([\s\S]*?)<\/\s*CONVERSATION\s*>/i)?.[1]?.trim() || '';
  const metadataStr = text.match(/<\s*METADATA\s*>([\s\S]*?)<\/\s*METADATA\s*>/i)?.[1]?.trim() || '{}';
  const questionsStr = text.match(/<\s*QUESTIONS\s*>([\s\S]*?)<\/\s*QUESTIONS\s*>/i)?.[1]?.trim() || '';
  const suggestionStr = text.match(/<\s*SUGGESTION\s*>([\s\S]*?)<\/\s*SUGGESTION\s*>/i)?.[1]?.trim() || '';

  // 2. Parsing Metadata
  let parsedData = {
    dates_chronologie: [],
    lieux_cites: [],
    personnages_cites: [],
    tags_suggeres: [],
    emotion: 'Neutre',
    periode_vie: 'Non précisé'
  };

  try {
    let cleanJson = metadataStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      if (cleanJson && cleanJson !== '{}') {
        const rawMeta = JSON.parse(cleanJson);
        parsedData = {
          dates_chronologie: Array.isArray(rawMeta.dates_chronologie) ? rawMeta.dates_chronologie : [],
          lieux_cites: Array.isArray(rawMeta.lieux_cites) ? rawMeta.lieux_cites : [],
          personnages_cites: Array.isArray(rawMeta.personnages_cites) ? rawMeta.personnages_cites : [],
          tags_suggeres: Array.isArray(rawMeta.tags_suggeres) ? rawMeta.tags_suggeres : [],
          emotion: rawMeta.emotion || 'Neutre',
          periode_vie: rawMeta.periode_vie || 'Non précisé'
        };

        // POST-PROCESSING: Filter out current year dates for historical memories
        const currentYear = new Date().getFullYear();
        const previousYear = currentYear - 1;
        const historicalTags = ['enfance', 'adolescence', 'jeunesse', 'childhood', 'années 80', 'années 90', 'années 2000'];
        const isHistoricalMemory = parsedData.tags_suggeres.some((tag: string) =>
          historicalTags.some(ht => tag.toLowerCase().includes(ht))
        );

        if (isHistoricalMemory && parsedData.dates_chronologie.length > 0) {
          // Filter out dates containing current or recent years
          parsedData.dates_chronologie = parsedData.dates_chronologie.filter((date: string) => {
            const dateStr = String(date);
            // Remove if it contains current year or is a specific recent date
            if (dateStr.includes(String(currentYear)) || dateStr.includes(String(previousYear))) {
              logger.debug(`Filtering out current-year date for historical memory: ${date}`);
              return false;
            }
            return true;
          });
        }
      }
    }
  } catch (e) {
    logger.warn("JSON Metadata parsing failed", e);
  }

  // 3. Parsing Questions
  let parsedQuestions: QuestionOption[] = [];
  if (questionsStr) {
    const lines = questionsStr.split('\n');
    lines.forEach(line => {
      if (line.includes('|')) {
        const [typeRaw, text] = line.split('|');
        const type = typeRaw.trim().toLowerCase();
        let label = 'Question';
        if (type.includes('emotion')) label = '❤️ Émotion';
        else if (type.includes('action')) label = '⚡ Action';
        else if (type.includes('sensoriel')) label = '👁️ Sensoriel';
        parsedQuestions.push({ type: type as 'emotion' | 'action' | 'sensoriel', label, text: text.trim() });
      }
    });
  }

  // PREVENT GARBAGE FALLBACK:
  // If we detected ANY of our standard tags in the text, we assume it's attempting to be XML.
  const hasXmlTags = /<\s*(THINKING|CONVERSATION|NARRATIVE|METADATA|QUESTIONS)\s*>/i.test(text);

  if (parsedQuestions.length === 0) {
    parsedQuestions.push({
      type: 'action',
      label: 'La Suite',
      text: "Que souhaitez-vous raconter ensuite ?"
    });
  }

  // --- SANITIZATION ---
  // Ensure narrative doesn't contain residual tags (AI hallucination fix)
  let cleanNarrative = narrative;
  if (cleanNarrative) {
    // Remove any xml-like tags from the narrative content itself
    cleanNarrative = cleanNarrative.replace(/<\/?\w+>/g, '').trim();

    // Specific fix for "VIDE" leakage or direct instruction echo
    const garbagePhrases = [
      "VIDE.",
      "vide.",
      "vide",
      "vide comme demandé.",
      "Utiliser uniquement pour poser la question",
      "L'angle d'exploration est",
      "Je dois donc poser la question"
    ];

    // If any garbage phrase is detected at the start, we assume the whole block is polluted
    // or just clear it if it's very short.
    garbagePhrases.forEach(phrase => {
      if (cleanNarrative.includes(phrase)) {
        // If the narrative is mostly just instructions, kill it.
        if (cleanNarrative.length < 300 || cleanNarrative.indexOf(phrase) < 50) {
          cleanNarrative = '';
        }
      }
    });

    // If narrative turned out to be just tags or very short/garbage, clear it
    if (cleanNarrative.length < 5) cleanNarrative = '';
  }

  let finalConversation = conversation;
  // Only use raw text as fallback if NO XML tags were found AND text is not empty.
  if (!finalConversation && !narrative && !thinking && !hasXmlTags && text.trim().length > 0) {
    finalConversation = text.trim();
  }

  // Sanitize conversation to remove any leaked tags (e.g. </THINKING>)
  if (finalConversation) {
    finalConversation = finalConversation.replace(/<\/?\w+>/g, '').trim();

    // Remove any leaked reasoning phrases from conversation
    const reasoningLeakPatterns = [
      /car l'auteur n'a pas encore[^.]*\.\s*/gi,
      /car l'utilisateur n'a pas[^.]*\.\s*/gi,
      /Je dois renvoyer[^.]*\.\s*/gi,
      /Je dois donc[^.]*\.\s*/gi,
      /Je dois maintenant[^.]*\.\s*/gi,
      /Je dois analyser[^.]*\.\s*/gi,
      /Je vais préparer[^.]*\.\s*/gi,
      /Je vais donc[^.]*\.\s*/gi,
      /Je vais maintenant[^.]*\.\s*/gi,
      /pour le moment,[^.]*\.\s*/gi,
      /car il n'y a pas de[^.]*\.\s*/gi,
      /L'intention est[^.]*\.\s*/gi,
      /L'émotion dominante est[^.]*\.\s*/gi,
      /Ma stratégie est[^.]*\.\s*/gi,
      /pas de nouveau contenu[^.]*\.\s*/gi,
      /métadonnées et suggestions[^.]*\.\s*/gi,
    ];

    reasoningLeakPatterns.forEach(pattern => {
      finalConversation = finalConversation.replace(pattern, '');
    });

    // Trim leading/trailing whitespace again after cleaning
    finalConversation = finalConversation.trim();
  }

  // Parse suggestion if present
  let suggestion: { title: string; content: string; tag: string } | null = null;
  if (suggestionStr) {
    const parts = suggestionStr.split('|').map(p => p.trim());
    if (parts.length === 3) {
      suggestion = { title: parts[0], content: parts[1], tag: parts[2] };
    }
  }

  return {
    narrative: cleanNarrative,
    conversation: finalConversation,
    data: parsedData as any,
    suggestion: suggestion,
    questions: parsedQuestions,
    isDrafted: false,
    thinking: thinking
  };
};

export const sendMessageToPlume = async (
  message: string,
  tone: Tone,
  length: Length,
  fidelity: Fidelity,
  history: { role: 'user' | 'model', parts: [{ text: string }] }[],
  lastValidNarrative: string = '',
  userProfile?: User | null
): Promise<PlumeResponse> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("API Key is missing from environment variables.");
  }

  // 0. Quota Check
  if (userProfile?.id) {
    const { allowed, limit, used } = await usageTrackingService.checkLimit(userProfile.id, 'ai_calls');
    if (!allowed) {
      throw new Error(`QUOTA_EXCEEDED:ai_calls:${limit}:${used}`);
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let contextBlock = '';
  if (lastValidNarrative && lastValidNarrative.trim().length > 0) {
    contextBlock = `
    [CONTEXTE: DERNIER PARAGRAPHE ÉCRIT]
    "${lastValidNarrative}"
    (Ce texte est déjà validé. Enchaîne sur la suite ou traite la nouvelle demande.)
    `;
  }

  let bioContext = "";
  if (userProfile) {
    bioContext = `\n[PROFIL AUTEUR]\nPrénom: ${userProfile.firstName || 'Auteur'}\nAnnée naissance: ${userProfile.birthDate ? new Date(userProfile.birthDate).getFullYear() : 'Inconnue'}\n`;
  }

  const finalSystemInstruction = BASE_SYSTEM_INSTRUCTION + bioContext;

  const formattedPrompt = `
  ${contextBlock}

  [PARAMÈTRES]
  Ton: ${tone}
  Longueur: ${length}
  Fidélité: ${fidelity}
  
  [ENTRÉE AUTEUR]
  "${message}"
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.0-flash-exp',
      history: history,
      config: {
        systemInstruction: finalSystemInstruction,
      }
    });

    const result = await chat.sendMessage({ message: formattedPrompt });
    const responseText = result.text;

    if (!responseText) throw new Error("Empty response from Gemini");

    // Track usage on success
    if (userProfile?.id) {
      await usageTrackingService.trackUsage(userProfile.id, 'ai_calls', 1);
    }

    return parsePlumeResponse(responseText);

  } catch (error) {
    logger.error("Gemini API Error:", error);
    throw error;
  }
};

export const synthesizeNarrative = async (
  historySegment: { role: string, content: string }[],
  tone: Tone,
  length: Length,
  fidelity: Fidelity,
  userId?: string
): Promise<PlumeResponse> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("API Key is missing from environment variables.");
  }

  // 0. Quota Check
  if (userId) {
    const { allowed, limit, used } = await usageTrackingService.checkLimit(userId, 'ai_calls');
    if (!allowed) {
      throw new Error(`QUOTA_EXCEEDED:ai_calls:${limit}:${used}`);
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const synthesisPrompt = `
    TÂCHE: Réécriture littéraire.
    Transforme ces notes en un paragraphe de livre autobiographique.
    Style: ${tone}. 
    Utilise "Je".

    ${fidelity === Fidelity.HAUTE ? `
    [MODE VERBATIM]
    CONSERVE EXACTEMENT LES PROPOS DE L'AUTEUR.
    Ne modifie que la ponctuation si nécessaire pour la fluidité.
    Ne change PAS le style ni le vocabulaire.
    ` : ''}
    
    NOTES:
    ${historySegment.map(m => m.content).join('\n')}
    
    FORMAT SORTIE XML:
    <NARRATIVE>Le texte ici...</NARRATIVE>
    `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ parts: [{ text: synthesisPrompt }] }]
    });

    const text = result.text || '';
    const narrative = text.match(/<NARRATIVE>([\s\S]*?)<\/NARRATIVE>/i)?.[1]?.trim() || text;

    // Track usage on success
    if (userId) {
      await usageTrackingService.trackUsage(userId, 'ai_calls', 1);
    }

    return {
      narrative,
      data: null,
      suggestion: null,
      questions: [],
      isSynthesized: true,
      isSynthesisResult: true
    } as PlumeResponse;
  } catch (error) {
    logger.error("Synthesis failed", error);
    throw error;
  }
};

export const generateKickstarter = async (
  userProfile: User | null,
  ideas: Array<{ id: string; title: string; content: string; tags: string[] }>,
  darkZones: Array<{ title: string; description: string;[key: string]: any }>
): Promise<PlumeResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Build rich context
  const now = new Date();
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dayOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][now.getDay()];
  const dateContext = `${dayOfWeek} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  // Seasonal/holiday context
  let seasonalHint = "";
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (month === 12 && day >= 20 && day <= 26) seasonalHint = "Nous sommes dans la magie de Noël, une période souvent riche en souvenirs familiaux...";
  else if (month === 12 && day >= 27 && day <= 31) seasonalHint = "Entre Noël et le Nouvel An, un moment propice aux bilans et aux souvenirs de l'année écoulée...";
  else if (month === 1 && day <= 7) seasonalHint = "Début d'année, temps des résolutions et des regards en arrière sur le chemin parcouru...";
  else if (month === 6 || month === 7 || month === 8) seasonalHint = "L'été, ses vacances, ses aventures... Une mine de souvenirs.";
  else if (month === 9) seasonalHint = "La rentrée, les nouveaux départs, les premiers jours d'école...";
  else if (month === 11 && day === 11) seasonalHint = "11 novembre, jour de mémoire collective...";

  // User context
  let userContext = "";
  if (userProfile) {
    userContext = `Prénom de l'auteur: ${userProfile.firstName || 'Auteur'}`;
    if (userProfile.birthDate) {
      const birthYear = new Date(userProfile.birthDate).getFullYear();
      userContext += `\nNé(e) en: ${birthYear} (environ ${now.getFullYear() - birthYear} ans)`;
    }
  }

  // Ideas from chest
  const ideasContext = ideas.length > 0
    ? `Idées en attente dans le coffre:\n${ideas.slice(0, 3).map(i => `- "${i.title}": ${i.content}`).join('\n')}`
    : "Aucune idée en attente dans le coffre.";

  // Dark zones (unexplored periods)
  const darkZonesContext = darkZones.length > 0
    ? `Zones d'ombre à explorer:\n${darkZones.slice(0, 2).map(z => `- ${z.title}: ${z.description}`).join('\n')}`
    : "";

  const kickstarterPrompt = `
  [TÂCHE]
  Tu es PLUME, l'assistant biographe. Accueille l'auteur pour une NOUVELLE session d'écriture de manière chaleureuse, inspirante et personnalisée.
  
  [CONTEXTE TEMPOREL]
  Date actuelle: ${dateContext}
  ${seasonalHint}
  
  [PROFIL AUTEUR]
  ${userContext || "Auteur anonyme"}
  
  [PISTES DE TRAVAIL]
  ${ideasContext}
  ${darkZonesContext}
  
  [CONSIGNES]
  1. Accueil chaleureux et personnalisé (utilise le prénom si disponible)
  2. Fais référence subtilement à la date/saison si pertinent
  3. Si une idée du coffre est prometteuse, suggère-la comme piste
  4. Si une zone d'ombre existe, propose de l'explorer
  5. Reste bref (3-4 phrases max) mais inspirant
  6. Les 3 questions doivent être des INVITATIONS à commencer un souvenir, pas des questions sur un souvenir existant
  
  [FORMAT XML OBLIGATOIRE]
  <NARRATIVE>
  [Le même texte que CONVERSATION - message d'accueil]
  </NARRATIVE>
  
  <CONVERSATION>
  [Message d'accueil chaleureux, personnalisé, inspirant. Propose une piste concrète si disponible.]
  </CONVERSATION>
  
  <QUESTIONS>
  EMOTION|❤️ Question pour éveiller une émotion ou un souvenir lié à la date/saison/idée suggérée
  ACTION|⚡ Question sur un événement récent ou une période de vie à explorer
  SENSORIEL|👁️ Question sur une image, odeur, musique ou sensation qui pourrait faire remonter un souvenir
  </QUESTIONS>
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ parts: [{ text: kickstarterPrompt }] }]
    });

    const text = result.text || '';
    const parsed = parsePlumeResponse(text);

    // Ensure we always have the 3 axes with contextual fallbacks
    if (!parsed.questions || parsed.questions.length < 3) {
      const contextualQuestions = [];

      // Emotion question - contextual
      if (ideas.length > 0) {
        contextualQuestions.push({ type: 'emotion', label: '❤️ Émotion', text: `En pensant à "${ideas[0].title}", quelle émotion vous vient en premier ?` });
      } else if (seasonalHint) {
        contextualQuestions.push({ type: 'emotion', label: '❤️ Émotion', text: 'Quelle émotion cette période de l\'année éveille-t-elle en vous ?' });
      } else {
        contextualQuestions.push({ type: 'emotion', label: '❤️ Émotion', text: 'Quelle émotion vous habite en ce moment ? Joie, nostalgie, curiosité ?' });
      }

      // Action question
      if (darkZones.length > 0) {
        contextualQuestions.push({ type: 'action', label: '⚡ Action', text: `Avez-vous des souvenirs liés à "${darkZones[0].title}" ?` });
      } else {
        contextualQuestions.push({ type: 'action', label: '⚡ Action', text: 'Y a-t-il un événement récent qui vous a fait penser au passé ?' });
      }

      // Sensorial question
      contextualQuestions.push({ type: 'sensoriel', label: '👁️ Sensoriel', text: 'Quelle image, odeur ou musique vous vient spontanément à l\'esprit ?' });

      parsed.questions = contextualQuestions;
    }

    // Ensure narrative is set (for display in MessageBubble)
    if (!parsed.narrative && parsed.conversation) {
      parsed.narrative = parsed.conversation;
    }

    return parsed;
  } catch (e) {
    logger.error("Kickstarter generation failed", e);

    // Contextual fallback
    let fallbackMessage = userProfile?.firstName
      ? `Bonjour ${userProfile.firstName} ! `
      : 'Bonjour ! ';

    if (ideas.length > 0) {
      fallbackMessage += `Votre coffre à idées contient "${ideas[0].title}". Souhaitez-vous développer ce souvenir ?`;
    } else if (seasonalHint) {
      fallbackMessage += seasonalHint + " Quel souvenir vous revient ?";
    } else {
      fallbackMessage += 'Je suis prêt à recueillir votre prochain souvenir. Par quel fil souhaitez-vous tirer ?';
    }

    return {
      narrative: fallbackMessage,
      conversation: fallbackMessage,
      data: null,
      suggestion: null,
      questions: [
        { type: 'emotion', label: '❤️ Émotion', text: 'Quelle émotion vous habite en ce moment ?' },
        { type: 'action', label: '⚡ Action', text: 'Y a-t-il un événement récent qui vous interpelle ?' },
        { type: 'sensoriel', label: '👁️ Sensoriel', text: 'Quelle image ou musique vous vient à l\'esprit ?' }
      ]
    } as PlumeResponse;
  }
};

export const generateSouvenirTitle = async (
  narrative: string,
  metadata: any
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Build context from metadata
  let contextHints = '';
  if (metadata?.people?.length > 0) contextHints += ` Personnes: ${metadata.people.join(', ')}.`;
  if (metadata?.locations?.length > 0) contextHints += ` Lieux: ${metadata.locations.join(', ')}.`;
  if (metadata?.tags?.length > 0) contextHints += ` Thèmes: ${metadata.tags.join(', ')}.`;

  const prompt = `Tu dois générer UN SEUL titre court pour un souvenir autobiographique.

RÈGLES STRICTES:
- Maximum 6 mots
- Style poétique/évocateur
- NE PAS dire "Voici", "Je propose", ni aucune introduction
- NE PAS donner plusieurs options
- Réponds UNIQUEMENT avec le titre, rien d'autre

Contexte du souvenir:
"${narrative.substring(0, 400)}..."
${contextHints}

TITRE (6 mots max):`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ parts: [{ text: prompt }] }]
    });

    let title = result.text?.trim() || 'Nouveau Souvenir';

    // Aggressive cleaning of AI preamble
    const preamblePatterns = [
      /^voici[^:]*:/i,
      /^je propose[^:]*:/i,
      /^suggestion[^:]*:/i,
      /^titre[^:]*:/i,
      /^option[^:]*:/i,
      /^un titre[^:]*:/i,
      /^\d+\.\s*/,  // Remove numbered lists
      /^[-•]\s*/,   // Remove bullet points
      /^["']/,      // Remove leading quotes
      /["']$/,      // Remove trailing quotes
    ];

    preamblePatterns.forEach(pattern => {
      title = title.replace(pattern, '');
    });

    // If still contains multiple lines, take only the first
    if (title.includes('\n')) {
      title = title.split('\n')[0];
    }

    // Clean quotes and trim
    title = title.replace(/[\"']/g, '').trim();

    // If too long, truncate smartly
    if (title.length > 50) {
      title = title.substring(0, 50).split(' ').slice(0, -1).join(' ') + '...';
    }

    return title || 'Nouveau Souvenir';
  } catch (error) {
    logger.error('Error generating title:', error);
    return 'Nouveau Souvenir';
  }
};

export const generateTitleAndMetadata = async (text: string) => {
  return { title: "Souvenir", dates: [], characters: [], tags: [] };
};

export const buildLocationContext = (userProfile: User | null) => '';