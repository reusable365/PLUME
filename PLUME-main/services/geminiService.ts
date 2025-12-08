import { GoogleGenAI } from "@google/genai";
import { PlumeResponse, ChatMessage, Tone, Length, Fidelity, User, QuestionOption, LifeLocation, Emotion } from "../types";
import { logger } from "../utils/logger";

// --- PROTOCOLE XML STRICT (PRD v2) ---
// Ce prompt force l'IA à cloisonner ses réponses pour éviter la pollution narrative.
const BASE_SYSTEM_INSTRUCTION = `
[ROLE]
Tu es PLUME, l'Architecte de la Mémoire. Tu assistes un auteur dans la rédaction de son autobiographie.
Ton but n'est pas de discuter pour rien, mais de TRANSFORMER ses souvenirs bruts en récit littéraire.

[PROTOCOLE DE RÉPONSE - CRITIQUE]
Tu dois TOUJOURS répondre en utilisant STRICTEMENT cette structure XML. 
N'écris RIEN en dehors des balises.

<THINKING>
(Analyse ici la demande de l'auteur. Identifie :
- L'intention : Est-ce une nouvelle pierre à l'édifice ou une simple remarque ?
- Les entités : Qui, Quoi, Où, Quand ?
- L'émotion dominante.
- La stratégie : Dois-je poser une question ou écrire ?)
</THINKING>

<CONVERSATION>
(Ici, adresse-toi directement à l'auteur.
- Sois bienveillant, curieux et encourageant.
- Si le souvenir est flou, pose UNE question précise pour débloquer un détail sensoriel.
- Ne répète JAMAIS ce que tu as écrit dans <NARRATIVE>.
- RESTE DANS LE RÔLE D'ASSISTANT. Ne "joue" pas le souvenir.)
</CONVERSATION>

<NARRATIVE>
(Ici, écris le PROCHAIN PARAGRAPHE du livre.
- Utilise la PREMIÈRE PERSONNE ("Je").
- Adopte le style demandé (Ton/Longueur).
- TISSE le nouveau souvenir avec les précédents si pertinent.
- Si l'utilisateur ne donne pas de matière substantielle, laisse cette balise VIDE.
- NE RÉSUME PAS ce qui a déjà été écrit. AVANCE.)
</NARRATIVE>

<METADATA>
(JSON strict pour alimenter la base de données.
{
  "dates_chronologie": ["1995", "Été 2002"],
  "lieux_cites": ["Chambéry", "Plage de Nice"],
  "personnages_cites": ["Grand-mère"],
  "tags_suggeres": ["Enfance", "Vacances"],
  "emotion": "Nostalgie"
}
Si rien de nouveau, renvoie des tableaux vides.)
</METADATA>

[RÈGLES DE STYLE]
- Ton : Adapte-toi au paramètre fourni (ex: Authentique = oral, simple).
- Fais sentir, ne dis pas (Show, don't tell).

[RELANCE MAÏEUTIQUE]
Pour finir, propose 3 angles de relance dans cette balise spéciale :
<QUESTIONS>
EMOTION|Question sur le ressenti ?
ACTION|Question sur les faits ?
SENSORIEL|Question sur les sens (odeur, lumière) ?
</QUESTIONS>
`;

