/**
 * Entity Confirmation Modal
 * 
 * Displays suggestions for person entity resolution during the "Graver" flow.
 * Allows users to confirm that detected names (e.g., "Caro") match existing
 * entities (e.g., "Caroline Cadario") or create new entities.
 */

import React, { useState } from 'react';
import type { EntityResolutionSuggestion, EntityConfirmation } from '../types/entityResolution';

interface EntityConfirmationModalProps {
    suggestions: EntityResolutionSuggestion[];
    onConfirm: (confirmations: EntityConfirmation[]) => void;
    onSkip: () => void;
}

const EntityConfirmationModal: React.FC<EntityConfirmationModalProps> = ({
    suggestions,
    onConfirm,
    onSkip
}) => {
    // Track user selections: Map<mentionText, confirmation>
    const [selections, setSelections] = useState<Map<string, EntityConfirmation>>(
        new Map(
            suggestions.map(s => [
                s.mention.text,
                {
                    mentionText: s.mention.text,
                    action: s.possibleMatches.length > 0 ? 'link' : 'new',
                    linkedEntityId: s.possibleMatches[0]?.entity.id,
                    newEntityData: s.isNewEntity ? {
                        canonicalName: s.suggestedCanonicalName || s.mention.text
                    } : undefined
                }
            ])
        )
    );

    const handleSelection = (mentionText: string, action: 'link' | 'new' | 'skip', value?: string) => {
        const newSelections = new Map(selections);
        const suggestion = suggestions.find(s => s.mention.text === mentionText);

        if (action === 'link' && value) {
            newSelections.set(mentionText, {
                mentionText,
                action: 'link',
                linkedEntityId: value
            });
        } else if (action === 'new') {
            newSelections.set(mentionText, {
                mentionText,
                action: 'new',
                newEntityData: {
                    canonicalName: value || suggestion?.suggestedCanonicalName || mentionText
                }
            });
        } else if (action === 'skip') {
            newSelections.set(mentionText, {
                mentionText,
                action: 'skip'
            });
        }

        setSelections(newSelections);
    };

    const handleConfirm = () => {
        const confirmations = Array.from(selections.values());
        onConfirm(confirmations);
    };

    if (suggestions.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-[#2a1a4a] to-[#1a0a2a] border border-accent/30 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="bg-accent/10 border-b border-accent/20 px-6 py-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-3xl">👤</span>
                        Confirmez les personnes mentionnées
                    </h2>
                    <p className="text-sm text-gray-300 mt-1">
                        PLUME a détecté {suggestions.length} {suggestions.length > 1 ? 'personnes' : 'personne'} dans votre souvenir.
                        Confirmez leur identité pour enrichir votre univers de vie.
                    </p>
                </div>

                {/* Suggestions List */}
                <div className="overflow-y-auto max-h-[50vh] p-6 space-y-4">
                    {suggestions.map((suggestion, index) => {
                        const selection = selections.get(suggestion.mention.text);
                        const hasMatches = suggestion.possibleMatches.length > 0;

                        return (
                            <div
                                key={index}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                            >
                                {/* Detected Mention */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="text-2xl mt-1">
                                        {hasMatches ? '🔍' : '✨'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">
                                            Vous avez mentionné{' '}
                                            <span className="text-accent font-bold text-lg">
                                                "{suggestion.mention.text}"
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-400 italic mt-1">
                                            {suggestion.mention.context}
                                        </p>
                                    </div>
                                </div>

                                {/* Matching Options */}
                                {hasMatches ? (
                                    <div className="space-y-2 ml-11">
                                        <p className="text-sm text-gray-300">
                                            Est-ce la même personne que :
                                        </p>

                                        {/* Radio Buttons for Matches */}
                                        {suggestion.possibleMatches.map((match, matchIndex) => (
                                            <label
                                                key={matchIndex}
                                                className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-accent/20 transition-all group"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`entity-${index}`}
                                                    checked={selection?.action === 'link' && selection.linkedEntityId === match.entity.id}
                                                    onChange={() => handleSelection(suggestion.mention.text, 'link', match.entity.id)}
                                                    className="mt-1 accent-accent"
                                                />
                                                <div className="flex-1">
                                                    <p className="text-white font-medium group-hover:text-accent transition-colors">
                                                        {match.entity.canonicalName}
                                                    </p>
                                                    {match.entity.aliases.length > 0 && (
                                                        <p className="text-xs text-gray-400">
                                                            Alias connus : {match.entity.aliases.join(', ')}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-accent mt-1">
                                                        💡 {match.reasoning} (Confiance : {Math.round(match.totalConfidence * 100)}%)
                                                    </p>
                                                </div>
                                            </label>
                                        ))}

                                        {/* Option: New Person */}
                                        <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-accent/20 transition-all group">
                                            <input
                                                type="radio"
                                                name={`entity-${index}`}
                                                checked={selection?.action === 'new'}
                                                onChange={() => handleSelection(suggestion.mention.text, 'new', suggestion.mention.text)}
                                                className="mt-1 accent-accent"
                                            />
                                            <div className="flex-1">
                                                <p className="text-white font-medium group-hover:text-accent transition-colors">
                                                    ✨ Nouvelle personne
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Créer une nouvelle fiche pour "{suggestion.mention.text}"
                                                </p>
                                            </div>
                                        </label>

                                        {/* Option: Skip */}
                                        <label className="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-red-500/20 transition-all group">
                                            <input
                                                type="radio"
                                                name={`entity-${index}`}
                                                checked={selection?.action === 'skip'}
                                                onChange={() => handleSelection(suggestion.mention.text, 'skip')}
                                                className="mt-1 accent-red-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-gray-400 group-hover:text-red-300 transition-colors">
                                                    Ignorer pour l'instant
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="ml-11 p-4 bg-accent/10 rounded-lg border border-accent/30">
                                        <p className="text-white font-medium flex items-center gap-2">
                                            ✨ Nouvelle personne détectée
                                        </p>
                                        <p className="text-sm text-gray-300 mt-2">
                                            PLUME va créer une fiche pour{' '}
                                            <span className="text-accent font-semibold">
                                                "{suggestion.suggestedCanonicalName || suggestion.mention.text}"
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex items-center justify-between gap-4">
                    <button
                        onClick={onSkip}
                        className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Passer cette étape
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-3 bg-accent hover:bg-accent/80 text-white font-semibold rounded-full shadow-lg hover:shadow-accent/50 transition-all transform hover:scale-105"
                    >
                        Confirmer et Graver
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EntityConfirmationModal;
