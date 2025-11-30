/**
 * Life Universe Service
 * Service IA pour analyser et enrichir l'Univers de Vie (Espace-Temps + Relations + Chronologie)
 */

import { GoogleGenAI } from "@google/genai";
import { supabase } from "./supabaseClient";
import { User, ChatMessage, PlumeResponse } from "../types";

// =====================================================
// TYPES
// =====================================================

export interface Place {
    id: string;
    user_id: string;
    name: string;
    type: 'home' | 'work' | 'school' | 'travel' | 'other';
    latitude?: number;
    longitude?: number;
    country?: string;
    city?: string;
    period_start?: string;
    period_end?: string;
    memory_count: number;
    importance_score: number;
    ai_description?: string;
}

export interface Relationship {
    id: string;
    user_id: string;
    person_name: string;
    relationship_type: 'family' | 'friend' | 'colleague' | 'romantic' | 'mentor' | 'other';
    relationship_subtype?: string;
    met_at_place_id?: string;
    met_date?: string;
    mention_count: number;
    importance_score: number;
    ai_summary?: string;
    ai_personality_traits?: string[];
}

export interface TimelineEvent {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    event_type: 'milestone' | 'period' | 'trip' | 'meeting' | 'move' | 'other';
    date_start: string;
    date_end?: string;
    place_id?: string;
    importance_score: number;
    ai_generated: boolean;
}

export interface LifePeriod {
    id: string;
    user_id: string;
    name: string;
    period_type: 'childhood' | 'adolescence' | 'young_adult' | 'adult' | 'custom';
    start_year?: number;
    end_year?: number;
    memory_count: number;
    narrative_density: number;
    ai_summary?: string;
    ai_themes?: string[];
}

export interface LifeUniverseData {
    places: Place[];
    relationships: Relationship[];
    timeline: TimelineEvent[];
    periods: LifePeriod[];
    insights: string[];
}

// =====================================================
// CACHE
// =====================================================

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes
const universeCache: Record<string, { timestamp: number; data: LifeUniverseData }> = {};

// =====================================================
// MAIN FUNCTION: Analyze Life Universe
// =====================================================

export const analyzeLifeUniverse = async (
    userId: string,
    userProfile: User | null,
    messages: ChatMessage[]
): Promise<LifeUniverseData> => {
    // Check cache
    if (universeCache[userId] && Date.now() - universeCache[userId].timestamp < CACHE_TTL) {
        console.log('Returning cached Life Universe data');
        return universeCache[userId].data;
    }

    try {
        // 1. Extract all narratives
        const narratives = messages
            .filter(m => m.role === 'assistant' && !m.isDivider)
            .map(m => (m.content as PlumeResponse).narrative)
            .filter(n => n && n.length > 0);

        if (narratives.length < 3) {
            // Not enough data, return empty structure
            return {
                places: [],
                relationships: [],
                timeline: [],
                periods: [],
                insights: ["Continuez à écrire pour enrichir votre Univers de Vie !"]
            };
        }

        // 2. Analyze with AI
        const [places, relationships, timeline, periods] = await Promise.all([
            extractPlaces(narratives, userProfile),
            extractRelationships(narratives, userProfile),
            buildTimeline(narratives, userProfile),
            detectLifePeriods(narratives, userProfile)
        ]);

        // 3. Save to database
        await saveLifeUniverseData(userId, { places, relationships, timeline, periods });

        // 4. Generate insights
        const insights = await generateLifeInsights(places, relationships, timeline, periods, userProfile);

        const result: LifeUniverseData = {
            places,
            relationships,
            timeline,
            periods,
            insights
        };

        // Update cache
        universeCache[userId] = { timestamp: Date.now(), data: result };

        return result;

    } catch (error) {
        console.error('Error analyzing Life Universe:', error);
        return {
            places: [],
            relationships: [],
            timeline: [],
            periods: [],
            insights: []
        };
    }
};

