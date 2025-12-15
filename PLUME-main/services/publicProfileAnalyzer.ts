import { DigitalMemory } from '../types';
import { logger } from '../utils/logger';

/**
 * Service pour analyser les profils publics via IA
 * Utilise Gemini avec recherche web pour extraire le contexte narratif
 */

interface SocialProfile {
    platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter';
    url: string;
    username?: string;
}

export class PublicProfileAnalyzer {
    /**
     * Valide une URL de profil social
     */
    static validateProfileUrl(url: string): { valid: boolean; platform?: string; error?: string } {
        const patterns = {
            instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/,
            facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)/,
            linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9-]+)/,
            twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/,
        };

        for (const [platform, pattern] of Object.entries(patterns)) {
            if (pattern.test(url)) {
                return { valid: true, platform };
            }
        }

        return {
            valid: false,
            error: 'URL non reconnue. Formats acceptés: instagram.com/..., facebook.com/..., linkedin.com/in/..., twitter.com/...'
        };
    }

    /**
     * Extrait le nom d'utilisateur d'une URL
     */
    static extractUsername(url: string): string | null {
        const match = url.match(/\/([a-zA-Z0-9._-]+)\/?$/);
        return match ? match[1] : null;
    }

    /**
     * Génère un prompt pour Gemini afin d'analyser un profil public
     */
    static generateAnalysisPrompt(profile: SocialProfile): string {
        return `Tu es un assistant biographique. Analyse le profil public ${profile.platform} suivant : ${profile.url}

Recherche sur le web et extrais les informations suivantes (si disponibles publiquement) :
1. **Image de profil** : Trouve l'URL de la photo de profil ou une image représentative de la personne.
2. **Parcours professionnel** : Postes occupés, entreprises, dates clés
3. **Centres d'intérêt** : Thématiques récurrentes, passions, hobbies
4. **Événements marquants** : Publications importantes, réalisations, voyages
5. **Style narratif** : Ton utilisé, émotions exprimées, thèmes favoris
6. **Chronologie détaillée** : Périodes de vie identifiables avec leurs sources visuelles si possible.

Retourne un résumé structuré en JSON avec ces clés :
\`\`\`json
{
  "imageUrl": "URL_IMAGE_PROFIL",
  "bio": "Résumé biographique court",
  "timeline": [
    {
      "year": "2023", 
      "event": "Participation à la COP28", 
      "imageUrl": "URL_IMAGE_SPECIFIQUE_EVENT", 
      "sourceUrl": "URL_SOURCE"
    }
  ],
  "themes": ["Voyage", "Tech", "Famille"],
  "tone": "Inspirant/Nostalgique/Professionnel",
  "keyMoments": [
    {
      "description": "Voyage au Japon", 
      "imageUrl": "URL_IMAGE_JAPON", 
      "sourceUrl": "URL_SOURCE"
    }
  ],
  "narrativeAngles": ["Parle de ta reconversion", "Raconte ton voyage initiatique"]
}
\`\`\`

IMPORTANT : 
- Cherche activement des URLs d'images PUBLIQUES pour chaque événement (tumbnails, articles de presse, posts publics).
- Si tu ne trouves pas d'image spécifique pour un événement, laisse son champ imageUrl vide (ne mets PAS l'image de profil partout).
- Fournis l'URL source (sourceUrl) pour permettre à l'utilisateur de vérifier.`;
    }

    /**
     * Analyse un profil public avec Gemini + Google Search Grounding
     * @param profile - Profil à analyser
     */
    static async analyzePublicProfile(
        profile: SocialProfile
    ): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }> {
        try {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error('API Key Gemini manquante');
            }

            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

            const prompt = this.generateAnalysisPrompt(profile);

            // Utiliser Gemini avec Google Search Grounding
            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash-exp',
                contents: [{ parts: [{ text: prompt }] }],
                config: {
                    temperature: 0.7,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
                // Active la recherche web (Google Search Grounding)
                tools: [{ googleSearch: {} }],
            } as any);

            const text = result.text;

            if (!text) {
                throw new Error('Aucune réponse de Gemini');
            }

            // Parse le JSON retourné par Gemini
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                const data = JSON.parse(jsonStr);
                return { success: true, data };
            }

            return { success: false, error: 'Format de réponse invalide' };
        } catch (error) {
            logger.error('Failed to analyze public profile', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
            };
        }
    }

    /**
     * Convertit l'analyse d'un profil en souvenirs digitaux
     */
    static convertToDigitalMemories(
        analysis: any,
        profile: SocialProfile
    ): DigitalMemory[] {
        const memories: DigitalMemory[] = [];
        const imageUrl = analysis.imageUrl || undefined;

        // Créer un souvenir principal pour le profil
        memories.push({
            id: `${profile.platform}_profile_main`,
            platform: profile.platform,
            externalId: `profile_main`,
            date: new Date().toISOString(),
            content: analysis.bio || `Profil ${profile.platform} analysé`,
            imageUrl: imageUrl,
            location: 'Internet',
            analysis: {
                emotion: analysis.tone || 'Neutre',
                themes: analysis.themes || [],
                suggestedAngles: analysis.narrativeAngles || [],
            },
        });

        // Créer des souvenirs à partir de la timeline
        if (analysis.timeline) {
            analysis.timeline.forEach((item: any, index: number) => {
                // Ensure item is object
                const eventText = typeof item === 'string' ? item : (item.event || item.description || '');
                const eventImg = (typeof item === 'object' && item.imageUrl) ? item.imageUrl : undefined; // Don't default to profile for specific events to avoid repetition
                const eventDate = (typeof item === 'object' && item.year) ? `${item.year}-01-01` : new Date().toISOString();
                const sourceUrl = (typeof item === 'object' && item.sourceUrl) ? item.sourceUrl : undefined;

                if (!eventText) return;

                memories.push({
                    id: `${profile.platform}_timeline_${index}`,
                    platform: profile.platform,
                    externalId: `timeline_${index}`,
                    date: eventDate,
                    content: eventText,
                    imageUrl: eventImg,
                    location: sourceUrl, // Store source URL in location field for now (or a better place if available)
                    analysis: {
                        emotion: analysis.tone || 'Neutre',
                        themes: analysis.themes || [],
                        suggestedAngles: [`Raconte-moi cette période : ${eventText}`],
                    },
                });
            });
        }

        // Créer des souvenirs à partir des moments clés
        if (analysis.keyMoments) {
            analysis.keyMoments.forEach((item: any, index: number) => {
                const momentText = typeof item === 'string' ? item : (item.description || item.event || '');
                const momentImg = (typeof item === 'object' && item.imageUrl) ? item.imageUrl : undefined;
                const sourceUrl = (typeof item === 'object' && item.sourceUrl) ? item.sourceUrl : undefined;

                if (!momentText) return;

                memories.push({
                    id: `${profile.platform}_moment_${index}`,
                    platform: profile.platform,
                    externalId: `moment_${index}`,
                    date: new Date().toISOString(),
                    content: momentText,
                    imageUrl: momentImg,
                    location: sourceUrl,
                    analysis: {
                        emotion: analysis.tone || 'Neutre',
                        themes: analysis.themes || [],
                        suggestedAngles: [`Raconte-moi plus sur : ${momentText}`],
                    },
                });
            });
        }

        return memories;
    }
}
