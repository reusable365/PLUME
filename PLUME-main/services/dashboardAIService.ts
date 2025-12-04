import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { ChatMessage, PlumeResponse, User } from "../types";
import { UserStats, ThemeData, Gap } from "./analyticsService";
import { logger } from "../utils/logger";

// Zod Schemas
const AIInsightSchema = z.object({
    type: z.string().transform(val => {
        const normalized = val.toLowerCase();
        if (['pattern', 'recommendation', 'achievement'].includes(normalized)) {
            return normalized as 'pattern' | 'recommendation' | 'achievement';
        }
        return 'pattern'; // Default fallback
    }),
    title: z.string(),
    description: z.string(),
    priority: z.number().min(1).max(5).optional().default(3),
});

const WritingAnalysisSchema = z.object({
    writingStyle: z.string(),
    emotionalTone: z.string(),
    coherenceScore: z.number(),
    strengths: z.array(z.string()),
    recommendations: z.array(z.string()),
    insights: z.array(AIInsightSchema)
});

const GapSchema = z.object({
    title: z.string(),
    severity: z.enum(['Critique', 'Important', 'Mineur']),
    description: z.string(),
    impact: z.string(),
    suggestion: z.string(),
    category: z.enum(['period', 'person', 'theme'])
});

const GapArraySchema = z.array(GapSchema);

export interface AIInsight {
    id: string;
    type: 'pattern' | 'recommendation' | 'achievement';
    title: string;
    description: string;
    icon: string;
    color: string;
    priority: number; // 1-5, 5 being highest
}

export interface WritingAnalysis {
    insights: AIInsight[];
    writingStyle: string;
    emotionalTone: string;
    coherenceScore: number;
    recommendations: string[];
    strengths: string[];
}

// Simple in-memory cache
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
interface CacheEntry<T> {
    timestamp: number;
    data: T;
    hash: string;
}

const analysisCache: Record<string, CacheEntry<WritingAnalysis>> = {};
const gapsCache: Record<string, CacheEntry<Gap[]>> = {};

const generateHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
};

/**
 * Analyze writing patterns using Gemini AI
 */
