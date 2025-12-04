import { DigitalMemory } from '../types';
import { logger } from '../utils/logger';

/**
 * Service pour parser les archives de réseaux sociaux
 * Supporte: Instagram, Facebook, LinkedIn (formats JSON/CSV)
 */

interface InstagramPost {
    media?: Array<{
        uri: string;
        creation_timestamp: number;
        title?: string;
    }>;
    caption?: string;
    taken_at?: number;
    location?: {
        name: string;
    };
}

interface FacebookPost {
    timestamp: number;
    data?: Array<{
        post?: string;
    }>;
    attachments?: Array<{
        data?: Array<{
            media?: {
                uri: string;
                creation_timestamp: number;
            };
        }>;
    }>;
    place?: {
        name: string;
    };
}

export class ArchiveParser {
    /**
     * Parse un fichier ZIP d'archive Instagram
     */
    static async parseInstagramArchive(file: File): Promise<DigitalMemory[]> {
        try {
            // Pour l'instant, on simule le parsing
            // Dans une vraie implémentation, on utiliserait JSZip
            const memories: DigitalMemory[] = [];

            // Simulation: on retourne des données mockées
            // TODO: Implémenter le vrai parsing avec JSZip
            logger.debug('Parsing Instagram archive', { fileName: file.name });

            return memories;
        } catch (error) {
            logger.error('Failed to parse Instagram archive', error);
            throw new Error('Impossible de lire l\'archive Instagram');
        }
    }

    /**
     * Parse un fichier JSON d'archive Facebook
     */
    static async parseFacebookArchive(file: File): Promise<DigitalMemory[]> {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const memories: DigitalMemory[] = [];

            // Facebook structure: posts array
            if (data.posts) {
                data.posts.forEach((post: FacebookPost) => {
                    const memory: DigitalMemory = {
                        id: `fb_${post.timestamp}`,
                        platform: 'facebook',
                        externalId: String(post.timestamp),
                        date: new Date(post.timestamp * 1000).toISOString(),
                        content: post.data?.[0]?.post || '',
                        location: post.place?.name,
                        imageUrl: post.attachments?.[0]?.data?.[0]?.media?.uri,
                    };

                    if (memory.content || memory.imageUrl) {
                        memories.push(memory);
                    }
                });
            }

            return memories;
        } catch (error) {
            logger.error('Failed to parse Facebook archive', error);
            throw new Error('Impossible de lire l\'archive Facebook');
        }
    }

    /**
     * Parse un export CSV LinkedIn
     */
    static async parseLinkedInArchive(file: File): Promise<DigitalMemory[]> {
        try {
            const text = await file.text();
            const lines = text.split('\n');
            const memories: DigitalMemory[] = [];

            // Skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line.trim()) continue;

                const parts = line.split(',');
                if (parts.length < 3) continue;

                const memory: DigitalMemory = {
                    id: `li_${i}`,
                    platform: 'linkedin',
                    externalId: String(i),
                    date: parts[0] || new Date().toISOString(),
                    content: parts[1] || '',
                };

                memories.push(memory);
            }

            return memories;
        } catch (error) {
            logger.error('Failed to parse LinkedIn archive', error);
            throw new Error('Impossible de lire l\'archive LinkedIn');
        }
    }

    /**
     * Détecte le type d'archive et parse automatiquement
     */
    static async parseArchive(file: File): Promise<DigitalMemory[]> {
        const fileName = file.name.toLowerCase();

        if (fileName.includes('instagram') || fileName.endsWith('.zip')) {
            return this.parseInstagramArchive(file);
        } else if (fileName.includes('facebook') && fileName.endsWith('.json')) {
            return this.parseFacebookArchive(file);
        } else if (fileName.includes('linkedin') && fileName.endsWith('.csv')) {
            return this.parseLinkedInArchive(file);
        } else {
            throw new Error('Format d\'archive non reconnu. Formats supportés: Instagram (.zip), Facebook (.json), LinkedIn (.csv)');
        }
    }

    /**
     * Enrichit les souvenirs avec l'analyse IA
     */
    static async enrichMemories(memories: DigitalMemory[]): Promise<DigitalMemory[]> {
        // TODO: Intégrer l'analyse Gemini pour détecter émotions et thèmes
        return memories.map(memory => ({
            ...memory,
            analysis: {
                emotion: 'Neutre',
                themes: ['Vie quotidienne'],
                suggestedAngles: [
                    'Que ressentais-tu à ce moment-là ?',
                    'Qui était avec toi ?',
                    'Pourquoi ce moment était-il important ?'
                ]
            }
        }));
    }
}
