import { GoogleGenAI } from "@google/genai";
import { Tone, Length, PlumeResponse, QuestionOption, User, Fidelity } from "../types";

const BASE_SYSTEM_INSTRUCTION = `
[RÔLE SYSTÈME CRITIQUE]
Vous êtes PLUME, l'agent expert IA au service de l'utilisateur, l'Écrivain. Votre mission est d'accompagner la rédaction d'une autobiographie.

[PARAMÈTRES DE RÉDACTION]
Vous recevrez des paramètres de Ton, Longueur et Fidélité.
- Ton : C'est le style principal à adopter.
  - 'Authentique': Sincère, factuel, proche du témoignage.
  - 'Humour': Léger, parfois ironique, avec des pointes d'esprit.
  - 'Poétique': Littéraire, riche en métaphores et figures de style.
  - 'Direct': Concis, sobre, allant droit au but.
  - 'Nostalgique': Mélancolique, empreint de douceur et de regret, évoque le temps qui passe.
  - 'Lyrique': Expressif, musical, chargé d'émotions intenses.
  - 'Contemplatif': Réflexif, philosophique, introspectif.
  - 'Épique': Grandiose, dramatique, héroïque pour les grands moments de vie.
  - 'Intimiste': Confidentiel, pudique, en demi-teinte.
- Longueur : Court, Moyen, ou Long.
- Fidélité : C'est le niveau de respect de l'entrée originale.
  - 'Haute': Reste très proche du texte source, corrige la grammaire, la syntaxe, mais n'invente rien. Agis comme un correcteur précis.
  - 'Basse': Prends des libertés créatives. Embellis le récit, ajoute des détails pertinents, agis comme un nègre littéraire créatif pour rendre le texte plus engageant.
Interprétez ces trois paramètres pour moduler votre prose.

[GESTION DE LA MÉMOIRE & DU CONTEXTE]
Vous recevrez parfois un bloc [DERNIER_RECIT_VALIDE]. Ce texte vient d'être versé dans le livre par l'auteur.
Règle d'Or : NE RÉÉCRIVEZ PAS ce qui est dans ce bloc. C'est du passé.
Votre rôle est de :
1. Enchaîner directement sur la SUITE (nouvelle action, nouveau temps).
2. Ou traiter le NOUVEAU sujet demandé par l'utilisateur.
3. Ne jamais résumer le [DERNIER_RECIT_VALIDE] dans votre réponse narrative.

[FLUX DE TRAVAIL]
1. ANALYSE ET RÉDACTION (Synthèse Narrative) : Transformez les notes de l'Écrivain en un paragraphe narratif structuré. Balise : [TEXTE_PLUME].

2. EXTRACTION D'ENTITÉS (Structuration) : OBLIGATOIRE. Tu DOIS TOUJOURS générer un objet JSON parsable.
    IMPORTANT : Pour les dates, sois proactif. Si l'auteur dit "j'avais 10 ans", calcule l'année grâce à sa date de naissance (fournie en contexte) et ajoute-la (ex: "1985 (10 ans)").
    
    Voici le format EXACT que tu DOIS copier-coller pour ce bloc :
    [DATA_EXTRACTION]
    {
      "dates_chronologie": ["1995", "Années 80", "Vers ses 12 ans (1990)"],
      "personnages_cites": ["Prénom Nom", "Autre Personnage"],
      "tags_suggeres": ["Thème 1", "Thème 2"]
    }
    [/END_DATA_EXTRACTION]
    Si aucune entité n'est trouvée, tu dois retourner :
    [DATA_EXTRACTION]
    {
      "dates_chronologie": [],
      "personnages_cites": [],
      "tags_suggeres": []
    }
    [/END_DATA_EXTRACTION]


3. COFFRE À IDÉE (Suggestion Compacte) : Si un thème secondaire mérite d'être creusé, proposez-le sous un format structuré pipe-separated : "TITRE (5 mots max) | RÉSUMÉ (1 phrase ultra-concise) | CATEGORIE".
    Exemple : [SUGGESTION_IDEA]La vieille maison|L'odeur des combles mérite une description sensorielle.|Lieu[/SUGGESTION_IDEA]

4. RELANCE MAÏEUTIQUE (3 ANGLES) : Au lieu d'une seule question, proposez impérativement 3 questions distinctes pour guider la suite, séparées par le symbole #.
    - Angle 1 (Émotionnel) : Introspection, ressenti profond.
    - Angle 2 (Narratif/Conflit) : Action, conséquence, obstacle.
    - Angle 3 (Descriptif/Sensoriel) : Atmosphère, détails visuels ou sonores.
    
    Format obligatoire :
    [QUESTIONS_CHOIX]EMOTION|Question émotionnelle ?#ACTION|Question sur l'action ?#SENSORIEL|Question descriptive ?[/QUESTIONS_CHOIX]

[FORMAT DE SORTIE OBLIGATOIRE]
Ne répondez qu'avec ces balises.

[TEXTE_PLUME]
...
[/TEXTE_PLUME]

[DATA_EXTRACTION]
{...}
[END_DATA_EXTRACTION]

[SUGGESTION_IDEA]
Titre|Résumé|Tag (ou VIDE)
[/SUGGESTION_IDEA]

[QUESTIONS_CHOIX]
EMOTION|...#ACTION|...#SENSORIEL|...
[/QUESTIONS_CHOIX]
`;