// =====================================================
// AI EXTRACTION: Places
// =====================================================

const extractPlaces = async (narratives: string[], userProfile: User | null): Promise<Place[]> => {
    if (!process.env.API_KEY) return [];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
Tu es un expert en analyse géographique de récits autobiographiques.

RÉCITS (échantillon):
${narratives.slice(0, 20).join('\n\n---\n\n')}

MISSION:
Identifie tous les lieux significatifs mentionnés (villes, pays, adresses, lieux de vie, lieux de travail, destinations de voyage).

Pour chaque lieu, fournis:
- name: Nom du lieu
- type: 'home' (domicile), 'work' (travail), 'school' (école), 'travel' (voyage), 'other'
- city: Ville
- country: Pays
- period: Période approximative (ex: "1990-1995", "Enfance")

FORMAT JSON strict:
[
  {
    "name": "Maison d'enfance à Lyon",
    "type": "home",
    "city": "Lyon",
    "country": "France",
    "period": "1980-1995"
  }
]

Réponds UNIQUEMENT avec le JSON array. Maximum 20 lieux.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.3,
                responseMimeType: "application/json"
            }
        });

        const placesData = JSON.parse(result.text.trim());

        // Transform to Place objects (without DB IDs yet)
        return placesData.map((p: any, index: number) => ({
            id: `temp-${index}`,
            user_id: '',
            name: p.name || 'Lieu inconnu',
            type: p.type || 'other',
            city: p.city,
            country: p.country,
            period_start: p.period?.split('-')[0],
            period_end: p.period?.split('-')[1],
            memory_count: 0,
            importance_score: 0,
            ai_description: p.description
        }));

    } catch (error) {
        console.error('Error extracting places:', error);
        return [];
    }
};

// =====================================================
// AI EXTRACTION: Relationships
// =====================================================

const extractRelationships = async (narratives: string[], userProfile: User | null): Promise<Relationship[]> => {
    if (!process.env.API_KEY) return [];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
Tu es un expert en analyse relationnelle de récits autobiographiques.

RÉCITS (échantillon):
${narratives.slice(0, 20).join('\n\n---\n\n')}

MISSION:
Identifie toutes les personnes importantes mentionnées et caractérise leur relation avec l'auteur.

Pour chaque personne, fournis:
- person_name: Nom/prénom
- relationship_type: 'family', 'friend', 'colleague', 'romantic', 'mentor', 'other'
- relationship_subtype: Plus précis (ex: "mother", "best_friend", "boss")
- met_date: Quand ils se sont rencontrés (si mentionné)
- summary: Résumé de la relation en 1 phrase
- traits: 3 traits de personnalité maximum

FORMAT JSON strict:
[
  {
    "person_name": "Marie",
    "relationship_type": "friend",
    "relationship_subtype": "best_friend",
    "met_date": "1985",
    "summary": "Meilleure amie d'enfance, complice de toutes les aventures",
    "traits": ["fidèle", "drôle", "courageuse"]
  }
]

Réponds UNIQUEMENT avec le JSON array. Maximum 30 personnes.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.3,
                responseMimeType: "application/json"
            }
        });

        const relationshipsData = JSON.parse(result.text.trim());

        return relationshipsData.map((r: any, index: number) => ({
            id: `temp-${index}`,
            user_id: '',
            person_name: r.person_name,
            relationship_type: r.relationship_type || 'other',
            relationship_subtype: r.relationship_subtype,
            met_date: r.met_date,
            mention_count: 0,
            importance_score: 0,
            ai_summary: r.summary,
            ai_personality_traits: r.traits || []
        }));

    } catch (error) {
        console.error('Error extracting relationships:', error);
        return [];
    }
};

// =====================================================
// AI EXTRACTION: Timeline
// =====================================================

