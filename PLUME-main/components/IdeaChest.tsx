
import React, { useState, useEffect } from 'react';
import { Idea } from '../types';
import { IconArchive, IconPlus, IconTag, IconTrash, IconCheck, IconX, IconChevronDown, IconFileText, IconSave, IconMagic } from './Icons';

interface IdeaChestProps {
    ideas: Idea[];
    draftContent: string;
    draftPhotos?: string[];
    onAddIdea: (title: string, content: string, tag: string) => Promise<void>;
    onDeleteIdea: (id: string) => Promise<void>;
    onIdeaClick: (idea: Idea) => void;
    onUpdateDraft: (content: string) => void;
    onInsertDraft: () => void;
}

const IdeaChest: React.FC<IdeaChestProps> = ({
    ideas,
    draftContent,
    draftPhotos = [],
    onAddIdea,
    onDeleteIdea,
    onIdeaClick,
    onUpdateDraft,
    onInsertDraft
}) => {
    // Accordion states - Modified defaults: Draft Open, Ideas Closed
    const [ideasOpen, setIdeasOpen] = useState(false);
    const [draftOpen, setDraftOpen] = useState(true);

    // Add Idea Form state
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newTag, setNewTag] = useState('Personnel');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-expand draft when content arrives (and close ideas)
    useEffect(() => {
        if (draftContent && !draftOpen) {
            setDraftOpen(true);
            setIdeasOpen(false);
        }
    }, [draftContent]);

    // Accordion Handlers (Mutually Exclusive)
    const toggleDraft = () => {
        const newState = !draftOpen;
        setDraftOpen(newState);
        if (newState) setIdeasOpen(false); // Close ideas if opening draft
    };

    const toggleIdeas = () => {
        const newState = !ideasOpen;
        setIdeasOpen(newState);
        if (newState) setDraftOpen(false); // Close draft if opening ideas
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;

        setIsSubmitting(true);
        await onAddIdea(newTitle, newContent, newTag);
        setIsSubmitting(false);

        // Reset and close
        setNewTitle('');
        setNewContent('');
        setNewTag('Personnel');
        setIsAddFormOpen(false);
    };

    const handleCancel = () => {
        setIsAddFormOpen(false);
        setNewTitle('');
        setNewContent('');
    };

    return (
        <div className="bg-ink-50 border-r border-ink-100 h-full flex flex-col w-full md:w-92 font-sans text-base">

            {/* --- SECTION 1: ÉBAUCHE DYNAMIQUE (DRAFT) - EN HAUT --- */}
            <div className={`flex flex-col bg-white border-b border-ink-100 transition-all duration-300 ease-in-out ${draftOpen ? 'flex-1 min-h-0' : 'flex-none'}`}>
                <div
                    className="p-4 bg-white cursor-pointer hover:bg-ink-50 transition-colors flex justify-between items-center select-none"
                    onClick={toggleDraft}
                >
                    <div className="flex items-center gap-2 text-ink-800">
                        <IconFileText className="w-5 h-5 text-accent" />
                        <h2 className="font-serif font-semibold text-lg">Atelier des Souvenirs</h2>
                    </div>
                    <IconChevronDown className={`w-4 h-4 text-ink-400 transform transition-transform duration-300 ${draftOpen ? 'rotate-180' : ''}`} />
                </div>

                {draftOpen && (
                    <div className="flex-1 flex flex-col p-4 bg-ink-50 animate-fade-in min-h-0 border-t border-ink-100">
                        <div className="relative flex-1 flex flex-col gap-4">
                            {/* Draft Photos Display */}
                            {draftPhotos.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
                                    {draftPhotos.map((photoUrl, index) => (
                                        <div key={index} className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-ink-200 shadow-sm group">
                                            <img src={photoUrl} alt="Souvenir" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <textarea
                                value={draftContent}
                                onChange={(e) => onUpdateDraft(e.target.value)}
                                placeholder="L'ébauche de votre texte apparaîtra ici. Vous pouvez également rédiger librement..."
                                className="w-full h-full p-4 bg-white border border-ink-200 rounded-lg text-base text-ink-800 leading-relaxed focus:outline-none focus:border-accent resize-none font-serif shadow-sm placeholder:italic placeholder:text-ink-300"
                            />
                            {!draftContent && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <IconMagic className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                                    <p className="text-sm text-ink-400 italic">
                                        Utilisez "Verser dans l'ébauche" depuis le chat<br />pour construire votre texte ici.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={onInsertDraft}
                                disabled={!draftContent.trim()}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-sm ${!draftContent.trim()
                                    ? 'bg-ink-200 text-ink-400 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                                    }`}
                            >
                                <IconSave className="w-4 h-4" />
                                Graver le Souvenir
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- SECTION 2: COFFRE À IDÉES - EN BAS --- */}
            <div className={`flex flex-col bg-ink-50 transition-all duration-300 ease-in-out ${ideasOpen ? 'flex-1 min-h-0' : 'flex-none'}`}>
                {/* Header */}
                <div
                    className="p-4 bg-white border-b border-ink-100 cursor-pointer hover:bg-ink-50 transition-colors flex justify-between items-center select-none shadow-sm z-10"
                    onClick={toggleIdeas}
                >
                    <div className="flex items-center gap-2 text-ink-800">
                        <IconArchive className="w-5 h-5 text-accent" />
                        <h2 className="font-serif font-semibold text-lg">Coffre à Idées</h2>
                        <span className="bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full text-sm font-bold">{ideas.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsAddFormOpen(!isAddFormOpen);
                                if (!ideasOpen) { // If adding, insure list opens
                                    setIdeasOpen(true);
                                    setDraftOpen(false);
                                }
                            }}
                            className={`p-1.5 rounded-md transition-all ${isAddFormOpen ? 'bg-ink-100 text-ink-800' : 'text-ink-400 hover:text-accent'}`}
                            title={isAddFormOpen ? "Fermer l'ajout" : "Ajouter une note"}
                        >
                            {isAddFormOpen ? <IconX className="w-4 h-4" /> : <IconPlus className="w-4 h-4" />}
                        </button>
                        <IconChevronDown className={`w-4 h-4 text-ink-400 transform transition-transform duration-300 ${ideasOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Add Form */}
                {isAddFormOpen && ideasOpen && (
                    <div className="p-4 bg-ink-50 border-b border-ink-100 animate-fade-in flex-shrink-0">
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <input
                                type="text"
                                placeholder="Titre court (ex: Le Grenier)"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-ink-200 rounded-lg text-base focus:border-accent outline-none"
                                autoFocus
                            />
                            <textarea
                                placeholder="Détaillez votre idée..."
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-ink-200 rounded-lg text-base focus:border-accent outline-none resize-none h-20"
                            />
                            <div className="flex items-center gap-2">
                                <select
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    className="px-2 py-1.5 bg-white border border-ink-200 rounded text-sm text-ink-600 outline-none w-1/2"
                                >
                                    <option value="Personnel">Personnel</option>
                                    <option value="Lieu">Lieu</option>
                                    <option value="Personnage">Personnage</option>
                                    <option value="Événement">Événement</option>
                                    <option value="Thème">Thème</option>
                                </select>
                                <div className="flex items-center gap-1 w-1/2 justify-end">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="p-1.5 text-ink-400 hover:text-red-500 transition-colors"
                                    >
                                        <IconX className="w-4 h-4" /> Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newTitle || !newContent || isSubmitting}
                                        className={`p-1.5 rounded-md text-white transition-colors ${!newTitle || !newContent ? 'bg-ink-200 cursor-not-allowed' : 'bg-accent hover:bg-amber-600'}`}
                                    >
                                        <IconCheck className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* List */}
                {ideasOpen && (
                    <div className="overflow-y-auto p-3 space-y-2.5 bg-ink-50 flex-1 min-h-0">
                        {ideas.length === 0 ? (
                            <div className="text-ink-400 text-sm italic text-center mt-4 px-4">
                                Le coffre est vide.
                            </div>
                        ) : (
                            ideas.map((idea) => (
                                <div
                                    key={idea.id}
                                    onClick={() => onIdeaClick(idea)}
                                    className="bg-white p-3 rounded-lg shadow-sm border border-ink-100 hover:shadow-md hover:border-accent/30 transition-all cursor-pointer group relative"
                                >
                                    <span className="absolute top-3 right-3 text-[10px] text-ink-400 transition-opacity duration-200 group-hover:opacity-0 font-mono">
                                        {new Date(idea.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteIdea(idea.id); }}
                                        className="absolute top-2 right-2 p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                                        title="Supprimer l'idée"
                                    >
                                        <IconTrash className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="flex justify-between items-start mb-1 pr-16 transition-colors duration-200">
                                        <h3 className="font-bold text-ink-800 text-base leading-tight group-hover:text-accent">
                                            {idea.title || "Note sans titre"}
                                        </h3>
                                    </div>

                                    {/* Accordion Effect for Content */}
                                    <div className="max-h-0 opacity-0 group-hover:max-h-60 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden">
                                        <p className="text-sm text-ink-600 leading-relaxed mb-3 pt-1">
                                            {idea.content}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {idea.tags && idea.tags.length > 0 ? (
                                            idea.tags.map((tag, i) => (
                                                <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-ink-50 text-ink-500 text-[10px] rounded border border-ink-100 uppercase tracking-wide group-hover:border-ink-200 transition-colors">
                                                    {tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-ink-50 text-ink-400 text-[10px] rounded border border-ink-100 group-hover:border-ink-200 transition-colors">
                                                <IconTag className="w-2.5 h-2.5" /> Général
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default IdeaChest;