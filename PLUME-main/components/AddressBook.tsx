/**
 * Address Book - Person Entity Management
 * 
 * Page for viewing, editing, merging, and managing all person entities.
 * Users can see all detected people, their aliases, and merge duplicates.
 */

import React, { useState, useEffect } from 'react';
import { Search, Users, Edit2, Trash2, GitMerge, Plus, X, Info, AlertTriangle, BookOpen, Calendar, UserCheck } from 'lucide-react';
import { getUserEntities, deleteEntity, mergeEntities, updateEntity, getEntityContext, EntityContext } from '../services/entityResolutionService';
import { logger } from '../utils/logger';
import type { PersonEntity } from '../types/entityResolution';

interface AddressBookProps {
    userId: string;
}

const AddressBook: React.FC<AddressBookProps> = ({ userId }) => {
    const [entities, setEntities] = useState<PersonEntity[]>([]);
    const [filteredEntities, setFilteredEntities] = useState<PersonEntity[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
    const [editingEntity, setEditingEntity] = useState<PersonEntity | null>(null);

    // Merge Modal State
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [mergeContexts, setMergeContexts] = useState<EntityContext[]>([]);
    const [isLoadingContexts, setIsLoadingContexts] = useState(false);
    const [primaryEntityId, setPrimaryEntityId] = useState<string | null>(null);

    useEffect(() => {
        loadEntities();
    }, [userId]);

    useEffect(() => {
        // Filter entities based on search
        if (!searchQuery.trim()) {
            setFilteredEntities(entities);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = entities.filter(e =>
                e.canonicalName.toLowerCase().includes(query) ||
                e.aliases.some(a => a.toLowerCase().includes(query))
            );
            setFilteredEntities(filtered);
        }
    }, [searchQuery, entities]);

    const loadEntities = async () => {
        setIsLoading(true);
        try {
            const data = await getUserEntities(userId);
            setEntities(data);
            setFilteredEntities(data);
        } catch (error) {
            logger.error('Failed to load entities:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedEntities);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedEntities(newSelected);
    };

    const handleMerge = async () => {
        if (selectedEntities.size < 2) {
            alert('Sélectionnez au moins 2 personnes à fusionner');
            return;
        }

        // Load contexts for all selected entities
        setIsLoadingContexts(true);
        setShowMergeModal(true);

        const entityIds = Array.from(selectedEntities);
        setPrimaryEntityId(entityIds[0]);

        try {
            const contextPromises = entityIds.map(id => getEntityContext(id, userId));
            const contexts = await Promise.all(contextPromises);
            setMergeContexts(contexts.filter((c): c is EntityContext => c !== null));
        } catch (error) {
            logger.error('Failed to load entity contexts:', error);
        } finally {
            setIsLoadingContexts(false);
        }
    };

    const confirmMerge = async () => {
        if (!primaryEntityId) return;

        const entityIds = Array.from(selectedEntities);

        try {
            await mergeEntities(entityIds, primaryEntityId);
            setSelectedEntities(new Set());
            setShowMergeModal(false);
            setMergeContexts([]);
            setPrimaryEntityId(null);
            await loadEntities();
        } catch (error) {
            logger.error('Merge failed:', error);
            alert('Erreur lors de la fusion');
        }
    };

    const cancelMerge = () => {
        setShowMergeModal(false);
        setMergeContexts([]);
        setPrimaryEntityId(null);
    };

    const handleDelete = async (entity: PersonEntity) => {
        const confirm = window.confirm(
            `Supprimer "${entity.canonicalName}" ? Cette action est irréversible.`
        );

        if (confirm) {
            try {
                await deleteEntity(entity.id);
                await loadEntities();
            } catch (error) {
                logger.error('Delete failed:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                    <p className="text-gray-400">Chargement du carnet d'adresses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0a2a] to-[#0a0515] text-white p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Users size={40} className="text-accent" />
                        <div>
                            <h1 className="text-4xl font-bold">Carnet d'Adresses</h1>
                            <p className="text-gray-400 mt-1">
                                {entities.length} {entities.length > 1 ? 'personnes détectées' : 'personne détectée'}
                            </p>
                        </div>
                    </div>

                    {selectedEntities.size > 0 && (
                        <button
                            onClick={handleMerge}
                            className="px-6 py-3 bg-accent hover:bg-accent/80 rounded-full font-semibold flex items-center gap-2 transition-all transform hover:scale-105"
                        >
                            <GitMerge size={20} />
                            Fusionner ({selectedEntities.size})
                        </button>
                    )}
                </div>

                {/* Info Block: How Merge Works */}
                <div className="mb-8 bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 flex items-start gap-4">
                    <div className="p-2 bg-blue-500/20 rounded-full shrink-0">
                        <Info size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-100 mb-1">Comment fonctionne la Fusion ?</h3>
                        <p className="text-sm text-blue-200/80 leading-relaxed">
                            Plume apprend de vos connexions. Si une personne apparaît plusieurs fois sous des noms différents (ex: "Laurent", "Lolo", "Mon Frère") :
                        </p>
                        <ol className="list-decimal list-inside text-sm text-blue-200/80 mt-2 space-y-1">
                            <li>Sélectionnez les fiches concernées (en cliquant dessus).</li>
                            <li>Cliquez sur le bouton <strong>Fusionner</strong> qui apparaîtra en haut.</li>
                            <li>Plume combinera ces fiches et comprendra désormais que ces surnoms désignent la même personne.</li>
                        </ol>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher une personne ou un alias..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 outline-none focus:border-accent transition-colors"
                    />
                </div>

                {/* Entities Grid */}
                {filteredEntities.length === 0 ? (
                    <div className="text-center py-20">
                        <Users size={64} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-xl text-gray-400">
                            {searchQuery ? 'Aucune personne trouvée' : 'Aucune personne détectée pour le moment'}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Écrivez des souvenirs mentionnant des personnes pour les voir apparaître ici
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEntities.map((entity) => (
                            <div
                                key={entity.id}
                                className={`bg-white/5 border ${selectedEntities.has(entity.id)
                                    ? 'border-accent bg-accent/10'
                                    : 'border-white/10'
                                    } rounded-xl p-5 hover:bg-white/10 transition-all cursor-pointer group`}
                                onClick={() => handleToggleSelect(entity.id)}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
                                            {entity.canonicalName}
                                        </h3>
                                        {entity.displayName && entity.displayName !== entity.canonicalName && (
                                            <p className="text-sm text-gray-400">"{entity.displayName}"</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingEntity(entity);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Modifier"
                                        >
                                            <Edit2 size={16} className="text-gray-400 hover:text-accent" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(entity);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} className="text-gray-400 hover:text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Aliases */}
                                {entity.aliases.length > 0 && (
                                    <div className="mb-3">
                                        <p className="text-xs text-gray-500 mb-1">Alias connus :</p>
                                        <div className="flex flex-wrap gap-1">
                                            {entity.aliases.map((alias, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full"
                                                >
                                                    {alias}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Gender */}
                                {entity.gender && (
                                    <div className="mb-2">
                                        <span className="text-xs text-gray-400">
                                            {entity.gender === 'female' ? '👩' : entity.gender === 'male' ? '👨' : '👤'}
                                        </span>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                    <span className="text-xs text-gray-500">
                                        Mentionné {entity.mentionCount} fois
                                    </span>
                                    {selectedEntities.has(entity.id) && (
                                        <span className="text-xs text-accent font-semibold">✓ Sélectionné</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Entity Edit Modal - TODO */}
                {editingEntity && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-gradient-to-br from-[#2a1a4a] to-[#1a0a2a] border border-accent/30 rounded-2xl p-6 max-w-lg w-full mx-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold">Modifier {editingEntity.canonicalName}</h3>
                                <button
                                    onClick={() => setEditingEntity(null)}
                                    className="p-2 hover:bg-white/10 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Modification complète à venir dans la prochaine version...
                            </p>
                            <button
                                onClick={() => setEditingEntity(null)}
                                className="mt-4 w-full py-2 bg-accent hover:bg-accent/80 rounded-full font-semibold"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}

                {/* Merge Confirmation Modal with Context Bubbles */}
                {showMergeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-gradient-to-br from-[#2a1a4a] to-[#1a0a2a] border border-accent/30 rounded-2xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <GitMerge size={28} className="text-accent" />
                                    <h3 className="text-2xl font-bold">Fusionner ces personnes ?</h3>
                                </div>
                                <button
                                    onClick={cancelMerge}
                                    className="p-2 hover:bg-white/10 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Warning if contexts look different */}
                            {mergeContexts.length >= 2 && (() => {
                                const periods = mergeContexts.map(c => c.period);
                                const coOccurrenceSets = mergeContexts.map(c => new Set(c.coOccurrences));
                                const hasOverlappingPeople = coOccurrenceSets.length >= 2 &&
                                    [...coOccurrenceSets[0]].some(p => coOccurrenceSets[1].has(p));
                                const differentPeriods = periods[0] !== periods[1] && !periods.includes('Période inconnue');

                                if (!hasOverlappingPeople && differentPeriods) {
                                    return (
                                        <div className="mb-6 bg-amber-900/30 border border-amber-500/50 rounded-xl p-4 flex items-start gap-3">
                                            <AlertTriangle size={24} className="text-amber-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-semibold text-amber-200">Attention : Ces profils semblent être des personnes différentes</p>
                                                <p className="text-sm text-amber-300/80 mt-1">
                                                    Les périodes et les entourages ne se recoupent pas. Êtes-vous sûr de vouloir fusionner ?
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Context Bubbles Grid */}
                            {isLoadingContexts ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
                                    <span className="ml-4 text-gray-400">Analyse des profils...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {mergeContexts.map((context, idx) => (
                                        <div
                                            key={context.entityId}
                                            className={`bg-white/5 border rounded-xl p-4 ${context.entityId === primaryEntityId
                                                    ? 'border-accent bg-accent/10'
                                                    : 'border-white/20'
                                                }`}
                                        >
                                            {/* Entity Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-xl font-bold flex items-center gap-2">
                                                    <span className="w-8 h-8 bg-accent/30 rounded-full flex items-center justify-center text-sm">
                                                        {context.entityName.charAt(0)}
                                                    </span>
                                                    {context.entityName}
                                                </h4>
                                                {context.entityId === primaryEntityId && (
                                                    <span className="text-xs bg-accent text-white px-2 py-1 rounded-full">Principal</span>
                                                )}
                                            </div>

                                            {/* Souvenirs */}
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                                    <BookOpen size={14} />
                                                    <span>Apparaît dans :</span>
                                                </div>
                                                {context.mentionedInSouvenirs.length > 0 ? (
                                                    <ul className="space-y-1">
                                                        {context.mentionedInSouvenirs.map((s, i) => (
                                                            <li key={i} className="text-sm">
                                                                <span className="text-accent">•</span>{' '}
                                                                <span className="font-medium">{s.title}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">Aucun souvenir trouvé</p>
                                                )}
                                            </div>

                                            {/* Period */}
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                                    <Calendar size={14} />
                                                    <span>Période :</span>
                                                </div>
                                                <p className="text-sm font-medium">{context.period}</p>
                                            </div>

                                            {/* Co-occurrences */}
                                            {context.coOccurrences.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                                        <UserCheck size={14} />
                                                        <span>Souvent avec :</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {context.coOccurrences.map((person, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-white/10 text-xs rounded-full">
                                                                {person}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Select as Primary */}
                                            {context.entityId !== primaryEntityId && (
                                                <button
                                                    onClick={() => setPrimaryEntityId(context.entityId)}
                                                    className="mt-4 w-full py-2 border border-white/20 hover:border-accent hover:bg-accent/10 rounded-lg text-sm transition-colors"
                                                >
                                                    Définir comme principal
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={cancelMerge}
                                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={confirmMerge}
                                    disabled={isLoadingContexts}
                                    className="flex-1 py-3 bg-accent hover:bg-accent/80 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    <GitMerge size={18} />
                                    Confirmer la fusion
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddressBook;

