import { GoogleGenAI } from "@google/genai";

export type InsightType = 'emotional' | 'temporal' | 'relational' | 'geographical';

export interface LifeInsight {
    type: InsightType;
    title: string;
    description: string;
    relatedSouvenirIds: string[];
    confidence: number; // 0-100
}

interface Souvenir {
    id: string;
    title?: string;
    narrative?: string;
    content: string;
    dates?: string[];
    characters?: string[];
    tags?: string[];
    metadata?: {
        locations?: string[];
    };
}

/**
 * Génère des insights profonds sur la vie de l'utilisateur
 * en analysant l'ensemble de ses souvenirs avec l'IA
 */
export class LifeInsightsService {
    private static genAI: GoogleGenAI | null = null;

    private static getAI(): GoogleGenAI {
        if (!this.genAI) {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('GEMINI_API_KEY is not defined');
            }
            this.genAI = new GoogleGenAI({ apiKey });
        }
        return this.genAI;
    }

    /**
     * Extrait les périodes uniques des souvenirs
     */
    private static extractPeriods(souvenirs: Souvenir[]): string {
        const years = new Set<number>();
        souvenirs.forEach(s => {
            s.dates?.forEach(d => {
                const match = d.match(/\d{4}/);
                if (match) years.add(parseInt(match[0]));
            });
        });

        const sortedYears = Array.from(years).sort();
        if (sortedYears.length === 0) return 'Non spécifié';
        if (sortedYears.length === 1) return sortedYears[0].toString();

        const decades = new Set(sortedYears.map(y => `${Math.floor(y / 10) * 10}s`));
        return Array.from(decades).join(', ');
    }

    /**
     * Extrait les N lieux les plus mentionnés
     */
    private static extractTopPlaces(souvenirs: Souvenir[], limit: number = 5): string {
        const placeCounts = new Map<string, number>();

        souvenirs.forEach(s => {
            s.metadata?.locations?.forEach(loc => {
                placeCounts.set(loc, (placeCounts.get(loc) || 0) + 1);
            });
        });

        const sorted = Array.from(placeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([place, count]) => `${place} (${count})`);

        return sorted.join(', ') || 'Aucun';
    }

    /**
     * Extrait les N personnages les plus mentionnés
     */
    private static extractTopCharacters(souvenirs: Souvenir[], limit: number = 5): string {
        const charCounts = new Map<string, number>();

        souvenirs.forEach(s => {
            s.characters?.forEach(char => {
                charCounts.set(char, (charCounts.get(char) || 0) + 1);
            });
        });

        const sorted = Array.from(charCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([char, count]) => `${char} (${count})`);

        return sorted.join(', ') || 'Aucun';
    }

    /**
     * Extrait les N tags les plus utilisés
     */
    private static extractTopTags(souvenirs: Souvenir[], limit: number = 5): string {
        const tagCounts = new Map<string, number>();

        souvenirs.forEach(s => {
            s.tags?.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            });
        });

        const sorted = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([tag, count]) => `${tag} (${count})`);

        return sorted.join(', ') || 'Aucun';
    }

    /**
     * Génère 5 insights profonds sur la vie de l'utilisateur
     */
    static async generateInsights(souvenirs: Souvenir[]): Promise<LifeInsight[]> {
        if (souvenirs.length === 0) {
            return [];
        }

        // Limiter à 50 souvenirs max pour éviter de surcharger le prompt
        const souvenirsSample = souvenirs.slice(0, 50);

        const prompt = `
Tu es un psychologue et biographe expert. Analyse ces souvenirs et génère 5 insights profonds et émouvants.

SOUVENIRS (${souvenirsSample.length} total):
${souvenirsSample.map((s, i) => `
${i + 1}. "${s.title || 'Sans titre'}" (${s.dates?.[0] || 'Date inconnue'})
   Lieux: ${s.metadata?.locations?.join(', ') || 'Non spécifié'}
   Personnages: ${s.characters?.join(', ') || 'Aucun'}
   Extrait: ${(s.narrative || s.content).substring(0, 150)}...
`).join('\n')}

MÉTADONNÉES GLOBALES:
- Périodes couvertes: ${this.extractPeriods(souvenirs)}
- Lieux principaux: ${this.extractTopPlaces(souvenirs, 5)}
- Personnages récurrents: ${this.extractTopCharacters(souvenirs, 5)}
- Thèmes dominants: ${this.extractTopTags(souvenirs, 5)}

CONSIGNES:
1. Identifie des PATTERNS émotionnels, géographiques, relationnels ou temporels
2. Sois SPÉCIFIQUE (cite des noms, lieux, dates)
3. Sois ÉMOUVANT et PROFOND (pas de banalités)
4. Chaque insight doit révéler quelque chose de NON-ÉVIDENT
5. Lie les insights aux souvenirs précis (utilise les numéros 1-${souvenirsSample.length})

FORMAT DE RÉPONSE (JSON strict):
[
  {
    "type": "emotional",
    "title": "Titre court et percutant",
    "description": "Description détaillée et émouvante (2-3 phrases)",
    "relatedSouvenirIndices": [1, 3, 7],
    "confidence": 85
  }
]

Types possibles: "emotional", "temporal", "relational", "geographical"

Génère exactement 5 insights en JSON pur (pas de markdown, pas de \`\`\`json).
`;

        try {
            const ai = this.getAI();
            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    temperature: 0.8,
                    maxOutputTokens: 2000,
                }
            });

            const result = await chat.sendMessage({ message: prompt });
            const responseText = result.text;

            // Nettoyer la réponse (enlever les ```json si présents)
            let cleanedText = responseText.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
            } else if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '');
            }

            const rawInsights = JSON.parse(cleanedText);

            // Mapper les indices aux IDs réels
            const insights: LifeInsight[] = rawInsights.map((raw: any) => ({
                type: raw.type as InsightType,
                title: raw.title,
                description: raw.description,
                relatedSouvenirIds: (raw.relatedSouvenirIndices || [])
                    .map((idx: number) => souvenirsSample[idx - 1]?.id)
                    .filter(Boolean),
                confidence: raw.confidence || 75
            }));

            return insights;

        } catch (error) {
            console.error('Error generating insights:', error);

            // Fallback : insights génériques basés sur les métadonnées
            return this.generateFallbackInsights(souvenirs);
        }
    }

    /**
     * Génère des insights de secours si l'IA échoue
     */
    private static generateFallbackInsights(souvenirs: Souvenir[]): LifeInsight[] {
        const insights: LifeInsight[] = [];

        // Insight 1: Lieux
        const placeCounts = new Map<string, string[]>();
        souvenirs.forEach(s => {
            s.metadata?.locations?.forEach(loc => {
                if (!placeCounts.has(loc)) placeCounts.set(loc, []);
                placeCounts.get(loc)!.push(s.id);
            });
        });

        if (placeCounts.size > 0) {
            const topPlace = Array.from(placeCounts.entries()).sort((a, b) => b[1].length - a[1].length)[0];
            insights.push({
                type: 'geographical',
                title: `${topPlace[0]} : Un lieu qui compte`,
                description: `Vous avez ${topPlace[1].length} souvenirs liés à ${topPlace[0]}. Ce lieu semble avoir une importance particulière dans votre vie.`,
                relatedSouvenirIds: topPlace[1],
                confidence: 90
            });
        }

        // Insight 2: Personnages
        const charCounts = new Map<string, string[]>();
        souvenirs.forEach(s => {
            s.characters?.forEach(char => {
                if (!charCounts.has(char)) charCounts.set(char, []);
                charCounts.get(char)!.push(s.id);
            });
        });

        if (charCounts.size > 0) {
            const topChar = Array.from(charCounts.entries()).sort((a, b) => b[1].length - a[1].length)[0];
            insights.push({
                type: 'relational',
                title: `${topChar[0]} : Une présence constante`,
                description: `${topChar[0]} apparaît dans ${topChar[1].length} de vos souvenirs, témoignant d'un lien fort et durable.`,
                relatedSouvenirIds: topChar[1],
                confidence: 85
            });
        }

        // Insight 3: Périodes
        const years = new Set<number>();
        souvenirs.forEach(s => {
            s.dates?.forEach(d => {
                const match = d.match(/\d{4}/);
                if (match) years.add(parseInt(match[0]));
            });
        });

        if (years.size > 0) {
            const sortedYears = Array.from(years).sort();
            const span = sortedYears[sortedYears.length - 1] - sortedYears[0];
            insights.push({
                type: 'temporal',
                title: `${span} années de mémoires`,
                description: `Vos souvenirs couvrent ${span} années, de ${sortedYears[0]} à ${sortedYears[sortedYears.length - 1]}, capturant l'évolution de votre vie.`,
                relatedSouvenirIds: souvenirs.map(s => s.id),
                confidence: 95
            });
        }

        return insights.slice(0, 5);
    }
}
