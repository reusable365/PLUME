import React, { useEffect, useState } from 'react';
import { analyzeLifeUniverse, LifeUniverseData, Place, Relationship, TimelineEvent, LifePeriod } from '../services/lifeUniverseService';
import { User, ChatMessage } from '../types';
import { IconMapPin, IconUsers, IconClock, IconTrendingUp, IconMap, IconCalendar, IconHeart, IconHome, IconBriefcase, IconPlane, IconStar, IconZap, IconRefresh } from './Icons';

interface LifeUniverseProps {
    userId: string;
    userProfile: User | null;
    messages: ChatMessage[];
}

type ViewMode = 'map' | 'relations' | 'timeline';

const LifeUniverse: React.FC<LifeUniverseProps> = ({ userId, userProfile, messages }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('map');
    const [data, setData] = useState<LifeUniverseData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<Relationship | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<LifePeriod | null>(null);

    useEffect(() => {
        loadLifeUniverse();
    }, [userId, messages]);

    const loadLifeUniverse = async (forceRefresh: boolean = false) => {
        setIsLoading(true);
        try {
            const universeData = await analyzeLifeUniverse(userId, userProfile, messages, forceRefresh);
            setData(universeData);
        } catch (error) {
            console.error('Error loading Life Universe:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = () => {
        loadLifeUniverse(true);
    };

    if (isLoading || !data) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                        <IconZap className="w-12 h-12 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-white/80 font-medium text-lg">Construction de votre Univers de Vie...</p>
                    <p className="text-white/50 text-sm mt-2">L'IA analyse vos souvenirs</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden relative">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Header */}
            <div className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 rounded-2xl shadow-lg">
                                <IconMap className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-white">Univers de Vie</h1>
                                <p className="text-white/60 text-sm mt-1">Votre vie en 3 dimensions</p>
                            </div>
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
                        >
                            <IconRefresh className="w-4 h-4" />
                            <span className="text-sm font-medium">Actualiser</span>
                        </button>
                    </div>

                    {/* Mode Selector */}
                    <div className="flex items-center gap-2 mt-4 bg-black/30 p-1.5 rounded-xl border border-white/10 w-fit">
                        <button
                            onClick={() => setViewMode('map')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-purple-500 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                        >
                            <IconMapPin className="w-5 h-5" />
                            <span className="font-medium">Carte</span>
                        </button>
                        <button
                            onClick={() => setViewMode('relations')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'relations' ? 'bg-purple-500 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                        >
                            <IconUsers className="w-5 h-5" />
                            <span className="font-medium">Relations</span>
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-purple-500 text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                        >
                            <IconClock className="w-5 h-5" />
                            <span className="font-medium">Chronologie</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 h-[calc(100%-180px)] overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {viewMode === 'map' && <MapView data={data} onSelectPlace={setSelectedPlace} />}
                    {viewMode === 'relations' && <RelationsView data={data} onSelectPerson={setSelectedPerson} />}
                    {viewMode === 'timeline' && <TimelineView data={data} onSelectPeriod={setSelectedPeriod} />}
                </div>
            </div>

            {/* Insights Footer */}
            <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-2 mb-3">
                        <IconZap className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-white font-bold">Insights IA</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {data.insights.map((insight, index) => (
                            <div key={index} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/80 text-sm">
                                {insight}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {selectedPlace && <PlaceModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />}
            {selectedPerson && <PersonModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />}
            {selectedPeriod && <PeriodModal period={selectedPeriod} onClose={() => setSelectedPeriod(null)} />}
        </div>
    );
};

// =====================================================
// MAP VIEW
// =====================================================

const MapView: React.FC<{ data: LifeUniverseData; onSelectPlace: (place: Place) => void }> = ({ data, onSelectPlace }) => {
    const getPlaceIcon = (type: string) => {
        switch (type) {
            case 'home': return IconHome;
            case 'work': return IconBriefcase;
            case 'school': return IconStar;
            case 'travel': return IconPlane;
            default: return IconMapPin;
        }
    };

    const getPlaceColor = (type: string) => {
        switch (type) {
            case 'home': return 'from-rose-500 to-pink-500';
            case 'work': return 'from-blue-500 to-cyan-500';
            case 'school': return 'from-yellow-500 to-orange-500';
            case 'travel': return 'from-green-500 to-emerald-500';
            default: return 'from-purple-500 to-indigo-500';
        }
    };

    if (data.places.length === 0) {
        return (
            <div className="text-center py-20">
                <IconMapPin className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Aucun lieu détecté pour le moment</p>
                <p className="text-white/40 text-sm mt-2">Continuez à écrire pour enrichir votre carte</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.places.map((place, index) => {
                    const Icon = getPlaceIcon(place.type);
                    const colorClass = getPlaceColor(place.type);

                    return (
                        <div
                            key={index}
                            onClick={() => onSelectPlace(place)}
                            className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer hover:scale-105"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`bg-gradient-to-br ${colorClass} p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-lg truncate">{place.name}</h3>
                                    <p className="text-white/60 text-sm mt-1">
                                        {place.city && place.country ? `${place.city}, ${place.country}` : place.city || place.country || 'Lieu'}
                                    </p>
                                    {place.period_start && (
                                        <div className="flex items-center gap-2 mt-2 text-white/50 text-xs">
                                            <IconCalendar className="w-3 h-3" />
                                            <span>{place.period_start}{place.period_end ? ` - ${place.period_end}` : ''}</span>
                                        </div>
                                    )}
                                    {place.memory_count > 0 && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="flex-1 bg-white/10 rounded-full h-1.5">
                                                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full" style={{ width: `${Math.min(place.importance_score, 100)}%` }}></div>
                                            </div>
                                            <span className="text-white/40 text-xs">{place.memory_count}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// =====================================================
// RELATIONS VIEW
// =====================================================

const RelationsView: React.FC<{ data: LifeUniverseData; onSelectPerson: (person: Relationship) => void }> = ({ data, onSelectPerson }) => {
    const getRelationshipColor = (type: string) => {
        switch (type) {
            case 'family': return 'from-rose-500 to-pink-500';
            case 'friend': return 'from-blue-500 to-cyan-500';
            case 'colleague': return 'from-green-500 to-emerald-500';
            case 'romantic': return 'from-red-500 to-rose-500';
            case 'mentor': return 'from-yellow-500 to-orange-500';
            default: return 'from-purple-500 to-indigo-500';
        }
    };

    const getRelationshipIcon = (type: string) => {
        switch (type) {
            case 'family': return IconHome;
            case 'friend': return IconHeart;
            case 'colleague': return IconBriefcase;
            case 'romantic': return IconHeart;
            case 'mentor': return IconStar;
            default: return IconUsers;
        }
    };

    if (data.relationships.length === 0) {
        return (
            <div className="text-center py-20">
                <IconUsers className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Aucune relation détectée pour le moment</p>
                <p className="text-white/40 text-sm mt-2">Mentionnez des personnes dans vos souvenirs</p>
            </div>
        );
    }

    // Group by type
    const groupedRelationships = data.relationships.reduce((acc, rel) => {
        const type = rel.relationship_type || 'other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(rel);
        return acc;
    }, {} as Record<string, Relationship[]>);

    return (
        <div className="space-y-8">
            {(Object.entries(groupedRelationships) as [string, Relationship[]][]).map(([type, relationships]) => {
                const Icon = getRelationshipIcon(type);
                const colorClass = getRelationshipColor(type);

                return (
                    <div key={type}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`bg-gradient-to-br ${colorClass} p-2 rounded-lg`}>
                                <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-white font-bold text-xl capitalize">{type === 'family' ? 'Famille' : type === 'friend' ? 'Amis' : type === 'colleague' ? 'Collègues' : type === 'romantic' ? 'Relations amoureuses' : type === 'mentor' ? 'Mentors' : 'Autres'}</h2>
                            <span className="text-white/40 text-sm">({relationships.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {relationships.map((person, index) => (
                                <div
                                    key={index}
                                    onClick={() => onSelectPerson(person)}
                                    className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer hover:scale-105"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                                            {person.person_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-bold truncate">{person.person_name}</h3>
                                            {person.relationship_subtype && (
                                                <p className="text-white/50 text-xs capitalize">{person.relationship_subtype}</p>
                                            )}
                                        </div>
                                    </div>
                                    {person.ai_summary && (
                                        <p className="text-white/60 text-sm line-clamp-2 italic">"{person.ai_summary}"</p>
                                    )}
                                    {person.mention_count > 0 && (
                                        <div className="mt-3 flex items-center gap-2 text-white/40 text-xs">
                                            <IconTrendingUp className="w-3 h-3" />
                                            <span>{person.mention_count} mentions</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// =====================================================
// TIMELINE VIEW
// =====================================================

const TimelineView: React.FC<{ data: LifeUniverseData; onSelectPeriod: (period: LifePeriod) => void }> = ({ data, onSelectPeriod }) => {
    if (data.periods.length === 0 && data.timeline.length === 0) {
        return (
            <div className="text-center py-20">
                <IconClock className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-lg">Chronologie en construction</p>
                <p className="text-white/40 text-sm mt-2">L'IA analyse vos souvenirs pour créer votre timeline</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Life Periods */}
            {data.periods.length > 0 && (
                <div>
                    <h2 className="text-white font-bold text-2xl mb-6 flex items-center gap-3">
                        <IconCalendar className="w-6 h-6 text-purple-400" />
                        Périodes de Vie
                    </h2>
                    <div className="space-y-4">
                        {data.periods.map((period, index) => (
                            <div
                                key={index}
                                onClick={() => onSelectPeriod(period)}
                                className="group bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:from-white/10 hover:to-white/15 hover:border-white/20 transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-white font-bold text-xl mb-2">{period.name}</h3>
                                        <div className="flex items-center gap-4 text-white/50 text-sm mb-3">
                                            {period.start_year && (
                                                <span>{period.start_year}{period.end_year ? ` - ${period.end_year}` : ' - Aujourd\'hui'}</span>
                                            )}
                                            {period.memory_count > 0 && (
                                                <span>• {period.memory_count} souvenirs</span>
                                            )}
                                        </div>
                                        {period.ai_summary && (
                                            <p className="text-white/70 italic">"{period.ai_summary}"</p>
                                        )}
                                        {period.ai_themes && period.ai_themes.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {period.ai_themes.map((theme, i) => (
                                                    <span key={i} className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-medium">
                                                        {theme}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {period.narrative_density > 0 && (
                                        <div className="ml-4">
                                            <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center">
                                                <span className="text-white font-bold text-lg">{period.narrative_density}%</span>
                                            </div>
                                            <p className="text-white/40 text-xs text-center mt-2">Densité</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timeline Events */}
            {data.timeline.length > 0 && (
                <div>
                    <h2 className="text-white font-bold text-2xl mb-6 flex items-center gap-3">
                        <IconZap className="w-6 h-6 text-yellow-400" />
                        Événements Marquants
                    </h2>
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-blue-500 to-purple-500"></div>

                        <div className="space-y-6">
                            {data.timeline.map((event, index) => (
                                <div key={index} className="relative pl-16">
                                    {/* Timeline dot */}
                                    <div className="absolute left-4 top-3 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-4 border-slate-900 shadow-lg"></div>

                                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-white font-bold">{event.title}</h3>
                                                {event.description && (
                                                    <p className="text-white/60 text-sm mt-1">{event.description}</p>
                                                )}
                                            </div>
                                            <span className="text-white/40 text-sm ml-4">{event.date_start}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =====================================================
// MODALS
// =====================================================

const PlaceModal: React.FC<{ place: Place; onClose: () => void }> = ({ place, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full p-8 border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-2xl mb-4">{place.name}</h2>
            <div className="space-y-3 text-white/70">
                {place.city && <p><strong>Ville:</strong> {place.city}</p>}
                {place.country && <p><strong>Pays:</strong> {place.country}</p>}
                {place.period_start && <p><strong>Période:</strong> {place.period_start}{place.period_end ? ` - ${place.period_end}` : ''}</p>}
                {place.ai_description && <p className="italic mt-4">"{place.ai_description}"</p>}
            </div>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                Fermer
            </button>
        </div>
    </div>
);

const PersonModal: React.FC<{ person: Relationship; onClose: () => void }> = ({ person, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full p-8 border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-2xl mb-4">{person.person_name}</h2>
            <div className="space-y-3 text-white/70">
                {person.relationship_subtype && <p><strong>Relation:</strong> {person.relationship_subtype}</p>}
                {person.met_date && <p><strong>Rencontre:</strong> {person.met_date}</p>}
                {person.ai_summary && <p className="italic mt-4">"{person.ai_summary}"</p>}
                {person.ai_personality_traits && person.ai_personality_traits.length > 0 && (
                    <div className="mt-4">
                        <strong>Traits:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {person.ai_personality_traits.map((trait, i) => (
                                <span key={i} className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300 text-sm">
                                    {trait}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                Fermer
            </button>
        </div>
    </div>
);

const PeriodModal: React.FC<{ period: LifePeriod; onClose: () => void }> = ({ period, onClose }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl max-w-2xl w-full p-8 border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-2xl mb-4">{period.name}</h2>
            <div className="space-y-3 text-white/70">
                {period.start_year && <p><strong>Période:</strong> {period.start_year}{period.end_year ? ` - ${period.end_year}` : ' - Aujourd\'hui'}</p>}
                {period.memory_count > 0 && <p><strong>Souvenirs:</strong> {period.memory_count}</p>}
                {period.ai_summary && <p className="italic mt-4">"{period.ai_summary}"</p>}
                {period.ai_themes && period.ai_themes.length > 0 && (
                    <div className="mt-4">
                        <strong>Thèmes:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {period.ai_themes.map((theme, i) => (
                                <span key={i} className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm">
                                    {theme}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <button onClick={onClose} className="mt-6 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                Fermer
            </button>
        </div>
    </div>
);

export default LifeUniverse;
