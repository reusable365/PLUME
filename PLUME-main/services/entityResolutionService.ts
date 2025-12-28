/**
 * Entity Resolution Service
 * 
 * Intelligent service to detect person mentions in narratives
 * and resolve them to existing entities or suggest new ones.
 * 
 * Examples:
 * - "Caro" → Matches "Caroline Cadario" (90% confidence)
 * - "mon amoureuse" → Matches "Caroline Cadario" via relationship context
 * - "leur mère" → Matches "Caroline" (mother of Tom/Mathis/Lou/Charlie)
 */

import { GoogleGenAI } from "@google/genai";
import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import type {
    PersonEntity,
    EntityMention,
    EntityMatch,
    EntityResolutionSuggestion,
    EntityConfirmation,
    EntityResolutionResult,
    PersonRelationships
} from '../types/entityResolution';

// =========================================
// AI Instance
// =========================================

let genAI: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
    if (!genAI) {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not defined');
        }
        genAI = new GoogleGenAI({ apiKey });
    }
    return genAI;
}

// =========================================
// Database Operations
// =========================================

/**
 * Fetch all person entities for a user
 */
export async function getUserEntities(userId: string): Promise<PersonEntity[]> {
    const { data, error } = await supabase
        .from('person_entities')
        .select('*')
        .eq('user_id', userId)
        .order('mention_count', { ascending: false });

    if (error) {
        logger.error('Failed to fetch user entities', error);
        return [];
    }

    return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        canonicalName: row.canonical_name,
        displayName: row.display_name,
        aliases: row.aliases || [],
        gender: row.gender,
        birthDate: row.birth_date,
        relationships: row.relationships || {},
        confidenceScore: parseFloat(row.confidence_score),
        firstMentionedInMessageId: row.first_mentioned_in_message_id,
        mentionCount: row.mention_count,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}

/**
 * Create a new person entity
 */
export async function createPersonEntity(
    userId: string,
    canonicalName: string,
    aliases: string[] = [],
    messageId?: string
): Promise<PersonEntity | null> {
    const { data, error } = await supabase
        .from('person_entities')
        .insert({
            user_id: userId,
            canonical_name: canonicalName,
            display_name: canonicalName.split(' ')[0], // First name by default
            aliases: aliases,
            first_mentioned_in_message_id: messageId
        })
        .select()
        .single();

    if (error) {
        logger.error('Failed to create person entity', error);
        return null;
    }

    return {
        id: data.id,
        userId: data.user_id,
        canonicalName: data.canonical_name,
        displayName: data.display_name,
        aliases: data.aliases || [],
        relationships: data.relationships || {},
        confidenceScore: parseFloat(data.confidence_score),
        mentionCount: data.mention_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at
    };
}

/**
 * Add an alias to an existing entity
 */
export async function addAliasToEntity(
    entityId: string,
    alias: string
): Promise<boolean> {
    const { error } = await supabase.rpc('add_alias_to_entity', {
        entity_id: entityId,
        new_alias: alias
    });

    if (error) {
        logger.error('Failed to add alias to entity', error);
        return false;
    }

    logger.info(`Added alias "${alias}" to entity ${entityId}`);
    return true;
}

/**
 * Update an existing entity
 */
export async function updateEntity(
    entityId: string,
    updates: Partial<Pick<PersonEntity, 'canonicalName' | 'displayName' | 'gender' | 'aliases' | 'relationships'>>
): Promise<boolean> {
    const { error } = await supabase
        .from('person_entities')
        .update(updates)
        .eq('id', entityId);

    if (error) {
        logger.error('Failed to update entity', error);
        return false;
    }

    logger.info(`Updated entity ${entityId}`);
    return true;
}

/**
 * Delete an entity
 */
export async function deleteEntity(entityId: string): Promise<boolean> {
    const { error } = await supabase
        .from('person_entities')
        .delete()
        .eq('id', entityId);

    if (error) {
        logger.error('Failed to delete entity', error);
        return false;
    }

    logger.info(`Deleted entity ${entityId}`);
    return true;
}

/**
 * Merge multiple entities into one primary entity
 */