export const analyzeWritingPatterns = async (
    messages: ChatMessage[],
    userProfile: User | null,
    stats: UserStats
): Promise<WritingAnalysis> => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("API Key is missing");
    }

    // Extract narrative content from messages
    const narratives = messages
        .filter(m => m.role === 'assistant' && !m.isDivider)
        .map(m => (m.content as PlumeResponse).narrative)
        .filter(n => n && n.length > 0)
        .slice(-20); // Last 20 narratives for analysis

    if (narratives.length === 0) {
        return {
            insights: [{
                id: '1',
                type: 'recommendation',
                title: 'Commencez votre récit',
                description: 'Partagez votre premier souvenir pour que PLUME puisse analyser votre style',
                icon: 'IconFeather',
                color: 'blue',
                priority: 5
            }],
            writingStyle: 'Non déterminé',
            emotionalTone: 'Neutre',
            coherenceScore: 0,
            recommendations: ['Commencez à écrire pour obtenir des insights personnalisés'],
            strengths: []
        };
    }

    // Check cache
    const cacheKey = userProfile?.id || 'anonymous';
    const contentHash = generateHash(narratives.join('') + stats.totalMessages);

    if (analysisCache[cacheKey] &&
        analysisCache[cacheKey].hash === contentHash &&
        Date.now() - analysisCache[cacheKey].timestamp < CACHE_TTL) {
        logger.info('Returning cached writing analysis');
        return analysisCache[cacheKey].data;
    }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });

    const analysisPrompt = `
Tu es un expert littéraire et biographe. Analyse ce corpus autobiographique.

STATISTIQUES:
- Messages écrits: ${stats.totalMessages}
- Pages rédigées: ${stats.pages}
- Chapitres: ${stats.chapters}
- Progression cette semaine: ${stats.weeklyProgress} pages

EXTRAITS NARRATIFS (${narratives.length} derniers):
${narratives.slice(0, 10).join('\n\n---\n\n')}

ANALYSE DEMANDÉE:
1. Style d'écriture dominant (1-2 mots: poétique, direct, descriptif, introspectif, etc.)
2. Ton émotionnel global (1-2 mots: nostalgique, joyeux, mélancolique, serein, etc.)
3. Score de cohérence narrative (0-100): fluidité, transitions, structure temporelle
4. 3 forces principales de l'écriture
5. 3 recommandations concrètes pour améliorer le récit
6. 3 insights personnalisés (patterns détectés, réussites, opportunités)

FORMAT DE RÉPONSE (JSON strict):
{
  "writingStyle": "...",
  "emotionalTone": "...",
  "coherenceScore": 85,
  "strengths": ["Force 1", "Force 2", "Force 3"],
  "recommendations": ["Reco 1", "Reco 2", "Reco 3"],
  "insights": [
    {
      "type": "pattern",
      "title": "Titre court",
      "description": "Description 1-2 phrases",
      "priority": 4
    },
    {
      "type": "recommendation",
      "title": "...",
      "description": "...",
      "priority": 3
    },
    {
      "type": "achievement",
      "title": "...",
      "description": "...",
      "priority": 5
    }
  ]
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, aucun texte avant ou après.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: analysisPrompt }] }],
            config: {
                temperature: 0.7,
                topP: 0.9,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.text.trim();

        // Parse and Validate with Zod
        const parsedData = JSON.parse(responseText);
        const validatedData = WritingAnalysisSchema.parse(parsedData);

        // Add IDs and icons to insights
        const insightsWithMeta: AIInsight[] = validatedData.insights.map((insight, index) => ({
            id: `insight-${index}-${Date.now()}`,
            type: insight.type,
            title: insight.title,
            description: insight.description,
            icon: insight.type === 'achievement' ? 'IconStar' : insight.type === 'pattern' ? 'IconTrendingUp' : 'IconTarget',
            color: insight.type === 'achievement' ? 'emerald' : insight.type === 'pattern' ? 'blue' : 'amber',
            priority: insight.priority || 3
        }));

        const finalAnalysis: WritingAnalysis = {
            insights: insightsWithMeta.sort((a, b) => b.priority - a.priority),
            writingStyle: validatedData.writingStyle,
            emotionalTone: validatedData.emotionalTone,
            coherenceScore: Math.min(100, Math.max(0, validatedData.coherenceScore)),
            recommendations: validatedData.recommendations || [],
            strengths: validatedData.strengths || []
        };

        // Update Cache
        analysisCache[cacheKey] = {
            timestamp: Date.now(),
            data: finalAnalysis,
            hash: contentHash
        };

        return finalAnalysis;

    } catch (error) {
        logger.error('Error analyzing writing patterns:', error);

        // Fallback analysis
        return {
            insights: [
                {
                    id: '1',
                    type: 'pattern',
                    title: 'Rythme d\'écriture régulier',
                    description: `Vous avez écrit ${stats.weeklyProgress} pages cette semaine. Continuez sur cette lancée !`,
                    icon: 'IconTrendingUp',
                    color: 'blue',
                    priority: 4
                },
                {
                    id: '2',
                    type: 'recommendation',
                    title: 'Enrichir les descriptions',
                    description: 'Ajoutez plus de détails sensoriels pour immerger le lecteur',
                    icon: 'IconTarget',
                    color: 'amber',
                    priority: 3
                }
            ],
            writingStyle: 'Authentique',
            emotionalTone: 'Nostalgique',
            coherenceScore: 75,
            recommendations: [
                'Varier la longueur des phrases pour plus de rythme',
                'Ajouter des dialogues pour dynamiser le récit',
                'Développer les transitions entre les chapitres'
            ],
            strengths: [
                'Sincérité du témoignage',
                'Richesse des souvenirs',
                'Régularité de l\'écriture'
            ]
        };
    }
};

/**
 * Generate personalized recommendations based on stats and gaps
 */
export const generatePersonalizedRecommendations = async (
    stats: UserStats,
    gaps: Gap[],
    themes: ThemeData[]
): Promise<string[]> => {
    const recommendations: string[] = [];

    // Recommendation based on completion
    if (stats.completion < 30) {
        recommendations.push("Concentrez-vous sur l'écriture régulière : visez 2-3 sessions par semaine");
    } else if (stats.completion < 70) {
        recommendations.push("Vous êtes sur la bonne voie ! Maintenez le rythme pour atteindre 70% de complétude");
    } else {
        recommendations.push("Excellent progrès ! Pensez à relire et affiner vos chapitres existants");
    }

    // Recommendation based on gaps
    if (gaps.length > 0) {
        const criticalGaps = gaps.filter(g => g.severity === 'Critique');
        if (criticalGaps.length > 0) {
            recommendations.push(`Priorité : ${criticalGaps[0].suggestion}`);
        }
    }

    // Recommendation based on thematic balance
    if (themes.length > 0) {
        const dominantTheme = themes[0];
        const weakTheme = themes[themes.length - 1];

        if (dominantTheme.percentage > 40) {
            recommendations.push(`Équilibrer : le thème "${dominantTheme.name}" domine (${dominantTheme.percentage}%). Explorez "${weakTheme.name}"`);
        }
    }

    // Recommendation based on weekly progress
    if (stats.weeklyProgress === 0) {
        recommendations.push("Reprenez l'écriture : même 15 minutes par jour font la différence");
    } else if (stats.weeklyProgress > 5) {
        recommendations.push(`Excellent rythme ! Vous avez écrit ${stats.weeklyProgress} pages cette semaine`);
    }

    // Photo recommendation
    if (stats.photos < 10) {
        recommendations.push("Ajoutez des photos pour enrichir votre récit visuel (objectif : 20 photos)");
    }

    return recommendations.slice(0, 5); // Max 5 recommendations
};

/**
 * Detect narrative gaps using AI (more sophisticated than keyword matching)
 */
export const detectNarrativeGapsAI = async (
    messages: ChatMessage[],
    userProfile: User | null
): Promise<Gap[]> => {
    if (!import.meta.env.GEMINI_API_KEY || !userProfile?.birthDate) {
        return [];
    }

    // Extract all narratives
    const narratives = messages
        .filter(m => m.role === 'assistant' && !m.isDivider)
        .map(m => (m.content as PlumeResponse).narrative)
        .filter(n => n && n.length > 0);

    if (narratives.length < 2) {
        return []; // Not enough data for AI analysis
    }

    // Check cache
    const cacheKey = userProfile.id;
    const contentHash = generateHash(narratives.join(''));

    if (gapsCache[cacheKey] &&
        gapsCache[cacheKey].hash === contentHash &&
        Date.now() - gapsCache[cacheKey].timestamp < CACHE_TTL) {
        logger.info('Returning cached gaps analysis');
        return gapsCache[cacheKey].data;
    }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
    const birthYear = new Date(userProfile.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();

    const gapDetectionPrompt = `
