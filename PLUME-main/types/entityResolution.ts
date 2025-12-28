/**
 * Entity Resolution - Type Definitions
 * 
 * Defines types for intelligent person entity resolution,
 * allowing PLUME to recognize that one person can be referred
 * to in multiple ways (e.g., Caroline = Caro = mi amore)
 */

export type Gender = 'male' | 'female' | 'other';

export type RelationshipType =
    | 'spouse_of'
    | 'parent_of'
    | 'child_of'
    | 'sibling_of'
    | 'friend_of'
    | 'colleague_of'
    | 'grandparent_of'
    | 'grandchild_of';

export interface PersonRelationships {
    spouse_of?: string;           // "Stéphane Cadario"
    parent_of?: string[];         // ["Tom", "Mathis", "Lou", "Charlie"]
    child_of?: string[];          // ["Michel", "Françoise"]
    sibling_of?: string[];        // ["Marie", "Jean"]
    friend_of?: string[];         // ["Jennifer", "Sophie"]
    colleague_of?: string[];      // ["Pierre", "Anne"]
    grandparent_of?: string[];    // ["Emma", "Lucas"]
    grandchild_of?: string[];     // ["Grand-mère Marie"]
    [key: string]: string | string[] | undefined;
}

export interface PersonEntity {
    id: string;
    userId: string;

    // Core identity
    canonicalName: string;        // "Caroline Cadario"
    displayName?: string;         // "Caroline" (preferred short form)

    // Aliases
    aliases: string[];            // ["Caro", "mi amore", "mon amoureuse", "chérie"]

    // Metadata
    gender?: Gender;
    birthDate?: string;           // ISO date string

    // Relationships
    relationships: PersonRelationships;

    // Tracking
    confidenceScore: number;      // 0-1
    firstMentionedInMessageId?: string;
    mentionCount: number;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface EntityMention {
    text: string;                 // The exact text mentioned: "Caro"
    startIndex: number;           // Position in narrative
    endIndex: number;
    context: string;              // Surrounding text for context
}

export interface EntityMatch {
    entity: PersonEntity;
    similarity: number;           // 0-1 (string similarity)
    contextualScore: number;      // 0-1 (based on relationships, etc.)
    totalConfidence: number;      // Combined score
    reasoning: string;            // Explanation for the match
}

export interface EntityResolutionSuggestion {
    mention: EntityMention;       // What was detected
    possibleMatches: EntityMatch[]; // Sorted by confidence (highest first)
    isNewEntity: boolean;         // True if no matches found
    suggestedCanonicalName?: string; // AI's suggestion for canonical name
}

export interface EntityConfirmation {
    mentionText: string;          // "Caro"
    action: 'link' | 'new' | 'skip';
    linkedEntityId?: string;      // If action = 'link'
    newEntityData?: {             // If action = 'new'
        canonicalName: string;
        gender?: Gender;
        relationships?: PersonRelationships;
    };
}

export interface EntityResolutionResult {
    confirmations: EntityConfirmation[];
    newEntitiesCreated: PersonEntity[];
    aliasesAdded: Array<{
        entityId: string;
        newAlias: string;
    }>;
}