const buildTimeline = async (narratives: string[], userProfile: User | null): Promise<TimelineEvent[]> => {
    if (!process.env.API_KEY || !userProfile?.birthDate) return [];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const birthYear = new Date(userProfile.birthDate).getFullYear();

    const prompt = `
Tu es un expert en construction de chronologies autobiographiques.

CONTEXTE AUTEUR:
- Année de naissance: ${birthYear}

RÉCITS (échantillon):
${narratives.slice(0, 20).join('\n\n---\n\n')}

MISSION:
Identifie les événements majeurs de la vie de l'auteur (jalons, déménagements, rencontres, voyages).

Pour chaque événement, fournis:
- title: Titre court
- event_type: 'milestone', 'trip', 'meeting', 'move', 'other'
- date: Date ou période (ex: "1995", "Été 1990")
- description: Description en 1 phrase

FORMAT JSON strict:
[
  {
    "title": "Déménagement à Paris",
    "event_type": "move",
    "date": "1995",
    "description": "Installation dans la capitale pour les études"
  }
]

Réponds UNIQUEMENT avec le JSON array. Maximum 20 événements.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.3,
                responseMimeType: "application/json"
            }
        });

        const eventsData = JSON.parse(result.text.trim());

        return eventsData.map((e: any, index: number) => ({
            id: `temp-${index}`,
            user_id: '',
            title: e.title,
            description: e.description,
            event_type: e.event_type || 'other',
            date_start: e.date,
            importance_score: 50,
            ai_generated: true
        }));

    } catch (error) {
        console.error('Error building timeline:', error);
        return [];
    }
};

// =====================================================
// AI EXTRACTION: Life Periods
// =====================================================

const detectLifePeriods = async (narratives: string[], userProfile: User | null): Promise<LifePeriod[]> => {
    if (!process.env.API_KEY || !userProfile?.birthDate) return [];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const birthYear = new Date(userProfile.birthDate).getFullYear();
    const currentYear = new Date().getFullYear();

    const prompt = `
Tu es un expert en segmentation de vies autobiographiques.

CONTEXTE AUTEUR:
- Année de naissance: ${birthYear}
- Âge actuel: ${currentYear - birthYear} ans

RÉCITS (échantillon):
${narratives.slice(0, 20).join('\n\n---\n\n')}

MISSION:
Identifie les grandes périodes de vie de l'auteur (enfance, adolescence, études, carrière, etc.).

Pour chaque période, fournis:
- name: Nom de la période
- period_type: 'childhood', 'adolescence', 'young_adult', 'adult', 'custom'
- start_year: Année de début
- end_year: Année de fin (ou null si en cours)
- summary: Résumé en 1 phrase
- themes: 3 thèmes principaux maximum

FORMAT JSON strict:
[
  {
    "name": "Enfance à Lyon",
    "period_type": "childhood",
    "start_year": ${birthYear},
    "end_year": ${birthYear + 12},
    "summary": "Années d'insouciance marquées par l'école et la famille",
    "themes": ["famille", "école", "découverte"]
  }
]

Réponds UNIQUEMENT avec le JSON array. Maximum 10 périodes.
`;

    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                temperature: 0.3,
                responseMimeType: "application/json"
            }
        });

        const periodsData = JSON.parse(result.text.trim());

        return periodsData.map((p: any, index: number) => ({
            id: `temp-${index}`,
            user_id: '',
            name: p.name,
            period_type: p.period_type || 'custom',
            start_year: p.start_year,
            end_year: p.end_year,
            memory_count: 0,
            narrative_density: 0,
            ai_summary: p.summary,
            ai_themes: p.themes || []
        }));

    } catch (error) {
        console.error('Error detecting life periods:', error);
        return [];
    }
};

// =====================================================
// AI INSIGHTS
// =====================================================

const generateLifeInsights = async (
    places: Place[],
    relationships: Relationship[],
    timeline: TimelineEvent[],
    periods: LifePeriod[],
    userProfile: User | null
): Promise<string[]> => {
    const insights: string[] = [];

    // Geographic insights
    if (places.length > 0) {
        const countries = new Set(places.map(p => p.country).filter(Boolean));
        const cities = new Set(places.map(p => p.city).filter(Boolean));

        if (countries.size > 1) {
            insights.push(`🌍 Votre vie s'est déroulée dans ${countries.size} pays différents`);
        }
        if (cities.size > 3) {
            insights.push(`🏙️ ${cities.size} villes ont marqué votre parcours`);
        }
    }

    // Relationship insights
    if (relationships.length > 0) {
        const familyCount = relationships.filter(r => r.relationship_type === 'family').length;
        const friendCount = relationships.filter(r => r.relationship_type === 'friend').length;

        insights.push(`👥 ${relationships.length} personnes importantes identifiées`);

        if (friendCount > familyCount * 2) {
            insights.push(`🤝 Vos amitiés occupent une place centrale dans votre récit`);
        }
    }

    // Timeline insights
    if (timeline.length > 0) {
        const moves = timeline.filter(e => e.event_type === 'move').length;
        const trips = timeline.filter(e => e.event_type === 'trip').length;

        if (moves > 3) {
            insights.push(`📦 ${moves} déménagements jalonnent votre vie`);
        }
        if (trips > 5) {
            insights.push(`✈️ ${trips} voyages marquants recensés`);
        }
    }

    // Period insights
    if (periods.length > 0) {
        const richestPeriod = periods.reduce((prev, current) =>
            (current.narrative_density > prev.narrative_density) ? current : prev
        );

        if (richestPeriod.narrative_density > 50) {
            insights.push(`📖 "${richestPeriod.name}" est votre période la plus documentée`);
        }
    }

    return insights.length > 0 ? insights : ["Votre Univers de Vie prend forme !"];
};

