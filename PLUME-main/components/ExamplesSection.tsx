
import React from 'react';
import { IconFeather, IconClock, IconBookOpen, IconImage } from './Icons';

const ExamplesSection: React.FC = () => {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto bg-gradient-to-br from-amber-50/30 via-white to-rose-50/20">
            <div className="text-center mb-16">
                <span className="text-amber-700 font-bold tracking-widest text-xs uppercase">Exemples Concrets</span>
                <h2 className="font-serif text-4xl font-bold text-ink-900 mt-2">Découvrez PLUME en Action</h2>
                <p className="text-ink-500 mt-4 max-w-2xl mx-auto">
                    Voyez comment PLUME transforme vos souvenirs en récits captivants et organise votre vie en une chronologie interactive.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Example 1: Generated Biography Snippet */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                            <IconFeather className="w-6 h-6" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-ink-900">Récit Généré par l'IA</h3>
                    </div>
                    <div className="bg-paper p-6 rounded-xl border-l-4 border-accent">
                        <p className="font-serif text-ink-700 leading-relaxed italic">
                            "C'était un dimanche matin de juillet 1985. Le soleil filtrait à travers les rideaux de dentelle de grand-mère,
                            dessinant des motifs dorés sur le parquet ciré. L'odeur du café fraîchement moulu se mêlait à celle des brioches
                            qui cuisaient dans le four. Je me souviens de ses mains ridées pétrissant la pâte avec une tendresse infinie..."
                        </p>
                        <p className="text-xs text-ink-400 mt-4 text-right">— Extrait généré à partir de vos souvenirs</p>
                    </div>
                </div>

                {/* Example 2: Timeline View */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                            <IconClock className="w-6 h-6" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-ink-900">Chronologie Interactive</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-20 text-sm font-bold text-accent">1985</div>
                            <div className="flex-1 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                                <p className="text-sm text-ink-700">Naissance à Paris</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-20 text-sm font-bold text-accent">2003</div>
                            <div className="flex-1 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                                <p className="text-sm text-ink-700">Premier voyage en Italie</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-20 text-sm font-bold text-accent">2015</div>
                            <div className="flex-1 bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                                <p className="text-sm text-ink-700">Rencontre avec Sophie</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Example 3: Manuscript Preview */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                            <IconBookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-ink-900">Votre Livre Personnel</h3>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl border border-amber-200">
                        <h4 className="font-serif text-xl font-bold text-ink-900 mb-3">Chapitre 1: Les Racines</h4>
                        <p className="text-sm text-ink-600 leading-relaxed mb-2">
                            Mon histoire commence dans une petite ville du sud de la France...
                        </p>
                        <h4 className="font-serif text-xl font-bold text-ink-900 mb-3 mt-4">Chapitre 2: L'Éveil</h4>
                        <p className="text-sm text-ink-600 leading-relaxed">
                            Les années d'université ont marqué un tournant décisif...
                        </p>
                        <div className="mt-4 pt-4 border-t border-ink-200">
                            <p className="text-xs text-ink-400 italic">Export disponible en PDF, EPUB, et format imprimable</p>
                        </div>
                    </div>
                </div>

                {/* Example 4: Photo Gallery */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-ink-100 hover:shadow-2xl transition-shadow">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                            <IconImage className="w-6 h-6" />
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-ink-900">Galerie de Souvenirs</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="aspect-square bg-gradient-to-br from-amber-200 to-rose-200 rounded-lg"></div>
                        <div className="aspect-square bg-gradient-to-br from-blue-200 to-purple-200 rounded-lg"></div>
                        <div className="aspect-square bg-gradient-to-br from-green-200 to-teal-200 rounded-lg"></div>
                        <div className="aspect-square bg-gradient-to-br from-pink-200 to-red-200 rounded-lg"></div>
                        <div className="aspect-square bg-gradient-to-br from-yellow-200 to-orange-200 rounded-lg"></div>
                        <div className="aspect-square bg-gradient-to-br from-indigo-200 to-blue-200 rounded-lg"></div>
                    </div>
                    <p className="text-xs text-ink-400 mt-4 text-center">
                        Organisez vos photos par personnages, lieux et événements
                    </p>
                </div>
            </div>
        </section>
    );
};

export default ExamplesSection;
