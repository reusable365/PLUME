import React, { useState } from 'react';
import { Idea } from '../types';
import { IconArchive, IconPlus, IconTag, IconTrash, IconCheck, IconX, IconChevronDown } from './Icons';

interface SimpleIdeaChestProps {
    ideas: Idea[];
    onAddIdea: (title: string, content: string, tag: string) => Promise<void>;
    onDeleteIdea: (id: string) => Promise<void>;
    onIdeaClick: (idea: Idea) => void;
}

const SimpleIdeaChest: React.FC<SimpleIdeaChestProps> = ({
    ideas,
    onAddIdea,
    onDeleteIdea,
    onIdeaClick
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isAddFormOpen, setIsAddFormOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newTag, setNewTag] = useState('Personnel');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        <div className="flex flex-col bg-white h-full overflow-hidden">
            {/* Header */}
            <div
                className="p-4 border-b border-ink-100 cursor-pointer hover:bg-ink-50 transition-colors flex justify-between items-center select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-ink-800">
                    <IconArchive className="w-5 h-5 text-accent" />
                    <h2 className="font-serif font-semibold text-base">Coffre à Idées</h2>
                    <span className="bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full text-xs font-bold">{ideas.length}</span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsAddFormOpen(!isAddFormOpen);
                            if (!isOpen) setIsOpen(true);
                        }}
                        className={`p-1.5 rounded-md transition-all ${isAddFormOpen ? 'bg-ink-100 text-ink-800' : 'text-ink-400 hover:text-accent'}`}
                        title={isAddFormOpen ? "Fermer l'ajout" : "Ajouter une note"}
                    >
                        {isAddFormOpen ? <IconX className="w-4 h-4" /> : <IconPlus className="w-4 h-4" />}
                    </button>
                    <IconChevronDown className={`w-4 h-4 text-ink-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Add Form */}
            {isAddFormOpen && isOpen && (
                <div className="p-4 bg-ink-50 border-b border-ink-100 animate-fade-in flex-shrink-0">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            placeholder="Titre court (ex: Le Grenier)"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-ink-200 rounded-lg text-sm focus:border-accent outline-none"
                            autoFocus
                        />
                        <textarea
                            placeholder="Détaillez votre idée..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-ink-200 rounded-lg text-sm focus:border-accent outline-none resize-none h-20"
                        />
                        <div className="flex items-center gap-2">
                            <select
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                className="px-2 py-1.5 bg-white border border-ink-200 rounded text-xs text-ink-600 outline-none flex-1"
                            >
                                <option value="Personnel">Personnel</option>
                                <option value="Lieu">Lieu</option>
                                <option value="Personnage">Personnage</option>
                                <option value="Événement">Événement</option>
                                <option value="Thème">Thème</option>
                            </select>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="p-1.5 text-ink-400 hover:text-red-500 transition-colors text-xs"
                                >
                                    Annuler
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
            {isOpen && (
                <div className="overflow-y-auto p-3 space-y-2 bg-ink-50 flex-1">
                    {ideas.length === 0 ? (
                        <div className="text-ink-400 text-xs italic text-center mt-4 px-4">
                            Le coffre est vide. Cliquez sur + pour ajouter une idée.
                        </div>
                    ) : (
                        ideas.map((idea) => (
                            <div
                                key={idea.id}
                                onClick={() => onIdeaClick(idea)}
                                className="bg-white p-3 rounded-lg shadow-sm border border-ink-100 hover:shadow-md hover:border-accent/30 transition-all cursor-pointer group relative"
                            >
                                <span className="absolute top-2 right-2 text-[9px] text-ink-400 transition-opacity duration-200 group-hover:opacity-0 font-mono">
                                    {new Date(idea.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteIdea(idea.id); }}
                                    className="absolute top-2 right-2 p-1 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                                    title="Supprimer l'idée"
                                >
                                    <IconTrash className="w-3 h-3" />
                                </button>

                                <div className="flex justify-between items-start mb-1 pr-12">
                                    <h3 className="font-bold text-ink-800 text-sm leading-tight group-hover:text-accent">
                                        {idea.title || "Note sans titre"}
                                    </h3>
                                </div>

                                <div className="max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-300 ease-in-out overflow-hidden">
                                    <p className="text-xs text-ink-600 leading-relaxed mb-2 pt-1">
                                        {idea.content}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 flex-wrap">
                                    {idea.tags && idea.tags.length > 0 ? (
                                        idea.tags.map((tag, i) => (
                                            <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-ink-50 text-ink-500 text-[9px] rounded border border-ink-100 uppercase tracking-wide">
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-ink-50 text-ink-400 text-[9px] rounded border border-ink-100">
                                            <IconTag className="w-2 h-2" /> Général
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SimpleIdeaChest;