// =====================================================
// DATABASE SAVE
// =====================================================

const saveLifeUniverseData = async (
    userId: string,
    data: Omit<LifeUniverseData, 'insights'>
): Promise<void> => {
    try {
        // Save places
        if (data.places.length > 0) {
            const placesToInsert = data.places.map(p => ({
                user_id: userId,
                name: p.name,
                type: p.type,
                city: p.city,
                country: p.country,
                period_start: p.period_start,
                period_end: p.period_end,
                ai_description: p.ai_description,
                ai_generated: true
            }));

            await supabase.from('places').upsert(placesToInsert, {
                onConflict: 'user_id,name',
                ignoreDuplicates: false
            });
        }

        // Save relationships
        if (data.relationships.length > 0) {
            const relationshipsToInsert = data.relationships.map(r => ({
                user_id: userId,
                person_name: r.person_name,
                relationship_type: r.relationship_type,
                relationship_subtype: r.relationship_subtype,
                met_date: r.met_date,
                ai_summary: r.ai_summary,
                ai_personality_traits: r.ai_personality_traits
            }));

            await supabase.from('relationships').upsert(relationshipsToInsert, {
                onConflict: 'user_id,person_name',
                ignoreDuplicates: false
            });
        }

        // Save timeline events
        if (data.timeline.length > 0) {
            const eventsToInsert = data.timeline.map(e => ({
                user_id: userId,
                title: e.title,
                description: e.description,
                event_type: e.event_type,
                date_start: e.date_start,
                ai_generated: e.ai_generated
            }));

            await supabase.from('timeline_events').insert(eventsToInsert);
        }

        // Save life periods
        if (data.periods.length > 0) {
            const periodsToInsert = data.periods.map(p => ({
                user_id: userId,
                name: p.name,
                period_type: p.period_type,
                start_year: p.start_year,
                end_year: p.end_year,
                ai_summary: p.ai_summary,
                ai_themes: p.ai_themes
            }));

            await supabase.from('life_periods').insert(periodsToInsert);
        }

    } catch (error) {
        console.error('Error saving Life Universe data:', error);
    }
};

// =====================================================
// EXPORT
// =====================================================

export const clearLifeUniverseCache = (userId: string) => {
    delete universeCache[userId];
};
