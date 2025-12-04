import { supabase } from './supabaseClient';
import { GoogleGenAI } from "@google/genai";
import { logger } from '../utils/logger';

export interface PersonProfileData {
    name: string;
    relationship?: string;
    summary: string;
    photoUrl?: string;
    stats: {
        memoryCount: number;
        firstMention: string;
        lastMention: string;
        topTags: string[];
    };
    photos: string[]; // URLs of photos linked to this person
    memories: any[]; // The actual memory objects
}

export class PersonProfileService {
    private static apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

    /**
     * Generates or retrieves a full profile for a character
     */
    static async getPersonProfile(userId: string, characterName: string): Promise<PersonProfileData> {
        logger.info(`Generating profile for ${characterName}`);

        // 1. Fetch all memories (chapters) mentioning this character
        const { data: chapters, error } = await supabase
            .from('chapters')
            .select('*')
            .eq('user_id', userId)
            .contains('metadata->characters', JSON.stringify([characterName]));

        if (error) throw error;

        // 2. Fetch photos linked to this character
        // Note: This assumes photos are stored in profiles or a separate media table
        // For now, we'll look in the user's profile photos array
        const { data: profile } = await supabase
            .from('profiles')
            .select('photos')
            .eq('id', userId)
            .single();

        const linkedPhotos = profile?.photos?.filter((p: any) =>
            p.linkedCharacters?.includes(characterName)
        ).map((p: any) => p.url) || [];

        // 3. Calculate stats
        const memoryCount = chapters?.length || 0;
        const sortedChapters = chapters?.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ) || [];

        const firstMention = sortedChapters.length > 0 ? sortedChapters[0].created_at : null;
        const lastMention = sortedChapters.length > 0 ? sortedChapters[sortedChapters.length - 1].created_at : null;

        // Aggregate tags
        const allTags = chapters?.flatMap(c => c.metadata?.tags || []) || [];
        const tagCounts = allTags.reduce((acc, tag) => {
            acc[tag] = (acc[tag] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topTags = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);

        // 4. Generate AI Summary
        let summary = "Aucune information suffisante pour générer un résumé.";

        if (memoryCount > 0 && this.apiKey) {
            try {
                const ai = new GoogleGenAI({ apiKey: this.apiKey });

                // Prepare context for AI
                const context = chapters?.map(c => `
                    Titre: ${c.title}
                    Date: ${c.created_at}
                    Contenu: ${c.content.substring(0, 500)}... // Truncate for token limit
                `).join('\n\n');

                const prompt = `
                Tu es un biographe expert. Voici des extraits de souvenirs mentionnant "${characterName}".
                
                TA MISSION :
                Rédige une fiche de profil synthétique et touchante pour cette personne (environ 150-200 mots).
                
                Capture :
                - La nature de la relation avec l'auteur (déduis-la du contexte)
                - Les traits de caractère dominants
                - Les moments clés ou rôles récurrents
                - Le ton émotionnel associé à cette personne
                
                Format : Markdown léger (gras pour les points clés).
                Ton : Bienveillant, analytique mais sensible.
                
                SOUVENIRS :
                ${context}
                `;

                const result = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{ parts: [{ text: prompt }] }],
                    config: {
                        temperature: 0.3,
                    }
                });

                summary = result.text || summary;
            } catch (err) {
                logger.error("Failed to generate AI summary for person profile", err);
                summary = "Impossible de générer le résumé IA pour le moment. " + err;
            }
        }

        return {
            name: characterName,
            summary,
            photoUrl: linkedPhotos.length > 0 ? linkedPhotos[0] : undefined, // Use first photo as avatar
            stats: {
                memoryCount,
                firstMention: firstMention ? new Date(firstMention).toLocaleDateString() : 'N/A',
                lastMention: lastMention ? new Date(lastMention).toLocaleDateString() : 'N/A',
                topTags
            },
            photos: linkedPhotos,
            memories: sortedChapters
        };
    }
}
