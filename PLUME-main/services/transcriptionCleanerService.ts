import { GoogleGenAI } from '@google/genai';

/**
 * Nettoie et optimise une transcription audio en retirant les hésitations
 * et en améliorant la formulation tout en préservant l'intention originale.
 */
export const cleanAndOptimizeTranscription = async (rawText: string): Promise<string> => {
    // Étape 1: Nettoyage basique des hésitations courantes
    let cleaned = rawText
        .replace(/\b(euh|heu|heuu|euuh|ben|bah|voilà|quoi|donc)\b/gi, '')
        .replace(/\s{2,}/g, ' ') // Multiple espaces
        .replace(/\.{2,}/g, '.') // Multiple points
        .trim();

    // Étape 2: Si le texte est déjà très propre (< 10% de mots retirés), on retourne direct
    const wordsBefore = rawText.split(/\s+/).length;
    const wordsAfter = cleaned.split(/\s+/).length;
    if (wordsBefore - wordsAfter < wordsBefore * 0.1) {
        return cleaned;
    }

    // Étape 3: Optimisation IA pour restructurer si nécessaire
    try {
        if (!process.env.GEMINI_API_KEY) {
            return cleaned; // Fallback au nettoyage basique
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
Tu es un assistant qui nettoie des transcriptions audio.

TEXTE TRANSCRIT (brut):
"${rawText}"

TÂCHE:
- Retire les hésitations (euh, heu, ben, bah, voilà, quoi, etc.)
- Corrige les répétitions
- Améliore légèrement la formulation SANS changer le sens
- Garde le ton et le style de l'auteur
- Reste fidèle à l'intention originale

IMPORTANT: Réponds UNIQUEMENT avec le texte nettoyé, SANS introduction ni explication.
`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ parts: [{ text: prompt }] }]
        });

        const optimized = result.text?.trim();

        // Vérification: si l'IA a ajouté des guillemets ou du formatage, on les retire
        if (optimized) {
            return optimized
                .replace(/^["']|["']$/g, '') // Retire guillemets début/fin
                .replace(/^Texte nettoyé\s*:\s*/i, '') // Retire préfixes
                .trim();
        }

        return cleaned;
    } catch (error) {
        console.error('Error optimizing transcription:', error);
        return cleaned; // Fallback au nettoyage basique
    }
};

/**
 * Nettoie uniquement les hésitations basiques (version rapide sans IA)
 */
export const quickCleanTranscription = (rawText: string): string => {
    return rawText
        .replace(/\b(euh|heu|heuu|euuh|ben|bah|voilà|quoi|donc|alors)\b/gi, '')
        .replace(/(\b\w+\b)(\s+\1\b)+/gi, '$1') // Retire répétitions de mots
        .replace(/\s{2,}/g, ' ')
        .replace(/\s+([.,!?])/g, '$1') // Espace avant ponctuation
        .replace(/([.,!?])([A-Z])/g, '$1 $2') // Espace après ponctuation
        .trim();
};
