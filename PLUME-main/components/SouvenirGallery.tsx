

import React from 'react';
import { IconUser, IconTag, IconImage, IconMap } from './Icons';
import { Photo } from '../types';

interface SouvenirGalleryProps {
    characters: Set<string>;
    tags: Set<string>;
    photos: Photo[];
}

const SouvenirGallery: React.FC<SouvenirGalleryProps> = ({ characters, tags, photos }) => {
    return (
        <div className="p-8 h-full overflow-y-auto bg-paper">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center md:text-left">
                    <h2 className="font-serif text-3xl font-bold text-ink-900">Souvenirs & Entités</h2>
                    <p className="text-ink-500 mt-2">La cartographie des personnes et des thèmes de votre vie.</p>
                </div>

                {/* People Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-ink-200 pb-2">
                        <IconUser className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-semibold text-ink-800 uppercase tracking-wide">Cercle Familial & Amis</h3>
                    </div>

                    {characters.size === 0 ? (
                        <div className="text-center py-10 bg-white rounded-lg border border-ink-100">
                            <p className="text-ink-400 italic">Aucun personnage identifié pour le moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {Array.from(characters).map((char: string, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-ink-100 hover:shadow-md transition-all group cursor-pointer text-center">
                                    <div className="w-16 h-16 mx-auto bg-ink-100 rounded-full mb-3 flex items-center justify-center text-xl font-serif text-ink-400 group-hover:bg-accent group-hover:text-white transition-colors">
                                        {char.charAt(0)}
                                    </div>
                                    <h4 className="font-medium text-ink-900 truncate">{char}</h4>
                                    <span className="text-xs text-ink-400">1 mention</span>
                                </div>
                            ))}
                            <div className="bg-ink-50 border border-dashed border-ink-300 rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-white transition-colors text-ink-500 hover:text-accent">
                                <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center mb-2 text-xl">+</div>
                                <span className="text-xs font-bold">AJOUTER</span>
                            </div>
                        </div>
                    )}
                </section>

                {/* Gallery Section (Visual Mockup) */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-ink-200 pb-2">
                        <IconImage className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-semibold text-ink-800 uppercase tracking-wide">Médiathèque des Souvenirs</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {photos.length === 0 ? (
                            <div className="col-span-full text-center py-10 bg-white rounded-lg border border-ink-100">
                                <p className="text-ink-400 italic">Aucune photo pour le moment.</p>
                            </div>
                        ) : (
                            photos.map((photo) => (
                                <div key={photo.id} className="aspect-square bg-ink-200 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all">
                                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-3">
                                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
                                            {photo.caption || "Sans titre"}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="aspect-square bg-ink-50 rounded-lg flex items-center justify-center border border-dashed border-ink-300 text-ink-400 text-xs hover:bg-white hover:text-accent cursor-pointer transition-colors">
                            Déposez une photo
                        </div>
                    </div>
                </section>

                {/* Tags Section */}
                <section>
                    <div className="flex items-center gap-3 mb-6 border-b border-ink-200 pb-2">
                        <IconTag className="w-5 h-5 text-accent" />
                        <h3 className="text-lg font-semibold text-ink-800 uppercase tracking-wide">Thèmes Récurrents</h3>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {tags.size === 0 ? (
                            <span className="text-ink-400 italic text-sm">Aucun thème détecté.</span>
                        ) : (
                            Array.from(tags).map((tag, i) => (
                                <div key={i} className="px-4 py-2 bg-white border border-ink-200 rounded-full text-sm font-medium text-ink-700 hover:border-accent hover:text-accent cursor-pointer transition-colors shadow-sm">
                                    #{tag}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SouvenirGallery;