Tu es un expert en analyse narrative autobiographique.

CONTEXTE AUTEUR:
- Année de naissance: ${birthYear}
- Âge actuel: ${currentYear - birthYear} ans
- Nombre de récits: ${narratives.length}

RÉCITS (échantillon):
${narratives.slice(0, 15).join('\n\n---\n\n')}

MISSION:
Identifie 1 à 3 lacunes narratives importantes (périodes manquantes, personnes sous-représentées, thèmes absents).

FORMAT JSON strict:
[
  {
    "title": "Titre court de la lacune",
    "severity": "Critique" ou "Important" ou "Mineur",
    "description": "Description concise",
    "impact": "Impact sur le récit global",
    "suggestion": "Action concrète à prendre",
    "category": "period" ou "person" ou "theme"
  }
]

Réponds UNIQUEMENT avec le JSON array.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: gapDetectionPrompt }] }],
            config: {
                temperature: 0.5,
                responseMimeType: "application/json"
            }
        });

        const responseText = result.text.trim();

        // Parse and Validate with Zod
        const parsedData = JSON.parse(responseText);
        const validatedGaps = GapArraySchema.parse(parsedData);

        const finalGaps: Gap[] = validatedGaps.slice(0, 3).map((gap, index) => ({
            id: index + 1,
            icon: gap.category === 'period' ? 'IconClock' : gap.category === 'person' ? 'IconUsers' : 'IconBriefcase',
            color: gap.severity === 'Critique' ? 'red' : gap.severity === 'Important' ? 'amber' : 'yellow',
            title: gap.title,
            severity: gap.severity,
            description: gap.description,
            impact: gap.impact,
            suggestion: gap.suggestion,
            actionLabel: 'Explorer maintenant'
        }));

        // Update Cache
        gapsCache[cacheKey] = {
            timestamp: Date.now(),
            data: finalGaps,
            hash: contentHash
        };

        return finalGaps;

    } catch (error) {
        logger.error('Error detecting AI gaps:', error);
        return [];
    }
};
