import React, { useState, useEffect } from 'react';
import { IconSearch, IconFilter, IconClock, IconUser, IconTag, IconChevronDown, IconX, IconFeather, IconBook, IconCamera, IconTrash } from './Icons';
import { supabase } from '../services/supabaseClient';

interface BoutiqueSouvenirsProps {
    userId: string;
    onSouvenirSelect?: (messageId: string) => void;
}

interface Souvenir {
    id: string;
    title?: string;
    content: string;
    narrative?: string;
    created_at: string;
    dates?: string[];
    characters?: string[];
    tags?: string[];
    isDrafted?: boolean;
    isSynthesized?: boolean;
}

const BoutiqueSouvenirs: React.FC<BoutiqueSouvenirsProps> = ({ userId, onSouvenirSelect }) => {
    const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
    const [filteredSouvenirs, setFilteredSouvenirs] = useState<Souvenir[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // View Mode: 'stories' or 'photos'
    const [viewMode, setViewMode] = useState<'stories' | 'photos'>('stories');
    const [photos, setPhotos] = useState<any[]>([]);
    const [filteredPhotos, setFilteredPhotos] = useState<any[]>([]);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [selectedDecade, setSelectedDecade] = useState<string>('all');
    const [selectedCharacter, setSelectedCharacter] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Available filter options
    const [decades, setDecades] = useState<string[]>([]);
    const [characters, setCharacters] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);

    // Delete Confirmation State
    const [souvenirToDelete, setSouvenirToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadSouvenirs();
    }, [userId]);

    useEffect(() => {
        if (viewMode === 'stories') {
            applyFilters();
        } else {
            applyPhotoFilters();
        }
    }, [searchQuery, selectedDecade, selectedCharacter, selectedTag, selectedStatus, souvenirs, photos, viewMode]);

    const loadSouvenirs = async () => {
        setIsLoading(true);
        try {
            // Load chapters (Saved Souvenirs)
            const { data: chapters, error } = await supabase
                .from('chapters')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Load entities for filters
            const { data: entities } = await supabase
                .from('entities')
                .select('*')
                .eq('user_id', userId);

            if (chapters) {
                const processedSouvenirs: Souvenir[] = chapters.map(c => ({
                    id: c.id,
                    title: c.title,
                    content: c.content,
                    narrative: c.content,
                    created_at: c.created_at,
                    dates: c.metadata?.dates || [],
                    characters: c.metadata?.characters || [],
                    tags: c.metadata?.tags || [],
                    isDrafted: true,
                    isSynthesized: false
                }));

                setSouvenirs(processedSouvenirs);

                // Extract unique values for filters
                if (entities) {
                    const uniqueCharacters = [...new Set(entities.filter(e => e.type === 'person').map(e => e.value))];
                    const uniqueTags = [...new Set(entities.filter(e => e.type === 'theme').map(e => e.value))];
                    const uniqueDates = entities.filter(e => e.type === 'date').map(e => e.value);

                    // Extract decades from dates
                    const extractedDecades = uniqueDates
                        .map(d => {
                            const match = d.match(/\d{4}/);
                            if (match) {
                                const year = parseInt(match[0]);
                                return `${Math.floor(year / 10) * 10}s`;
                            }
                            return null;
                        })
                        .filter(d => d !== null) as string[];

                    setCharacters(uniqueCharacters.sort());
                    setTags(uniqueTags.sort());
                    setDecades([...new Set(extractedDecades)].sort());
                }
            }

            // Load photos from profiles
            const { data: profile } = await supabase
                .from('profiles')
                .select('photos')
                .eq('id', userId)
                .single();

            if (profile?.photos) {
                setPhotos(profile.photos);
            }
        } catch (error) {
            console.error('Error loading souvenirs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSouvenir = async () => {
        if (!souvenirToDelete) return;

        try {
            const { error } = await supabase
                .from('chapters')
                .delete()
                .eq('id', souvenirToDelete);

            if (error) throw error;

            // Update local state
            setSouvenirs(prev => prev.filter(s => s.id !== souvenirToDelete));
            setSouvenirToDelete(null);
        } catch (error) {
            console.error('Error deleting souvenir:', error);
            alert('Erreur lors de la suppression du souvenir.');
        }
    };

    const applyFilters = () => {
        let filtered = [...souvenirs];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.narrative?.toLowerCase().includes(query) ||
                s.content.toLowerCase().includes(query) ||
                s.characters?.some(c => c.toLowerCase().includes(query)) ||
                s.tags?.some(t => t.toLowerCase().includes(query))
            );
        }

        // Decade filter
        if (selectedDecade !== 'all') {
            filtered = filtered.filter(s =>
                s.dates?.some(d => {
                    const match = d.match(/\d{4}/);
                    if (match) {
                        const year = parseInt(match[0]);
                        const decade = `${Math.floor(year / 10) * 10}s`;
                        return decade === selectedDecade;
                    }
                    return false;
                })
            );
        }

        // Character filter
        if (selectedCharacter !== 'all') {
            filtered = filtered.filter(s =>
                s.characters?.includes(selectedCharacter)
            );
        }

        // Tag filter
        if (selectedTag !== 'all') {
            filtered = filtered.filter(s =>
                s.tags?.includes(selectedTag)
            );
        }

        // Status filter
        if (selectedStatus !== 'all') {
            if (selectedStatus === 'drafted') {
                filtered = filtered.filter(s => s.isDrafted);
            } else if (selectedStatus === 'synthesized') {
                filtered = filtered.filter(s => s.isSynthesized);
            } else if (selectedStatus === 'raw') {
                filtered = filtered.filter(s => !s.isDrafted && !s.isSynthesized);
            }
        }

        setFilteredSouvenirs(filtered);
    };

    const applyPhotoFilters = () => {
        let filtered = [...photos];

        // Character filter (most important for photos)
        if (selectedCharacter !== 'all') {
            filtered = filtered.filter(photo =>
                photo.linkedCharacters?.includes(selectedCharacter)
            );
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(photo =>
                photo.caption?.toLowerCase().includes(query) ||
                photo.analysis?.description?.toLowerCase().includes(query) ||
                photo.linkedCharacters?.some((c: string) => c.toLowerCase().includes(query))
            );
        }

        setFilteredPhotos(filtered);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedDecade('all');
        setSelectedCharacter('all');
        setSelectedTag('all');
        setSelectedStatus('all');
    };

    const activeFiltersCount = [selectedDecade, selectedCharacter, selectedTag, selectedStatus].filter(f => f !== 'all').length;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-rose-50/20 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4"></div>
                    <p className="text-ink-600 font-medium">Chargement de vos souvenirs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-rose-50/20 p-4 md:p-8 overflow-y-auto relative">
            {/* Delete Confirmation Modal */}
            {souvenirToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-fade-in">
                        <h3 className="text-xl font-bold text-ink-900 mb-2">Supprimer ce souvenir ?</h3>
                        <p className="text-ink-600 mb-6">Cette action est irréversible. Le souvenir sera définitivement effacé de votre livre.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setSouvenirToDelete(null)}
                                className="px-4 py-2 text-ink-600 hover:bg-ink-50 rounded-lg font-medium transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteSouvenir}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                            >
                                <IconTrash className="w-4 h-4" />
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-accent to-amber-600 p-3 rounded-2xl shadow-lg">
                            <IconBook className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-5xl font-serif font-bold text-ink-900 leading-tight">
                                Boutique des Souvenirs
                            </h1>
                            <p className="text-ink-600 text-base md:text-lg mt-1 font-medium">
                                Explorez, recherchez et redécouvrez vos mémoires
                            </p>
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex gap-2 bg-white/80 p-2 rounded-xl border border-ink-200 shadow-sm">
                        <button
                            onClick={() => setViewMode('stories')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${viewMode === 'stories'
                                ? 'bg-accent text-white shadow-md'
                                : 'text-ink-600 hover:bg-ink-50'
                                }`}
                        >
                            📖 Histoires
                        </button>
                        <button
                            onClick={() => setViewMode('photos')}
                            className={`px-6 py-2 rounded-lg font-semibold transition-all ${viewMode === 'photos'
                                ? 'bg-accent text-white shadow-md'
                                : 'text-ink-600 hover:bg-ink-50'
                                }`}
                        >
                            📸 Photos
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-ink-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <IconSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher dans vos souvenirs..."
                                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-ink-100 rounded-xl text-ink-800 placeholder-ink-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${showFilters || activeFiltersCount > 0
                                ? 'bg-accent text-white shadow-lg'
                                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                                }`}
                        >
                            <IconFilter className="w-5 h-5" />
                            <span>Filtres</span>
                            {activeFiltersCount > 0 && (
                                <span className="bg-white text-accent rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-ink-200 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Decade Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-700 mb-2">
                                        <IconClock className="inline w-4 h-4 mr-1" />
                                        Période
                                    </label>
                                    <select
                                        value={selectedDecade}
                                        onChange={(e) => setSelectedDecade(e.target.value)}
                                        className="w-full p-3 bg-white border border-ink-200 rounded-xl text-ink-800 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    >
                                        <option value="all">Toutes les périodes</option>
                                        {decades.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Character Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-700 mb-2">
                                        <IconUser className="inline w-4 h-4 mr-1" />
                                        Personnage
                                    </label>
                                    <select
                                        value={selectedCharacter}
                                        onChange={(e) => setSelectedCharacter(e.target.value)}
                                        className="w-full p-3 bg-white border border-ink-200 rounded-xl text-ink-800 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    >
                                        <option value="all">Tous les personnages</option>
                                        {characters.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tag Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-700 mb-2">
                                        <IconTag className="inline w-4 h-4 mr-1" />
                                        Thème
                                    </label>
                                    <select
                                        value={selectedTag}
                                        onChange={(e) => setSelectedTag(e.target.value)}
                                        className="w-full p-3 bg-white border border-ink-200 rounded-xl text-ink-800 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    >
                                        <option value="all">Tous les thèmes</option>
                                        {tags.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-700 mb-2">
                                        <IconFeather className="inline w-4 h-4 mr-1" />
                                        Statut
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full p-3 bg-white border border-ink-200 rounded-xl text-ink-800 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    >
                                        <option value="all">Tous les statuts</option>
                                        <option value="raw">Brut</option>
                                        <option value="drafted">Gravé</option>
                                        <option value="synthesized">Synthétisé</option>
                                    </select>
                                </div>
                            </div>

                            {activeFiltersCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
                                >
                                    <IconX className="w-4 h-4" />
                                    Réinitialiser les filtres
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Count */}
                <div className="mb-4 text-ink-600 font-medium">
                    {viewMode === 'stories' ? (
                        <>{filteredSouvenirs.length} souvenir{filteredSouvenirs.length !== 1 ? 's' : ''} trouvé{filteredSouvenirs.length !== 1 ? 's' : ''}</>
                    ) : (
                        <>{filteredPhotos.length} photo{filteredPhotos.length !== 1 ? 's' : ''} trouvée{filteredPhotos.length !== 1 ? 's' : ''}</>
                    )}
                </div>

                {/* Stories Grid */}
                {viewMode === 'stories' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSouvenirs.map((souvenir) => (
                                <div
                                    key={souvenir.id}
                                    className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-ink-100 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group relative"
                                    onClick={() => onSouvenirSelect?.(souvenir.id)}
                                >
                                    {/* Delete Button (Visible on Hover) */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSouvenirToDelete(souvenir.id);
                                        }}
                                        className="absolute top-4 right-4 p-2 bg-white text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                        title="Supprimer ce souvenir"
                                    >
                                        <IconTrash className="w-4 h-4" />
                                    </button>

                                    {/* Status Badge */}
                                    <div className="flex items-center gap-2 mb-3">
                                        {souvenir.isDrafted && (
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                Gravé
                                            </span>
                                        )}
                                        {souvenir.isSynthesized && (
                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                                                Synthétisé
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Preview */}
                                    {souvenir.title && (
                                        <h4 className="font-bold text-lg text-ink-900 mb-2">{souvenir.title}</h4>
                                    )}
                                    <p className="text-ink-800 font-serif leading-relaxed mb-4 line-clamp-4">
                                        {souvenir.narrative || souvenir.content}
                                    </p>

                                    {/* Metadata */}
                                    <div className="space-y-2 text-sm">
                                        {souvenir.characters && souvenir.characters.length > 0 && (
                                            <div className="flex items-start gap-2">
                                                <IconUser className="w-4 h-4 text-ink-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex flex-wrap gap-1">
                                                    {souvenir.characters.slice(0, 3).map((char, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                            {char}
                                                        </span>
                                                    ))}
                                                    {souvenir.characters.length > 3 && (
                                                        <span className="px-2 py-0.5 bg-ink-100 text-ink-600 rounded text-xs">
                                                            +{souvenir.characters.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {souvenir.tags && souvenir.tags.length > 0 && (
                                            <div className="flex items-start gap-2">
                                                <IconTag className="w-4 h-4 text-ink-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex flex-wrap gap-1">
                                                    {souvenir.tags.slice(0, 3).map((tag, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {souvenir.tags.length > 3 && (
                                                        <span className="px-2 py-0.5 bg-ink-100 text-ink-600 rounded text-xs">
                                                            +{souvenir.tags.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-ink-500 text-xs pt-2 border-t border-ink-100">
                                            <IconClock className="w-3 h-3" />
                                            {new Date(souvenir.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State for Stories */}
                        {filteredSouvenirs.length === 0 && (
                            <div className="text-center py-16">
                                <IconBook className="w-16 h-16 text-ink-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-ink-700 mb-2">Aucun souvenir trouvé</h3>
                                <p className="text-ink-500">
                                    {searchQuery || activeFiltersCount > 0
                                        ? 'Essayez de modifier vos critères de recherche'
                                        : 'Commencez à écrire dans l\'atelier pour créer vos premiers souvenirs'}
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Photos Grid */}
                {viewMode === 'photos' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredPhotos.map((photo) => (
                                <div
                                    key={photo.id}
                                    className="group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer"
                                >
                                    {/* Photo */}
                                    <div className="aspect-square overflow-hidden">
                                        <img
                                            src={photo.url}
                                            alt={photo.caption || 'Photo'}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>

                                    {/* Overlay with info */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                        {photo.linkedCharacters && photo.linkedCharacters.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {photo.linkedCharacters.map((person: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-white/90 text-accent text-xs font-bold rounded-full">
                                                        {person}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {photo.caption && (
                                            <p className="text-white text-sm font-medium line-clamp-2">
                                                {photo.caption}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State for Photos */}
                        {filteredPhotos.length === 0 && (
                            <div className="text-center py-16">
                                <IconCamera className="w-16 h-16 text-ink-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-ink-700 mb-2">Aucune photo trouvée</h3>
                                <p className="text-ink-500">
                                    {selectedCharacter !== 'all'
                                        ? `Aucune photo de ${selectedCharacter} pour le moment`
                                        : searchQuery || activeFiltersCount > 0
                                            ? 'Essayez de modifier vos critères de recherche'
                                            : 'Utilisez le Catalyseur Photo pour ajouter vos premières photos'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                .line-clamp-4 {
                    display: -webkit-box;
                    -webkit-line-clamp: 4;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default BoutiqueSouvenirs;