export async function mergeEntities(
    entityIds: string[],
    primaryEntityId: string
): Promise<boolean> {
    if (entityIds.length < 2) {
        logger.error('Need at least 2 entities to merge');
        return false;
    }

    if (!entityIds.includes(primaryEntityId)) {
        logger.error('Primary entity must be in the list of entities to merge');
        return false;
    }

    try {
        // 1. Fetch all entities
        const { data: entities, error: fetchError } = await supabase
            .from('person_entities')
            .select('*')
            .in('id', entityIds);

        if (fetchError || !entities) {
            logger.error('Failed to fetch entities for merge', fetchError);
            return false;
        }

        // 2. Find primary and secondary entities
        const primary = entities.find(e => e.id === primaryEntityId);
        const secondaries = entities.filter(e => e.id !== primaryEntityId);

        if (!primary) {
            logger.error('Primary entity not found');
            return false;
        }

        // 3. Merge aliases
        const allAliases = new Set<string>(primary.aliases || []);
        for (const secondary of secondaries) {
            // Add canonical name as alias
            allAliases.add(secondary.canonical_name);
            // Add all aliases
            (secondary.aliases || []).forEach((a: string) => allAliases.add(a));
        }

        // 4. Merge mention counts
        const totalMentions = entities.reduce((sum, e) => sum + (e.mention_count || 0), 0);

        // 5. Update primary entity
        const { error: updateError } = await supabase
            .from('person_entities')
            .update({
                aliases: Array.from(allAliases),
                mention_count: totalMentions
            })
            .eq('id', primaryEntityId);

        if (updateError) {
            logger.error('Failed to update primary entity', updateError);
            return false;
        }

        // 6. Delete secondary entities
        const secondaryIds = secondaries.map(s => s.id);
        const { error: deleteError } = await supabase
            .from('person_entities')
            .delete()
            .in('id', secondaryIds);

        if (deleteError) {
            logger.error('Failed to delete secondary entities', deleteError);
            return false;
        }

        logger.info(`Merged ${entityIds.length} entities into ${primaryEntityId}`);
        return true;

    } catch (error) {
        logger.error('Merge operation failed', error);
        return false;
    }
}

// =========================================
// Entity Context (For Safe Fusion)
// =========================================

export interface EntityContext {
    entityId: string;
    entityName: string;
    mentionedInSouvenirs: { id: string; title: string; excerpt: string }[];
    period: string;
    coOccurrences: string[];
}

/**
 * Get context information for an entity (souvenirs, period, co-occurrences)
 * Used for displaying context bubbles before fusion
 */
