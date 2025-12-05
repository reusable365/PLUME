import React, { useState, useEffect } from 'react';
import { IconSearch, IconFilter, IconClock, IconUser, IconTag, IconChevronDown, IconX, IconFeather, IconBook, IconCamera, IconTrash, IconShare2, IconLink, IconMail, IconArrowUp } from './Icons';
import { supabase } from '../services/supabaseClient';
import { TagIntelligenceService, TagCluster } from '../services/tagIntelligenceService';
import { LifeInsightsService, LifeInsight } from '../services/lifeInsightsService';
import { LifeInsights } from './LifeInsights';

interface BoutiqueSouvenirsProps {
    userId: string;
    onSouvenirSelect?: (messageId: string) => void;
    onSouvenirShare?: (souvenir: any) => void;
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
    status?: 'draft' | 'published'; // Add status field
}

const BoutiqueSouvenirs: React.FC<BoutiqueSouvenirsProps> = ({ userId, onSouvenirSelect, onSouvenirShare }) => {
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
    const [selectedPlace, setSelectedPlace] = useState<string>('all'); // NEW
    const [youthFilter, setYouthFilter] = useState(false); // NEW

    // Available filter options
    const [decades, setDecades] = useState<string[]>([]);
    const [characters, setCharacters] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [tagClusters, setTagClusters] = useState<TagCluster[]>([]);
    const [places, setPlaces] = useState<string[]>([]); // NEW

    // Delete Confirmation State
    const [souvenirToDelete, setSouvenirToDelete] = useState<string | null>(null);

    // Share Modal State
    const [souvenirToShare, setSouvenirToShare] = useState<Souvenir | null>(null);

    // Drag and Drop State
    const [draggedSouvenir, setDraggedSouvenir] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Life Insights State (NEW)
    const [insights, setInsights] = useState<LifeInsight[]>([]);
    const [isLoadingInsights, setIsLoadingInsights] = useState(false);
    const [insightFilter, setInsightFilter] = useState<LifeInsight | null>(null);

    useEffect(() => {
        loadSouvenirs();
    }, [userId]);

    useEffect(() => {
        if (viewMode === 'stories') {
            applyFilters();
        } else {
            applyPhotoFilters();
        }
    }, [searchQuery, selectedDecade, selectedCharacter, selectedTag, selectedStatus, selectedPlace, youthFilter, insightFilter, souvenirs, photos, viewMode]);

    const loadSouvenirs = async () => {
        setIsLoading(true);
        try {
            // Load chapters (Saved Souvenirs) - NOW INCLUDING DRAFTS
            const { data: chapters, error } = await supabase
                .from('chapters')
                .select('*')
                .eq('user_id', userId)
                // Removed .eq('status', 'published') to show drafts too
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
                    isDrafted: c.status === 'published', // true if published (gravé)
                    isSynthesized: false,
                    status: c.status // Add status field for badge display
                }));

                setSouvenirs(processedSouvenirs);

                // Generate Life Insights (NEW)
                generateLifeInsights(processedSouvenirs);

                // Extract unique values for filters
                if (entities) {
                    const uniqueCharacters = [...new Set(entities.filter(e => e.type === 'person').map(e => e.value))];
                    const uniqueTags = [...new Set(entities.filter(e => e.type === 'theme').map(e => e.value))];
                    const uniquePlaces = [...new Set(entities.filter(e => e.type === 'place').map(e => e.value))]; // NEW
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
                    setPlaces(uniquePlaces.sort()); // NEW

                    // Organize tags with AI
                    if (uniqueTags.length > 0) {
                        console.log('🏷️ Starting tag organization for', uniqueTags.length, 'tags');
                        // Optimistic update first (flat list)
                        setTags(uniqueTags.sort());

                        // Then fetch AI organization in background
                        TagIntelligenceService.organizeTags(uniqueTags)
                            .then(clusters => {
                                console.log('✅ Tag clusters ready:', clusters);
                                setTagClusters(clusters);
                            })
                            .catch(err => {
                                console.warn('⚠️ Tag organization failed, using flat list:', err);
                            });
                    }

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

    // Generate Life Insights (NEW)
    const generateLifeInsights = async (souvenirsList: Souvenir[]) => {
        setIsLoadingInsights(true);
        try {
            const generatedInsights = await LifeInsightsService.generateInsights(souvenirsList);
            setInsights(generatedInsights);
        } catch (error) {
            console.error('Error generating insights:', error);
        } finally {
            setIsLoadingInsights(false);
        }
    };

    // Handle insight click to filter souvenirs (NEW)
    const handleInsightClick = (insight: LifeInsight) => {
        setInsightFilter(insight);
        // Scroll to souvenirs
        window.scrollTo({ top: 600, behavior: 'smooth' });
    };

    // Refresh insights (NEW)
    const handleRefreshInsights = () => {
        if (souvenirs.length > 0) {
            generateLifeInsights(souvenirs);
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

    // Drag handlers for reordering souvenirs
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, souvenirId: string) => {
        setDraggedSouvenir(souvenirId);
        e.dataTransfer.effectAllowed = 'move';
        // Visual cue
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        setDraggedSouvenir(null);
        setDragOverIndex(null);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
        e.preventDefault();
        if (!draggedSouvenir) return;
        const sourceIndex = filteredSouvenirs.findIndex(s => s.id === draggedSouvenir);
        if (sourceIndex === -1 || sourceIndex === targetIndex) return;
        const newSouvenirs = [...filteredSouvenirs];
        const [moved] = newSouvenirs.splice(sourceIndex, 1);
        newSouvenirs.splice(targetIndex, 0, moved);
        setFilteredSouvenirs(newSouvenirs);
        setDraggedSouvenir(null);
        setDragOverIndex(null);
        // TODO: persist order to DB when schema supports it
    };

    const handleMoveSouvenir = (souvenirId: string, direction: 'up' | 'down') => {
        const index = filteredSouvenirs.findIndex(s => s.id === souvenirId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= filteredSouvenirs.length) return;

        const newSouvenirs = [...filteredSouvenirs];
        const [moved] = newSouvenirs.splice(index, 1);
        newSouvenirs.splice(newIndex, 0, moved);
        setFilteredSouvenirs(newSouvenirs);
        // TODO: persist order
    };

    const handleShareClick = (souvenir: Souvenir) => {
        setSouvenirToShare(souvenir);
    };

    const applyFilters = () => {
        let filtered = [...souvenirs];

        // Insight filter (NEW) - Priority filter
        if (insightFilter) {
            filtered = filtered.filter(s => insightFilter.relatedSouvenirIds.includes(s.id));
        }

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
            const normalizedSelected = selectedTag.toLowerCase().trim();
            filtered = filtered.filter(s =>
                s.tags?.some(t => t.toLowerCase().trim().includes(normalizedSelected) || normalizedSelected.includes(t.toLowerCase().trim()))
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

        // Place filter (NEW)
        if (selectedPlace !== 'all') {
            filtered = filtered.filter(s => {
                // Check if place is mentioned in narrative/content or in metadata
                const placeInText = s.narrative?.toLowerCase().includes(selectedPlace.toLowerCase()) ||
                    s.content.toLowerCase().includes(selectedPlace.toLowerCase());
                return placeInText;
            });
        }

        // Youth filter (NEW) - Filter by age 0-18 based on user's birth date
        if (youthFilter) {
            filtered = filtered.filter(s => {
                if (!s.dates || s.dates.length === 0) return false;

                // For now, we'll use a simple heuristic
                // In a real implementation, we'd fetch user's birth_date from profile
                // and calculate the youth period (birth_year to birth_year + 18)
                return s.dates.some(d => {
                    const match = d.match(/\d{4}/);
                    if (match) {
                        const year = parseInt(match[0]);
                        // Placeholder: assuming youth is before 1990 for demo
                        // TODO: Calculate based on actual user birth_date
                        return year >= 1970 && year <= 1988;
                    }
                    return false;
                });
            });
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
        setSelectedPlace('all'); // NEW
        setYouthFilter(false); // NEW
    };

    const activeFiltersCount = [selectedDecade, selectedCharacter, selectedTag, selectedStatus, selectedPlace].filter(f => f !== 'all').length + (youthFilter ? 1 : 0);

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

            {/* Share Modal */}
            {souvenirToShare && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full relative">
                        <button
                            onClick={() => setSouvenirToShare(null)}
                            className="absolute top-4 right-4 text-ink-400 hover:text-ink-600"
                        >
                            <IconX className="w-6 h-6" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <IconShare2 className="w-8 h-8 text-accent" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-ink-900 mb-2">Partager ce souvenir</h3>
                            <p className="text-ink-600 text-sm">Invitez vos proches à enrichir "{souvenirToShare.title || 'ce souvenir'}" avec leurs propres mémoires.</p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/?guest=${souvenirToShare.id}`;
                                    const message = `Je vous invite à partager vos souvenirs de "${souvenirToShare.title}" 📖\n\nContribuez à mon livre de vie :\n${url}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-xl flex items-center gap-4 transition-colors group"
                            >
                                <div className="bg-green-500 text-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                    <IconShare2 className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-ink-900">WhatsApp</span>
                                    <span className="text-xs text-ink-500">Envoyer le lien d'invitation</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    const url = `${window.location.origin}/?guest=${souvenirToShare.id}`;
                                    const subject = `Invitation à partager un souvenir`;
                                    const body = `Bonjour,\n\nJ'écris le livre de ma vie avec PLUME et j'aimerais enrichir le chapitre "${souvenirToShare.title}" avec vos propres souvenirs.\n\nVotre contribution est précieuse ! Cliquez sur le lien ci-dessous :\n\n${url}\n\nÀ bientôt !`;
                                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                }}
                                className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-4 transition-colors group"
                            >
                                <div className="bg-blue-500 text-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                    <IconMail className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-ink-900">Email</span>
                                    <span className="text-xs text-ink-500">Envoyer une belle invitation</span>
                                </div>
                            </button>

                            <button
                                onClick={async () => {
                                    const url = `${window.location.origin}/?guest=${souvenirToShare.id}`;
                                    try {
                                        await navigator.clipboard.writeText(url);
                                        alert('✅ Lien copié dans le presse-papier !');
                                    } catch (err) {
                                        alert('❌ Erreur lors de la copie du lien');
                                    }
                                }}
                                className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-4 transition-colors group"
                            >
                                <div className="bg-slate-500 text-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                    <IconLink className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-ink-900">Copier le lien</span>
                                    <span className="text-xs text-ink-500">Pour partager partout</span>
                                </div>
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-ink-200"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-2 text-xs text-ink-400 uppercase">Prototype</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (onSouvenirShare) onSouvenirShare(souvenirToShare);
                                    setSouvenirToShare(null);
                                }}
                                className="w-full py-3 bg-ink-900 text-white rounded-xl font-bold hover:bg-ink-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <IconShare2 className="w-4 h-4" />
                                Simuler la vue Invité
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header - Le Sanctuaire */}
                <div className="mb-8 relative">
                    {/* Video Banner Placeholder */}
                    <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-6 shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-800 to-blue-900 animate-gradient-shift">
                            {/* Placeholder for video - will be replaced when video path is provided */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-white px-4">
                                    <div className="flex items-center justify-center gap-3 mb-3">
                                        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                                            <IconBook className="w-10 h-10 text-white" />
                                        </div>
                                    </div>
                                    <h1 className="text-4xl md:text-6xl font-serif font-bold mb-3 drop-shadow-lg">
                                        Le Sanctuaire
                                    </h1>
                                    <p className="text-lg md:text-xl font-light text-white/90 drop-shadow-md">
                                        Où vos souvenirs prennent vie
                                    </p>
                                </div>
                            </div>
                            {/* Animated overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        </div>
                    </div>

                    {/* Subtitle */}
                    <div className="text-center mb-6">
                        <p className="text-ink-700 text-lg md:text-xl font-medium">
                            Explorez, organisez et redécouvrez vos mémoires avec l'intelligence artificielle
                        </p>
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

                {/* Life Insights Section (NEW) */}
                {viewMode === 'stories' && (
                    <LifeInsights
                        insights={insights}
                        isLoading={isLoadingInsights}
                        onRefresh={handleRefreshInsights}
                        onInsightClick={handleInsightClick}
                        totalSouvenirs={souvenirs.length}
                    />
                )}

                {/* Active Insight Filter Badge (NEW) */}
                {insightFilter && (
                    <div className="mb-6 bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{insightFilter.type === 'emotional' ? '❤️' : insightFilter.type === 'temporal' ? '⏰' : insightFilter.type === 'relational' ? '👥' : '🗺️'}</span>
                            <div>
                                <p className="font-bold text-purple-900">{insightFilter.title}</p>
                                <p className="text-sm text-purple-700">{insightFilter.relatedSouvenirIds.length} souvenirs filtrés</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setInsightFilter(null)}
                            className="px-4 py-2 bg-white text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-colors flex items-center gap-2"
                        >
                            <IconX className="w-4 h-4" />
                            Retirer le filtre
                        </button>
                    </div>
                )}

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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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

                                {/* Place Filter (NEW) */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-700 mb-2">
                                        <span className="inline-block mr-1">📍</span>
                                        Lieu
                                    </label>
                                    <select
                                        value={selectedPlace}
                                        onChange={(e) => setSelectedPlace(e.target.value)}
                                        className="w-full p-3 bg-white border border-ink-200 rounded-xl text-ink-800 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                    >
                                        <option value="all">Tous les lieux</option>
                                        {places.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tag Filter */}
                                <div>
                                    <label className="block text-sm font-bold text-ink-700 mb-2">
                                        <IconTag className="inline w-4 h-4 mr-1" />
                                        Thème {tagClusters.length > 0 && <span className="text-xs text-green-600">(✨ IA organisée)</span>}
                                    </label>
                                    <select
                                        value={selectedTag}
                                        onChange={(e) => setSelectedTag(e.target.value)}
                                        className="w-full p-3 bg-white border border-ink-200 rounded-xl text-ink-800 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                                        style={{
                                            fontFamily: 'system-ui, -apple-system, sans-serif'
                                        }}
                                    >
                                        <option value="all">📚 Tous les thèmes</option>
                                        {tagClusters.length > 0 ? (
                                            tagClusters.map((cluster, idx) => {
                                                const colors = ['🔵', '🟢', '🟡', '🟣', '🟠', '🔴', '⚫', '⚪'];
                                                const emoji = colors[idx % colors.length];
                                                return (
                                                    <optgroup
                                                        key={cluster.category}
                                                        label={`${emoji} ${cluster.category.toUpperCase()}`}
                                                        style={{ fontWeight: 'bold', color: '#4F46E5' }}
                                                    >
                                                        {cluster.tags.map(t => (
                                                            <option key={t} value={t} style={{ paddingLeft: '1.5rem' }}>
                                                                {t}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                );
                                            })
                                        ) : (
                                            tags.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))
                                        )}
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

                            {/* Youth Filter Toggle (NEW) */}
                            <div className="mt-4 flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                                <label className="flex items-center cursor-pointer flex-1">
                                    <input
                                        type="checkbox"
                                        checked={youthFilter}
                                        onChange={(e) => setYouthFilter(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="relative w-11 h-6 bg-ink-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    <span className="ml-3 text-sm font-bold text-ink-900">
                                        🌱 Période "Jeunesse" (0-18 ans)
                                    </span>
                                </label>
                                <span className="text-xs text-purple-700 bg-white/60 px-3 py-1 rounded-full">
                                    Filtre intelligent
                                </span>
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
                                    className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl hover:scale-[1.03] hover:border-accent/30 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                                    onClick={() => onSouvenirSelect?.(souvenir.id)}
                                >
                                    {/* Action Buttons (Visible on Hover) */}
                                    <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleShareClick(souvenir);
                                            }}
                                            className="p-2 bg-white text-accent hover:text-white hover:bg-accent rounded-full shadow-sm transition-all"
                                            title="Partager ce souvenir"
                                        >
                                            <IconShare2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMoveSouvenir(souvenir.id, 'up');
                                            }}
                                            className="p-2 bg-white text-ink-600 hover:text-accent hover:bg-accent/10 rounded-full shadow-sm transition-all"
                                            title="Déplacer vers le haut"
                                        >
                                            <IconArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSouvenirToDelete(souvenir.id);
                                            }}
                                            className="p-2 bg-white text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full shadow-sm transition-all"
                                            title="Supprimer ce souvenir"
                                        >
                                            <IconTrash className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex items-center gap-2 mb-3">
                                        {souvenir.status === 'draft' && (
                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                                                📝 Brouillon
                                            </span>
                                        )}
                                        {souvenir.status === 'published' && (
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                ✅ Gravé
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
                )
                }

                {/* Photos Grid */}
                {
                    viewMode === 'photos' && (
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
                    )
                }
            </div >

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
                @keyframes gradient-shift {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }
                .animate-gradient-shift {
                    background-size: 200% 200%;
                    animation: gradient-shift 8s ease infinite;
                }
                .line-clamp-4 {
                    display: -webkit-box;
                    -webkit-line-clamp: 4;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div >
    );
};

export default BoutiqueSouvenirs;
