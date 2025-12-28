
import React from 'react';
import { IconFeather, IconClock, IconBookOpen, IconImage, IconUser, IconMapPin, IconSparkles } from './Icons';
import BeforeAfterView from './BeforeAfterView';

const ExamplesSection: React.FC = () => {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto bg-gradient-to-br from-amber-50/50 via-white to-rose-50/30">
            <div className="text-center mb-16">
                <span className="text-amber-700 font-bold tracking-widest text-xs uppercase bg-amber-100 px-3 py-1 rounded-full">Exemples Concrets</span>
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-ink-900 mt-6 mb-6">De la Mémoire au Récit</h2>
                <p className="text-ink-600 text-lg max-w-2xl mx-auto leading-relaxed">
                    Voyez comment PLUME transforme le chaos de vos souvenirs en une œuvre littéraire structurée et émouvante.
                </p>
            </div>

            {/* Feature Spotlight: Before/After */}
            <div className="mb-24">
                <BeforeAfterView />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Example 2: Timeline View (Enhanced) */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-xl transition-all hover:-translate-y-2 group">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                        <IconClock className="w-7 h-7" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-ink-900 mb-4">Chronologie Vivante</h3>
                    <div className="space-y-4 relative">
                        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-blue-100"></div>

                        {[
                            { year: '1985', title: 'Naissance à Paris', icon: IconUser, color: 'text-purple-500' },
                            { year: '2003', title: 'Voyage en Italie', icon: IconMapPin, color: 'text-emerald-500' },
                            { year: '2015', title: 'Rencontre Sophie', icon: IconSparkles, color: 'text-amber-500' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 relative z-10">
                                <div className="w-10 text-xs font-bold text-ink-400 text-right">{item.year}</div>
                                <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-white ${item.color.replace('text', 'bg')}`}></div>
                                <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm font-medium text-ink-700 shadow-sm">
                                    {item.title}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Example 3: Manuscript Preview (Enhanced) */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-xl transition-all hover:-translate-y-2 group">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
                        <IconBookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-ink-900 mb-4">Mise en Page Éditeur</h3>
                    <div className="relative bg-[#fffdf5] p-6 rounded-r-xl border-l-[6px] border-amber-800 shadow-md rotate-1 hover:rotate-0 transition-transform duration-300">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-gray-200/50 to-transparent rounded-bl-3xl pointer-events-none"></div>
                        <h4 className="font-serif text-lg font-bold text-ink-900 mb-2 border-b border-amber-200 pb-2">Chapitre 1: Les Racines</h4>
                        <div className="space-y-2">
                            <div className="h-2 bg-ink-100 rounded w-full"></div>
                            <div className="h-2 bg-ink-100 rounded w-full"></div>
                            <div className="h-2 bg-ink-100 rounded w-5/6"></div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-amber-100 flex justify-between text-[10px] text-ink-400 font-mono">
                            <span>PAGE 12</span>
                            <span>PLUME ÉDITIONS</span>
                        </div>
                    </div>
                </div>

                {/* Example 4: Photo Gallery (Enhanced - Polaroids) */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-xl transition-all hover:-translate-y-2 group">
                    <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-6 group-hover:scale-110 transition-transform">
                        <IconImage className="w-7 h-7" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-ink-900 mb-4">Galerie Intelligente</h3>
                    <div className="relative h-48 w-full flex items-center justify-center">
                        {/* Polaroid 1 */}
                        <div className="absolute transform -rotate-6 hover:-rotate-3 transition-transform duration-300 bg-white p-2 pb-8 shadow-md border border-gray-100 w-24 left-4 top-4 z-10 transition-transform duration-300">
                            <div className="bg-gray-200 aspect-square"></div>
                        </div>
                        {/* Polaroid 2 */}
                        <div className="absolute transform rotate-3 hover:rotate-6 transition-transform duration-300 bg-white p-2 pb-8 shadow-md border border-gray-100 w-28 right-8 top-8 z-20 transition-transform duration-300">
                            <div className="bg-gray-800 aspect-square opacity-80"></div>
                            <div className="absolute bottom-2 left-0 right-0 text-center text-[8px] font-handwriting text-gray-500 transform rotate-1">Maman, 1982</div>
                        </div>
                        {/* Polaroid 3 */}
                        <div className="absolute transform -rotate-12 hover:-rotate-6 transition-transform duration-300 bg-white p-2 pb-8 shadow-lg border border-gray-100 w-24 left-10 bottom-2 z-30 transition-transform duration-300">
                            <div className="bg-amber-100 aspect-square"></div>
                        </div>
                    </div>
                    <p className="text-xs text-ink-400 mt-2 text-center">
                        Reconnaissance faciale et datation automatique
                    </p>
                </div>
            </div>
        </section>
    );
};


export default ExamplesSection;