export async function getEntityContext(entityId: string, userId: string): Promise<EntityContext | null> {
    try {
        // 1. Get the entity
        const { data: entity, error: entityError } = await supabase
            .from('person_entities')
            .select('*')
            .eq('id', entityId)
            .single();

        if (entityError || !entity) {
            logger.error('Entity not found', entityError);
            return null;
        }

        const entityName = entity.canonical_name;
        const aliases = entity.aliases || [];
        const searchTerms = [entityName, ...aliases];

        // 2. Search for souvenirs mentioning this entity
        const { data: chapters, error: chaptersError } = await supabase
            .from('chapters')
            .select('id, title, content, metadata')
            .eq('user_id', userId)
            .neq('status', 'draft');

        if (chaptersError) {
            logger.error('Failed to fetch chapters', chaptersError);
            return null;
        }

        const mentionedInSouvenirs: { id: string; title: string; excerpt: string }[] = [];
        const allDates: string[] = [];
        const allPeople: Set<string> = new Set();

        for (const chapter of (chapters || [])) {
            const content = (chapter.content || '').toLowerCase();
            const title = chapter.title || 'Sans titre';

            // Check if any search term appears in content
            const found = searchTerms.some(term =>
                content.includes(term.toLowerCase())
            );

            if (found) {
                // Extract excerpt around the mention
                const firstMatch = searchTerms.find(t => content.includes(t.toLowerCase()));
                const idx = content.indexOf(firstMatch!.toLowerCase());
                const start = Math.max(0, idx - 50);
                const end = Math.min(content.length, idx + 100);
                const excerpt = '...' + chapter.content.substring(start, end).replace(/\n/g, ' ') + '...';

                mentionedInSouvenirs.push({ id: chapter.id, title, excerpt });

                // Collect dates
                if (chapter.metadata?.dates) {
                    allDates.push(...chapter.metadata.dates);
                }

                // Collect other people (co-occurrences)
                if (chapter.metadata?.characters) {
                    chapter.metadata.characters.forEach((c: string) => {
                        if (!searchTerms.some(t => c.toLowerCase().includes(t.toLowerCase()))) {
                            allPeople.add(c);
                        }
                    });
                }
            }
        }

        // 3. Calculate period from dates
        let period = 'Période inconnue';
        if (allDates.length > 0) {
            const years = allDates
                .map(d => {
                    const match = d.match(/\d{4}/);
                    return match ? parseInt(match[0]) : null;
                })
                .filter((y): y is number => y !== null)
                .sort((a, b) => a - b);

            if (years.length > 0) {
                const minYear = years[0];
                const maxYear = years[years.length - 1];
                period = minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`;
            }
        }

        // 4. Get top co-occurrences
        const coOccurrences = Array.from(allPeople).slice(0, 5);

        return {
            entityId,
            entityName,
            mentionedInSouvenirs: mentionedInSouvenirs.slice(0, 5), // Max 5
            period,
            coOccurrences
        };

    } catch (error) {
        logger.error('Failed to get entity context', error);
        return null;
    }
}

// =========================================
// String Similarity
// =========================================

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculate string similarity (0-1)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    const distance = levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - (distance / maxLength);
}

/**
 * Check if one string is a common diminutive of another
 */
function isProbableDiminutive(short: string, long: string): boolean {
    const s = short.toLowerCase();
    const l = long.toLowerCase();

    // Exact substring
    if (l.includes(s)) return true;

    // Common French diminutives
    const frenchDiminutives: Record<string, string[]> = {
        'caroline': ['caro', 'line', 'carole'],
        'stéphane': ['steph', 'stef'],
        'thomas': ['tom', 'thom'],
        'mathis': ['math', 'matis'],
        'charlotte': ['loulou', 'charlie', 'lotte'],
        'louise': ['lou', 'loulou'],
        'jennifer': ['jen', 'jenny'],
        'françoise': ['francine', 'françou']
    };

    for (const [full, diminutives] of Object.entries(frenchDiminutives)) {
        if (l === full && diminutives.includes(s)) return true;
        if (s === full && diminutives.includes(l)) return true;
    }

    return false;
}

// =========================================
// AI-Powered Entity Detection
// =========================================

interface AIDetectedEntity {
    mention: string;
    startIndex: number;
    endIndex: number;
    context: string;
    reasoning: string;
}

/**
 * Use Gemini to detect person mentions in a narrative
 */
async function detectPersonMentionsWithAI(narrative: string): Promise<AIDetectedEntity[]> {
    const prompt = `
Tu es un expert en analyse de texte biographique.

NARRATIVE:
"${narrative}"

TÂCHE:
Extrais TOUTES les mentions de personnes dans cette narrative.
Inclus:
- Noms propres: "Caroline", "Stéphane", "Tom"
- Surnoms: "Caro", "mi amore", "chérie"
- Relations: "mon amoureuse", "ma femme", "leur mère", "mes enfants"

FORMAT JSON (tableau):
[
  {
    "mention": "Caro",
    "startIndex": 45,
    "endIndex": 49,
    "context": "...avec Caro nous avons...",
    "reasoning": "Surnom probable, diminutif de Caroline"
  }
]

Retourne UNIQUEMENT le JSON, sans markdown.
`;

    try {
        const ai = getAI();
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-exp',
            config: {
                temperature: 0.2,
                maxOutputTokens: 1500,
                responseMimeType: "application/json"
            }
        });

        const result = await chat.sendMessage({ message: prompt });
        const detected = JSON.parse(result.text || '[]');

        logger.info(`AI detected ${detected.length} person mentions`);
        return detected;

    } catch (error) {
        logger.error('AI entity detection failed', error);
        return [];
    }
}

// =========================================
// Entity Matching
// =========================================

/**
 * Find matching entities for a detected mention
 */
function findMatchingEntities(
    mentionText: string,
    existingEntities: PersonEntity[]
): EntityMatch[] {
    const matches: EntityMatch[] = [];

    for (const entity of existingEntities) {
        // Check canonical name
        const canonicalSimilarity = calculateStringSimilarity(mentionText, entity.canonicalName);

        // Check aliases
        let bestAliasSimilarity = 0;
        for (const alias of entity.aliases) {
            const sim = calculateStringSimilarity(mentionText, alias);
            if (sim > bestAliasSimilarity) bestAliasSimilarity = sim;
        }

        // Check diminutive
        const isDiminutive = isProbableDiminutive(mentionText, entity.canonicalName) ||
            entity.aliases.some(a => isProbableDiminutive(mentionText, a));

        // Calculate scores
        const stringSimilarity = Math.max(canonicalSimilarity, bestAliasSimilarity);
        const contextualScore = isDiminutive ? 0.9 : stringSimilarity;
        const totalConfidence = (stringSimilarity * 0.6) + (contextualScore * 0.4);

        // Only include if confidence > 0.5
        if (totalConfidence > 0.5) {
            let reasoning = '';
            if (isDiminutive) {
                reasoning = `Diminutif probable de "${entity.canonicalName}"`;
            } else if (bestAliasSimilarity > 0.8) {
                reasoning = `Correspond à l'alias déjà connu`;
            } else {
                reasoning = `Similarité de ${Math.round(stringSimilarity * 100)}%`;
            }

            matches.push({
                entity,
                similarity: stringSimilarity,
                contextualScore,
                totalConfidence,
                reasoning
            });
        }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.totalConfidence - a.totalConfidence);
}

