import { GoogleGenAI } from "@google/genai";
import { logger } from '../utils/logger';

export interface TagCluster {
    category: string;
    tags: string[];
}

export class TagIntelligenceService {
    private static apiKey = process.env.GEMINI_API_KEY;

    static async organizeTags(tags: string[]): Promise<TagCluster[]> {
        if (!tags || tags.length === 0) return [];
        if (!this.apiKey) {
            logger.warn("API Key missing for TagIntelligenceService");
            return [{ category: "Tous les tags", tags: tags }];
        }

        const ai = new GoogleGenAI({ apiKey: this.apiKey });

        // Si moins de 10 tags, pas besoin d'IA, on fait un seul groupe
        if (tags.length < 10) {
            return [{ category: "Général", tags: tags }];
        }

        const prompt = `
        Tu es un expert en taxonomie et organisation de connaissances.
        Voici une liste de tags en vrac extraits de souvenirs autobiographiques :
        ${JSON.stringify(tags)}

        TA MISSION :
        1. Regroupe ces tags par grandes catégories sémantiques (ex: Famille, Lieux, Émotions, Travail, Loisirs, etc.).
        2. Crée des catégories pertinentes basées sur le contenu.
        3. Si des tags sont quasi-identiques (ex: "Voyage" et "Voyages"), regroupe-les ou garde le plus pertinent dans la liste.
        4. Essaie de ne pas dépasser 8-10 grandes catégories.

        FORMAT DE SORTIE (JSON STRICT) :
        [
            {
                "category": "Nom de la catégorie (ex: Famille)",
                "tags": ["Tag 1", "Tag 2", "Tag 3"]
            },
            ...
        ]
        `;

        try {
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.1, // Très déterministe
                    responseMimeType: "application/json"
                }
            });

            const responseText = result.text;
            if (!responseText) throw new Error("No response from AI");

            const clusters = JSON.parse(responseText) as TagCluster[];

            // Validation basique
            if (!Array.isArray(clusters)) return [{ category: "Tous les tags", tags: tags }];

            return clusters;

        } catch (error) {
            logger.error("Failed to organize tags with AI", error);
            // Fallback : on retourne tout en vrac
            return [{ category: "Tous les tags", tags: tags }];
        }
    }
}
