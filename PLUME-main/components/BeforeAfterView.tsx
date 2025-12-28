
import React, { useState } from 'react';
import { IconMicrophone, IconFeather, IconArrowRight } from './Icons';

const BeforeAfterView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-ink-100 max-w-4xl mx-auto mb-16">
            <div className="flex border-b border-ink-100 bg-gray-50">
                <button
                    onClick={() => setActiveTab('before')}
                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors duration-300 ${activeTab === 'before' ? 'bg-white text-ink-900 border-b-2 border-red-400 shadow-[0_2px_12px_rgba(0,0,0,0.05)]' : 'text-ink-400 hover:text-ink-600'}`}
                >
                    AVANT : Le Chaos
                </button>
                <div className="bg-ink-200 w-[1px]"></div>
                <button
                    onClick={() => setActiveTab('after')}
                    className={`flex-1 py-4 text-center font-bold text-sm transition-colors duration-300 ${activeTab === 'after' ? 'bg-amber-50 text-amber-800 border-b-2 border-amber-500 shadow-[0_2px_12px_rgba(180,83,9,0.1)]' : 'text-ink-400 hover:text-ink-600'}`}
                >
                    APRÈS : Le Chef-d'œuvre
                </button>
            </div>

            <div className="p-6 md:p-10 min-h-[350px] relative transition-colors duration-500 bg-white">
                {activeTab === 'before' ? (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-gray-100 p-5 rounded-xl rounded-tl-none border border-gray-200 w-full md:w-3/4 shadow-sm relative group hover:shadow-md transition-shadow">
                            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200">
                                BRUT
                            </div>
                            <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 uppercase tracking-widest font-bold">
                                <IconMicrophone className="w-4 h-4 text-gray-400" /> Note Vocale (0:24)
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1 bg-gray-300 rounded-full h-full min-h-[40px]"></div>
                                <p className="text-gray-600 italic leading-relaxed text-sm md:text-base">
                                    "Euh... c'était en 85 je crois... non 86, l'été de la coupe du monde. On mangeait des brioches chez mémé sur la terrasse. Y'avait une odeur de café incroyable, je m'en souviens encore. Je crois qu'il pleuvait ce jour-là, on entendait l'orage au loin."
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-gray-200 w-2/3 ml-auto rotate-2 shadow-sm relative hover:rotate-0 transition-transform duration-300">
                            <div className="flex items-center gap-2 mb-2 text-xs text-gray-400 uppercase tracking-widest font-bold">
                                📷 Photo Vrac
                            </div>
                            <div className="aspect-video bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                IMG_scan_0923.jpg
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-prose mx-auto animate-fade-in relative">
                        {/* Book Page Effect */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-100/50 to-transparent rounded-bl-[100px] pointer-events-none opacity-50"></div>

                        <h3 className="font-serif text-3xl font-bold text-ink-900 mb-6 border-b-2 border-amber-100 pb-4 inline-block">
                            Un Dimanche de Juillet
                        </h3>
                        <p className="font-serif text-ink-800 leading-loose text-lg text-justify drop-shadow-sm">
                            <span className="text-5xl float-left mr-3 mt-[-10px] text-amber-500 font-serif">C</span>
                            'était un dimanche matin de juillet 1986. Le soleil d'été luttait contre les nuages d'orage, filtrant une lumière étrange à travers les rideaux de dentelle de grand-mère. L'air était lourd, chargé d'électricité statique et de l'odeur ennivrante du café fraîchement moulu qui se mêlait aux effluves beurrés des brioches tièdes.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 text-xs text-amber-700 font-medium bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                <IconFeather className="w-3 h-3" />
                                Style : Nostalgique & Détaillé
                            </div>
                            <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                📍 Lieu : La Terrasse
                            </div>
                        </div>
                    </div>
                )}

                {/* Center visual indicator */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 hidden md:flex items-center justify-center">
                    <div className={`
                        w-12 h-12 rounded-full shadow-lg border-4 border-white flex items-center justify-center transition-all duration-500
                        ${activeTab === 'after' ? 'bg-amber-500 rotate-0' : 'bg-gray-300 rotate-180'}
                     `}>
                        <IconArrowRight className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BeforeAfterView;