const parsePlumeResponse = (text: string): PlumeResponse => {
  const narrativeMatch = text.match(/\[TEXTE_PLUME\]([\s\S]*?)\[\/TEXTE_PLUME\]/);
  const jsonMatch = text.match(/\[DATA_EXTRACTION\]([\s\S]*?)\[\/END_DATA_EXTRACTION\]/);
  const suggestionMatch = text.match(/\[SUGGESTION_IDEA\]([\s\S]*?)\[\/SUGGESTION_IDEA\]/);
  const questionsMatch = text.match(/\[QUESTIONS_CHOIX\]([\s\S]*?)\[\/QUESTIONS_CHOIX\]/);

  const jsonString = jsonMatch ? jsonMatch[1] : (text.match(/```json\n([\s\S]*?)\n```/)?.[1] || "{}");
  let parsedData = null;
  try {
    const rawData = JSON.parse(jsonString);
    if (rawData) {
      parsedData = {
        dates_chronologie: Array.isArray(rawData.dates_chronologie) ? rawData.dates_chronologie : [],
        personnages_cites: Array.isArray(rawData.personnages_cites) ? rawData.personnages_cites : [],
        tags_suggeres: Array.isArray(rawData.tags_suggeres) ? rawData.tags_suggeres : []
      };
    }
  } catch (e) {
    console.warn("Failed to parse extracted data JSON", e);
    // Assurer que parsedData est toujours un objet valide même en cas d'erreur de parsing
    parsedData = { dates_chronologie: [], personnages_cites: [], tags_suggeres: [] };
  }

  let parsedSuggestion = null;
  if (suggestionMatch) {
    const rawSugg = suggestionMatch[1].trim();
    if (rawSugg !== "VIDE") {
      const parts = rawSugg.split('|');
      if (parts.length >= 2) {
        parsedSuggestion = {
          title: parts[0].trim(),
          content: parts[1].trim(),
          tag: parts[2] ? parts[2].trim() : 'Général'
        };
      } else {
        parsedSuggestion = {
          title: "Idée détectée",
          content: rawSugg,
          tag: "Général"
        };
      }
    }
  }

  let parsedQuestions: QuestionOption[] = [];
  if (questionsMatch) {
    const rawQs = questionsMatch[1].trim().split('#');
    rawQs.forEach(q => {
      const parts = q.split('|');
      if (parts.length === 2) {
        let type: 'emotion' | 'action' | 'descriptif' = 'descriptif';
        let label = 'Descriptif';

        if (parts[0].includes('EMOTION')) { type = 'emotion'; label = '❤️ Émotion'; }
        else if (parts[0].includes('ACTION')) { type = 'action'; label = '⚡ Action'; }
        else if (parts[0].includes('SENSORIEL')) { type = 'descriptif'; label = '👁️ Sensoriel'; }

        parsedQuestions.push({
          type,
          label,
          text: parts[1].trim()
        });
      }
    });
  }

  // S'assurer qu'il y a toujours au moins une question
  if (parsedQuestions.length === 0) {
    parsedQuestions.push({
      type: 'action',
      label: 'La Suite',
      text: "Que souhaitez-vous raconter ensuite ?"
    });
  }

  return {
    narrative: narrativeMatch ? narrativeMatch[1].trim() : text,
    data: parsedData,
    suggestion: parsedSuggestion,
    questions: parsedQuestions
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
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing from environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let contextBlock = '';
  if (lastValidNarrative && lastValidNarrative.trim().length > 0) {
    contextBlock = `
===================================================
[DERNIER_RECIT_VALIDE]
"${lastValidNarrative}"
[/DERNIER_RECIT_VALIDE]
⚠️ INSTRUCTION DE FLUX : Le texte ci-dessus vient d'être terminé et validé par l'auteur.
IL EST INTERDIT DE LE RÉPÉTER, DE LE PARAPHRASER OU DE LE RÉSUMER.
Considère ce récit comme le "Chapitre Précédent".
Ton objectif est maintenant d'écrire la SUITE immédiate ou de traiter la nouvelle demande ci-dessous.
===================================================
`;
  }

  // Construction du contexte biographique
  let bioContext = "";
  if (userProfile) {
    bioContext = `\n[CONTEXTE BIOGRAPHIQUE DE L'AUTEUR]\n`;
    if (userProfile.firstName) bioContext += `Prénom: ${userProfile.firstName}\n`;
    if (userProfile.birthDate) {
      bioContext += `Date de naissance: ${userProfile.birthDate}\n`;
      const birthYear = new Date(userProfile.birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      bioContext += `Âge actuel approx: ${currentYear - birthYear} ans.\n`;
      bioContext += `Important: Utilise cette date pour situer l'âge de l'auteur dans ses souvenirs (ex: s'il parle de 1990, calcule son âge à ce moment-là).\n`;
    }
  }

  const finalSystemInstruction = BASE_SYSTEM_INSTRUCTION + bioContext;

  const formattedPrompt = `
  ${contextBlock}

  PARAMÈTRES: Ton=${tone}, Longueur=${length}, Fidélité=${fidelity}
  
  NOUVELLE ENTRÉE DE L'AUTEUR:
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
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const synthesizeNarrative = async (
  historySegment: { role: string, content: string }[],
  tone: Tone,
  length: Length,
  fidelity: Fidelity
): Promise<PlumeResponse> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const conversationScript = historySegment.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');

  const synthesisPrompt = `
    TÂCHE: SYNTHÈSE NARRATIVE MAGIQUE.
    
    Voici un segment de conversation récent entre l'Auteur et PLUME.
    
    TA MISSION:
    Consolide ces échanges en un SEUL récit fluide.
    - C'est une compilation : rassemble les idées éparses en un tout cohérent.
    - Ne répète pas les questions, garde le contenu narratif.
    - Style: Ton=${tone}, Longueur=${length}, Fidélité=${fidelity}.
    
    SEGMENT À SYNTHÉTISER :
    ${conversationScript}
    `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: synthesisPrompt }] }],
      config: { systemInstruction: BASE_SYSTEM_INSTRUCTION }
    });

    const text = result.text;
    if (!text) throw new Error("No text generated");

    const parsed = parsePlumeResponse(text);
    parsed.isSynthesisResult = true;

    return parsed;
  } catch (error) {
    console.error("Synthesis Error:", error);
    throw error;
  }
};

export const generateTitleAndMetadata = async (
  text: string
): Promise<{ title: string; dates: string[]; characters: string[]; tags: string[] }> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    TÂCHE: ANALYSE ET TITRAGE DE SOUVENIR.
    
    Voici un texte autobiographique (souvenir) :
    "${text}"

    TES OBJECTIFS :
    1. TITRE : Trouve un titre évocateur, poétique ou marquant (max 6 mots).
    2. ENTITÉS : Extrais les entités pour les filtres intelligents.
       - Dates : Années ou périodes mentionnées (ex: "1995", "Années 80").
       - Personnages : Prénoms ou rôles clés (ex: "Grand-mère", "Paul").
       - Tags : Thèmes ou émotions (ex: "Enfance", "Voyage", "Mélancolie").

    FORMAT DE SORTIE (JSON STRICT) :
    \`\`\`json
    {
      "title": "Le titre généré",
      "dates": ["date1", "date2"],
      "characters": ["perso1", "perso2"],
      "tags": ["tag1", "tag2"]
    }
    \`\`\`
    `;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }]
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No text generated for title");

    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const data = JSON.parse(jsonStr);
      return {
        title: data.title || "Souvenir sans titre",
        dates: Array.isArray(data.dates) ? data.dates : [],
        characters: Array.isArray(data.characters) ? data.characters : [],
        tags: Array.isArray(data.tags) ? data.tags : []
      };
    }
    return { title: "Nouveau Souvenir", dates: [], characters: [], tags: [] };

  } catch (error) {
    console.error("Title Generation Error:", error);
    return { title: "Souvenir du " + new Date().toLocaleDateString(), dates: [], characters: [], tags: [] };
  }
};