const parsePlumeResponse = (text: string): PlumeResponse => {
  // 0. Pre-cleaning: Remove potential "thinking" or garbage before the first XML tag
  // If the AI writes "Sure, here is the XML: <THINKING>...", we want to ignore the prefix.
  let cleanText = text;
  const firstTagIndex = text.search(/<(THINKING|CONVERSATION|NARRATIVE|METADATA|QUESTIONS)>/);
  if (firstTagIndex > 0) {
    cleanText = text.substring(firstTagIndex);
  }

  // 1. Extraction via Regex XML robustes
  const thinking = cleanText.match(/<THINKING>([\s\S]*?)<\/THINKING>/i)?.[1]?.trim() || '';
  const narrative = cleanText.match(/<NARRATIVE>([\s\S]*?)<\/NARRATIVE>/i)?.[1]?.trim() || '';
  const conversation = cleanText.match(/<CONVERSATION>([\s\S]*?)<\/CONVERSATION>/i)?.[1]?.trim() || '';
  const metadataStr = cleanText.match(/<METADATA>([\s\S]*?)<\/METADATA>/i)?.[1]?.trim() || '{}';
  const questionsStr = cleanText.match(/<QUESTIONS>([\s\S]*?)<\/QUESTIONS>/i)?.[1]?.trim() || '';

  // 2. Parsing Metadata
  let parsedData = {
    dates_chronologie: [],
    lieux_cites: [],
    personnages_cites: [],
    tags_suggeres: [],
    emotion: 'Neutre'
  };

  try {
    let cleanJson = metadataStr.replace(/```json/g, '').replace(/```/g, '').trim();
    // Improved sanitization: Find first { and last }
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
          emotion: rawMeta.emotion || 'Neutre'
        };
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

        if (text && text.trim()) {
          parsedQuestions.push({
            type: type as any,
            label,
            text: text.trim()
          });
        }
      }
    });
  }

  if (parsedQuestions.length === 0) {
    parsedQuestions.push({
      type: 'action',
      label: 'La Suite',
      text: "Que souhaitez-vous raconter ensuite ?"
    });
  }

  // Fallback: If no conversation extracted but text exists and no tags found, use raw text (for backward compatibility or errors)
  let finalConversation = conversation;
  if (!finalConversation && !narrative && !thinking && firstTagIndex === -1 && text.trim().length > 0) {
    finalConversation = text.trim();
  }

  return {
    narrative: narrative,
    conversation: finalConversation,
    data: parsedData as any,
    suggestion: null,
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
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: finalSystemInstruction,
      }
    });

    const result = await chat.sendMessage({ message: formattedPrompt });
    const responseText = result.text;

    if (!responseText) throw new Error("Empty response from Gemini");

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
  fidelity: Fidelity
): Promise<PlumeResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: synthesisPrompt }] }]
    });

    const text = result.text || '';
    const narrative = text.match(/<NARRATIVE>([\s\S]*?)<\/NARRATIVE>/i)?.[1]?.trim() || text;

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
  darkZones: Array<{ title: string; description: string; category: string }>
): Promise<PlumeResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  let bioContext = "";
  if (userProfile) {
    bioContext = `\nPrénom: ${userProfile.firstName || 'Auteur'}\n`;
  }

  const kickstarterPrompt = `
  [TÂCHE]
  Accueille l'auteur pour une nouvelle session d'écriture.
  
  [CONTEXTE]
  ${bioContext}
  Idées en attente: ${ideas.slice(0, 3).map(i => i.title).join(', ')}
  
  [FORMAT XML OBLIGATOIRE]
  <CONVERSATION>
  Message d'accueil chaleureux et court (2 phrases). Propose d'explorer une idée du coffre si pertinent.
  </CONVERSATION>
  
  <QUESTIONS>
  EMOTION|Question inspirante sur l'humeur du jour ?
  ACTION|Question sur un événement récent ?
  SENSORIEL|Question sur une image ou une odeur ?
  </QUESTIONS>
  `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: kickstarterPrompt }] }]
    });

    const text = result.text || '';
    return parsePlumeResponse(text);
  } catch (e) {
    return {
      narrative: '',
      data: null,
      suggestion: null,
      questions: [{ type: 'action', label: 'Départ', text: 'Par quoi commençons-nous ?' }]
    } as PlumeResponse;
  }
};

export const generateSouvenirTitle = async (
  narrative: string,
  metadata: any
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const prompt = `Génère un titre court (max 6 mots) pour ce texte : "${narrative.substring(0, 300)}..."`;
  const result = await ai.models.generateContent({ model: 'gemini-1.5-flash', contents: [{ parts: [{ text: prompt }] }] });
  return result.text?.replace(/["']/g, '').trim().substring(0, 50) || 'Nouveau Souvenir';
};

export const generateTitleAndMetadata = async (text: string) => {
  return { title: "Souvenir", dates: [], characters: [], tags: [] };
};

export const buildLocationContext = (userProfile: User | null) => '';