// =========================================
// Main API
// =========================================

/**
 * Analyze a narrative and suggest entity resolutions
 */
export async function analyzeEntityMentions(
    narrative: string,
    userId: string
): Promise<EntityResolutionSuggestion[]> {
    logger.info('Starting entity analysis...');

    // 1. Fetch existing entities
    const existingEntities = await getUserEntities(userId);
    logger.info(`Found ${existingEntities.length} existing entities`);

    // 2. Detect mentions with AI
    const detectedMentions = await detectPersonMentionsWithAI(narrative);

    // 3. Match mentions to existing entities
    const suggestions: EntityResolutionSuggestion[] = [];

    for (const detected of detectedMentions) {
        const mention: EntityMention = {
            text: detected.mention,
            startIndex: detected.startIndex,
            endIndex: detected.endIndex,
            context: detected.context
        };

        const matches = findMatchingEntities(detected.mention, existingEntities);

        suggestions.push({
            mention,
            possibleMatches: matches,
            isNewEntity: matches.length === 0,
            suggestedCanonicalName: matches.length === 0 ? detected.mention : undefined
        });
    }

    logger.info(`Generated ${suggestions.length} entity resolution suggestions`);
    return suggestions;
}

/**
 * Process user confirmations and update database
 */
export async function processEntityConfirmations(
    confirmations: EntityConfirmation[],
    userId: string,
    messageId?: string
): Promise<EntityResolutionResult> {
    const result: EntityResolutionResult = {
        confirmations: [],
        newEntitiesCreated: [],
        aliasesAdded: []
    };

    for (const confirmation of confirmations) {
        if (confirmation.action === 'link' && confirmation.linkedEntityId) {
            // Add alias to existing entity
            const success = await addAliasToEntity(confirmation.linkedEntityId, confirmation.mentionText);
            if (success) {
                result.aliasesAdded.push({
                    entityId: confirmation.linkedEntityId,
                    newAlias: confirmation.mentionText
                });
            }
        } else if (confirmation.action === 'new' && confirmation.newEntityData) {
            // Create new entity
            const newEntity = await createPersonEntity(
                userId,
                confirmation.newEntityData.canonicalName,
                [confirmation.mentionText],
                messageId
            );
            if (newEntity) {
                result.newEntitiesCreated.push(newEntity);
            }
        }
        // action === 'skip' → Do nothing

        result.confirmations.push(confirmation);
    }

    logger.info(`Processed ${confirmations.length} confirmations: ${result.newEntitiesCreated.length} new, ${result.aliasesAdded.length} aliases`);
    return result;
}