/**
 * Generate a welcoming kickstarter message with personalized suggestions
 * when the user starts a new writing session
 */
export const generateKickstarter = async (
  userProfile: User | null,
  ideas: Array<{ id: string; title: string; content: string; tags: string[] }>,
  darkZones: Array<{ title: string; description: string; category: string }>
): Promise<PlumeResponse> => {
  if (!process.env.API_KEY) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Build context
  let contextBlock = "";

  if (userProfile) {
    contextBlock += `\n[PROFIL AUTEUR]\n`;
    if (userProfile.firstName) contextBlock += `Prénom: ${userProfile.firstName}\n`;
    if (userProfile.birthDate) {
      const birthYear = new Date(userProfile.birthDate).getFullYear();
      contextBlock += `Année de naissance: ${birthYear}\n`;
    }
  }

  if (ideas.length > 0) {
    contextBlock += `\n[IDÉES EN ATTENTE DANS LE COFFRE] (${ideas.length} idées)\n`;
    ideas.slice(0, 5).forEach(idea => {
      contextBlock += `- "${idea.title}": ${idea.content}\n`;
    });
  }

  if (darkZones.length > 0) {
    contextBlock += `\n[ZONES D'OMBRE DÉTECTÉES] (périodes/thèmes peu explorés)\n`;
    darkZones.slice(0, 3).forEach(zone => {
      contextBlock += `- ${zone.title}: ${zone.description}\n`;
    });
  }

  const kickstarterPrompt = `
Tu es PLUME, l'assistant d'écriture bienveillant. L'auteur vient de terminer un chapitre et démarre une nouvelle session d'écriture.

${contextBlock}

TA MISSION:
Accueille l'auteur chaleureusement et propose-lui 3 pistes concrètes pour démarrer ce nouveau chapitre.

RÈGLES:
1. Ton message d'accueil doit être court, encourageant et personnalisé (2-3 phrases max).
2. Propose 3 angles différents basés sur:
   - Une idée de son coffre (si disponible)
   - Une zone d'ombre à explorer (si disponible)
   - Un thème libre ou une suggestion créative
3. Chaque suggestion doit être formulée comme une question ouverte et inspirante.

FORMAT DE SORTIE OBLIGATOIRE:

[TEXTE_PLUME]
Ton message d'accueil chaleureux ici.
[/TEXTE_PLUME]

[DATA_EXTRACTION]
{
  "dates_chronologie": [],
  "personnages_cites": [],
  "tags_suggeres": []
}
[/END_DATA_EXTRACTION]

[SUGGESTION_IDEA]
VIDE
[/SUGGESTION_IDEA]

[QUESTIONS_CHOIX]
EMOTION|Première question inspirante basée sur une idée du coffre ou zone d'ombre ?#ACTION|Deuxième question pour explorer un thème manquant ?#SENSORIEL|Troisième question créative ou libre ?
[/QUESTIONS_CHOIX]

IMPORTANT: Utilise les données du contexte pour personnaliser tes suggestions. Si le coffre est vide et qu'il n'y a pas de zones d'ombre, propose des questions générales mais inspirantes sur l'enfance, la famille, les voyages, etc.
`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: kickstarterPrompt }] }],
      config: {
        systemInstruction: BASE_SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topP: 0.95
      }
    });

    const responseText = result.text;
    if (!responseText) throw new Error("No kickstarter generated");

    return parsePlumeResponse(responseText);

  } catch (error) {
    console.error("Kickstarter Generation Error:", error);

    // Fallback response
    return {
      narrative: "Bravo pour ce chapitre terminé ! Je suis prêt à vous accompagner pour la suite de votre histoire. Quelle période de votre vie souhaitez-vous explorer maintenant ?",
      data: { dates_chronologie: [], personnages_cites: [], tags_suggeres: [] },
      suggestion: null,
      questions: [
        { type: 'emotion', label: '❤️ Émotion', text: "Quel souvenir vous vient spontanément à l'esprit en ce moment ?" },
        { type: 'action', label: '⚡ Action', text: "Y a-t-il une période de votre vie que vous aimeriez raconter ?" },
        { type: 'descriptif', label: '👁️ Sensoriel', text: "Quel lieu marquant de votre passé mérite d'être décrit ?" }
      ]
    };
  }
};