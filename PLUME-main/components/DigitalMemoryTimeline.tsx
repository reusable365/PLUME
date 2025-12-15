import React, { useState } from 'react';
import { DigitalMemory } from '../types';
import { IconImage, IconUsers, IconBriefcase, IconFeather, IconHeart, IconMapPin, IconSparkles, IconQuote, IconShare2 } from './Icons';

interface DigitalMemoryTimelineProps {
    memories: DigitalMemory[];
    onRaconter: (memory: DigitalMemory) => void;
}

export const DigitalMemoryTimeline: React.FC<DigitalMemoryTimelineProps> = ({ memories, onRaconter }) => {
    return (
        <div className="w-full overflow-x-auto pb-12 pt-4 px-4 scrollbar-hide">
            <div className="flex gap-6 min-w-max">
                {memories.map((memory, index) => (
                    <MemoryCard key={memory.id} memory={memory} index={index} onRaconter={onRaconter} />
                ))}
            </div>
        </div>
    );
};

const MemoryCard: React.FC<{ memory: DigitalMemory, index: number, onRaconter: (m: DigitalMemory) => void }> = ({ memory, index, onRaconter }) => {
    const [imageError, setImageError] = useState(false);

    const getPlatformColor = (platform: string) => {
        switch (platform) {
            case 'instagram': return 'from-pink-500 to-orange-500';
            case 'facebook': return 'from-blue-600 to-blue-700';
            case 'linkedin': return 'from-blue-700 to-slate-800';
            case 'twitter': return 'from-slate-700 to-black';
            default: return 'from-indigo-500 to-purple-600';
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'instagram': return IconImage;
            case 'facebook': return IconUsers;
            case 'linkedin': return IconBriefcase;
            default: return IconFeather;
        }
    };

    const PlatformIcon = getPlatformIcon(memory.platform);
    const gradient = getPlatformColor(memory.platform);

    return (
        <div
            className="w-[380px] bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 overflow-hidden flex flex-col group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 hover:-translate-y-2 animate-fade-in relative"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            {/* Header Flottant */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-md bg-gradient-to-br ${gradient}`}>
                    <PlatformIcon className="w-4 h-4" />
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-slate-700 shadow-sm border border-white/50">
                    {new Date(memory.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Zone Visuelle (Image ou Placeholder) */}
            <div className="relative h-56 overflow-hidden bg-slate-100">
                {memory.imageUrl && !imageError ? (
                    <>
                        <img
                            src={memory.imageUrl}
                            alt="Souvenir"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    </>
                ) : (
                    // Placeholder Élégant si pas d'image
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} opacity-10 relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <PlatformIcon className="w-32 h-32 transform -rotate-12" />
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent" />
                    </div>
                )}

                {/* Localisation (si dispo) ou Source Link */}
                {memory.location && (
                    <div className="absolute bottom-4 left-4 z-20">
                        {memory.location.startsWith('http') ? (
                            <a
                                href={memory.location}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-white/90 text-xs font-medium flex items-center gap-1.5 transition-colors border border-white/30"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <IconShare2 className="w-3 H-3" />
                                Voir le post
                            </a>
                        ) : (
                            <div className="text-white/90 text-xs font-medium flex items-center gap-1.5 drop-shadow-md">
                                <IconMapPin className="w-3.5 h-3.5" />
                                {memory.location}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Contenu */}
            <div className="p-6 flex-1 flex flex-col relative">
                {/* Icône de citation décorative */}
                <div className="absolute -top-5 right-6 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-500 z-20">
                    <IconQuote className="w-5 h-5" />
                </div>

                <div className="flex-1">
                    <p className="text-slate-700 text-base leading-relaxed italic mb-6 line-clamp-4 font-serif">
                        "{memory.content}"
                    </p>
                </div>

                {memory.analysis && (
                    <div className="mt-auto pt-4 border-t border-slate-100">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {memory.analysis.themes.slice(0, 3).map(theme => (
                                <span key={theme} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wide rounded-md border border-slate-100">
                                    {theme}
                                </span>
                            ))}
                        </div>

                        <button
                            onClick={() => onRaconter(memory)}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all duration-300 shadow-lg hover:shadow-indigo-200 transform active:scale-95"
                        >
                            <IconSparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                            Raconter ce souvenir
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
