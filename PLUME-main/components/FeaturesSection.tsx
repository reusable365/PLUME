
import React from 'react';
import { IconMicrophone, IconBook, IconCamera, IconPenTool, IconArrowRight, IconPrinter } from './Icons';
import MaieuticDemo from './MaieuticDemo';

const FeaturesSection: React.FC = () => {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-20">
                <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1 rounded-full">Le Processus</span>
                <h2 className="font-serif text-4xl font-bold text-ink-900 mt-6 md:text-5xl">Comment ça marche ?</h2>
                <p className="mt-6 text-ink-500 max-w-2xl mx-auto text-lg">
                    Quatre étapes simples pour transformer vos souvenirs en patrimoine.
                </p>
            </div>

            <div className="relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden lg:block absolute top-[180px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-indigo-200 via-amber-200 to-emerald-200 z-0 border-t-2 border-dashed border-gray-200"></div>

                <div className="grid lg:grid-cols-4 gap-8 relative z-10">
                    {/* Step 1: Confiez */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="w-24 h-24 bg-white rounded-full shadow-xl border-4 border-indigo-50 flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform duration-300">
                            <div className="bg-indigo-100 p-4 rounded-full">
                                <IconMicrophone className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 rounded-full text-white flex items-center justify-center font-bold border-2 border-white shadow">1</div>
                        </div>
                        <h3 className="font-serif text-xl font-bold text-ink-900 mb-3">Confiez</h3>
                        <p className="text-ink-500 text-sm leading-relaxed px-4">
                            Racontez vos souvenirs à voix haute ou déposez vos notes en vrac. Plume écoute et transcrit tout.
                        </p>
                    </div>

                    {/* Step 2: Structurez (Interactive) */}
                    <div className="flex flex-col items-center text-center lg:mt-[-40px] group">
                        {/* Card taking more space */}
                        <div className="w-full max-w-[320px] mb-6 transform group-hover:-translate-y-2 transition-transform duration-300">
                            <MaieuticDemo />
                        </div>
                        <div className="absolute top-[220px] lg:static lg:mt-2 opacity-0 lg:opacity-100"> {/* Hidden number for flow consistency visually */}
                            <div className="w-8 h-8 bg-amber-500 rounded-full text-white flex items-center justify-center font-bold mx-auto mb-4 shadow">2</div>
                        </div>
                        <h3 className="font-serif text-xl font-bold text-ink-900 mb-3">Structurez</h3>
                        <p className="text-ink-500 text-sm leading-relaxed px-4">
                            L'Architecte IA vous pose des questions pertinentes pour enrichir et ordonner votre récit.
                        </p>
                    </div>

                    {/* Step 3: Illustrez */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="w-24 h-24 bg-white rounded-full shadow-xl border-4 border-amber-50 flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform duration-300">
                            <div className="bg-amber-100 p-4 rounded-full">
                                <IconCamera className="w-8 h-8 text-amber-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-600 rounded-full text-white flex items-center justify-center font-bold border-2 border-white shadow">3</div>
                        </div>
                        <h3 className="font-serif text-xl font-bold text-ink-900 mb-3">Illustrez</h3>
                        <p className="text-ink-500 text-sm leading-relaxed px-4">
                            Ajoutez vos photos. PhotoCatalyst™ les analyse et les intègre automatiquement au bon endroit.
                        </p>
                    </div>

                    {/* Step 4: Recevez */}
                    <div className="flex flex-col items-center text-center group">
                        <div className="w-24 h-24 bg-white rounded-full shadow-xl border-4 border-emerald-50 flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform duration-300">
                            <div className="bg-emerald-100 p-4 rounded-full">
                                <IconBook className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-600 rounded-full text-white flex items-center justify-center font-bold border-2 border-white shadow">4</div>
                        </div>
                        <h3 className="font-serif text-xl font-bold text-ink-900 mb-3">Recevez</h3>
                        <p className="text-ink-500 text-sm leading-relaxed px-4">
                            Commandez votre livre imprimé, relié qualité éditeur, pour le transmettre à vos proches.
                        </p>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <button className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors border-b-2 border-indigo-200 hover:border-indigo-600 pb-1">
                        Voir le détail des fonctionnalités <IconArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
