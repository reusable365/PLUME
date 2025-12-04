import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, User, Tag, Check, Edit2, AlertCircle, Sparkles } from 'lucide-react';
import { MaturityScore } from '../hooks/useMaturityScore';
import { generateSouvenirTitle } from '../services/geminiService';

interface PersonEntity {
    name: string;
    relation?: string;
    isPresent: boolean;
}

interface ValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: ValidationData) => void;
    initialData: {
        title: string;
        content: string;
        maturityScore: MaturityScore;
        dates: string[];
        locations: string[];
        people: string[]; // Simple strings for now, will be upgraded to PersonEntity later
        tags: string[];
    };
    isLoading: boolean;
}

export interface ValidationData {
    title: string;
    content: string;
    metadata: {
        dates: string[];
        locations: string[];
        people: string[];
        tags: string[];
    };
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialData,
    isLoading
}) => {
    const [step, setStep] = useState<'review' | 'success'>('review');
    const [editedTitle, setEditedTitle] = useState(initialData.title);
    const [editedContent, setEditedContent] = useState(initialData.content);
    const [editedDates, setEditedDates] = useState(initialData.dates);
    const [editedLocations, setEditedLocations] = useState(initialData.locations);
    const [editedPeople, setEditedPeople] = useState(initialData.people);
    const [editedTags, setEditedTags] = useState(initialData.tags);

    const [addingField, setAddingField] = useState<'dates' | 'locations' | 'people' | 'tags' | null>(null);
    const [newItemValue, setNewItemValue] = useState('');
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

    const handleGenerateTitle = async () => {
        setIsGeneratingTitle(true);
        try {
            const generatedTitle = await generateSouvenirTitle(
                editedContent,
                {
                    dates: editedDates,
                    locations: editedLocations,
                    people: editedPeople,
                    tags: editedTags
                }
            );
            setEditedTitle(generatedTitle);
        } catch (error) {
            console.error('Error generating title:', error);
        } finally {
            setIsGeneratingTitle(false);
        }
    };

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('review');
            setEditedTitle(initialData.title);
            setEditedContent(initialData.content);
            setEditedDates(initialData.dates);
            setEditedLocations(initialData.locations);
            setEditedPeople(initialData.people);
            setEditedTags(initialData.tags);
            setAddingField(null);
            setNewItemValue('');
        }
    }, [isOpen, initialData]);

    const handleAddItem = (field: 'dates' | 'locations' | 'people' | 'tags') => {
        if (!newItemValue.trim()) {
            setAddingField(null);
            return;
        }

        switch (field) {
            case 'dates': setEditedDates([...editedDates, newItemValue]); break;
            case 'locations': setEditedLocations([...editedLocations, newItemValue]); break;
            case 'people': setEditedPeople([...editedPeople, newItemValue]); break;
            case 'tags': setEditedTags([...editedTags, newItemValue]); break;
        }
        setNewItemValue('');
        setAddingField(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, field: 'dates' | 'locations' | 'people' | 'tags') => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddItem(field);
        } else if (e.key === 'Escape') {
            setAddingField(null);
            setNewItemValue('');
        }
    };

    const renderAddItem = (field: 'dates' | 'locations' | 'people' | 'tags') => {
        if (addingField === field) {
            return (
                <div className="flex items-center gap-2">
                    <input
                        autoFocus
                        type="text"
                        value={newItemValue}
                        onChange={(e) => setNewItemValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, field)}
                        onBlur={() => handleAddItem(field)}
                        className="px-3 py-1 border border-accent text-ink-900 rounded-full text-sm outline-none w-32"
                        placeholder="Ajouter..."
                    />
                </div>
            );
        }
        return (
            <button
                onClick={() => { setAddingField(field); setNewItemValue(''); }}
                className="px-3 py-1 border border-dashed border-ink-300 text-ink-400 rounded-full text-sm hover:border-accent hover:text-accent transition-colors flex items-center gap-1"
            >
                + Ajouter
            </button>
        );
    };

    const handleConfirm = () => {
        onConfirm({
            title: editedTitle,
            content: editedContent,
            metadata: {
                dates: editedDates,
                locations: editedLocations,
                people: editedPeople,
                tags: editedTags
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-8 py-6 border-b border-ink-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-white">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-ink-900">Graver le Souvenir</h2>
                        <p className="text-ink-500 text-sm mt-1">Vérifiez et validez les informations avant de sceller ce moment.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-ink-100 rounded-full transition-colors text-ink-400 hover:text-ink-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: Metadata */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-400">Titre du Souvenir</label>
                                <div className="flex gap-2">
                                    <div className="relative group flex-1">
                                        <input
                                            type="text"
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            className="w-full font-serif text-xl font-bold text-ink-900 border-b-2 border-transparent hover:border-ink-200 focus:border-accent bg-transparent outline-none py-1 transition-all"
                                        />
                                        <Edit2 size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                    <button
                                        onClick={handleGenerateTitle}
                                        disabled={isGeneratingTitle}
                                        className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Générer un titre automatiquement"
                                    >
                                        <Sparkles size={14} />
                                        {isGeneratingTitle ? '...' : 'IA'}
                                    </button>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-2">
                                    <Calendar size={14} /> Période / Date
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {editedDates.map((date, i) => (
                                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1 group">
                                            {date}
                                            <button onClick={() => setEditedDates(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-blue-900 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                        </span>
                                    ))}
                                    {renderAddItem('dates')}
                                </div>
                            </div>

                            {/* Locations */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-2">
                                    <MapPin size={14} /> Lieux
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {editedLocations.map((loc, i) => (
                                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1 group">
                                            {loc}
                                            <button onClick={() => setEditedLocations(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-emerald-900 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                        </span>
                                    ))}
                                    {renderAddItem('locations')}
                                </div>
                            </div>

                            {/* People */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-2">
                                    <User size={14} /> Personnes
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {editedPeople.map((person, i) => (
                                        <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1 group">
                                            {person}
                                            <button onClick={() => setEditedPeople(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-purple-900 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                        </span>
                                    ))}
                                    {renderAddItem('people')}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-ink-400 flex items-center gap-2">
                                    <Tag size={14} /> Thèmes
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {editedTags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1 group">
                                            {tag}
                                            <button onClick={() => setEditedTags(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-amber-900 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                        </span>
                                    ))}
                                    {renderAddItem('tags')}
                                </div>
                            </div>

                            {/* Maturity Score Recap */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-ink-100 mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold uppercase text-ink-500">Score de Maturité</span>
                                    <span className="font-bold text-accent">{initialData.maturityScore.total}%</span>
                                </div>
                                <div className="h-2 w-full bg-ink-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent rounded-full"
                                        style={{ width: `${initialData.maturityScore.total}%` }}
                                    />
                                </div>
                                {initialData.maturityScore.total < 80 && (
                                    <div className="flex items-start gap-2 mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <p>Ce souvenir pourrait être enrichi davantage. Voulez-vous vraiment le graver maintenant ?</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Text Preview */}
                        <div className="lg:col-span-2 bg-white border border-ink-100 rounded-xl p-6 shadow-sm relative group">
                            <label className="absolute top-4 right-4 text-xs font-bold uppercase tracking-wider text-ink-300 bg-white px-2">Aperçu du Récit</label>
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full h-[400px] resize-none outline-none font-serif text-lg leading-relaxed text-ink-800 custom-scrollbar"
                            />
                            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-ink-400 flex items-center gap-1">
                                <Edit2 size={12} /> Cliquer pour éditer
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-ink-100 bg-slate-50 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-ink-600 hover:bg-ink-100 transition-colors"
                    >
                        Continuer à écrire
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                Gravure en cours...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Confirmer et Graver
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
