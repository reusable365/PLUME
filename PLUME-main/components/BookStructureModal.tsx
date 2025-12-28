import React, { useState } from 'react';
import { BookStructure, BookStructureMode, User } from '../types';
import { generateBookStructure } from '../services/bookArchitectService';
import { IconBook, IconClock, IconStar, IconZap, IconX, IconCheck, IconChevronRight } from './Icons';

interface BookStructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userProfile: User | null;
    onStructureGenerated: (structure: BookStructure) => void;
}

const BookStructureModal: React.FC<BookStructureModalProps> = ({
    isOpen,
    onClose,
    userId,
    userProfile,
    onStructureGenerated
}) => {
    const [selectedMode, setSelectedMode] = useState<BookStructureMode | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedStructure, setGeneratedStructure] = useState<BookStructure | null>(null);
    const [error, setError] = useState<string | null>(null);

    const modes = [
        {
            id: 'chronological' as BookStructureMode,
            icon: IconClock,
            title: 'Chronologique',
            description: 'Organisation linéaire par périodes de vie',
            color: 'blue',
            features: ['Détection automatique des grandes phases', 'Transitions fluides entre époques', 'Idéal pour un récit classique']
        },
        {
            id: 'thematic' as BookStructureMode,
            icon: IconBook,
            title: 'Thématique',
            description: 'Regroupement par thèmes de vie',
            color: 'purple',
            features: ['Chapitres par thème (famille, voyages, etc.)', 'Évolution de chaque aspect de votre vie', 'Structure originale et moderne']
        },
        {
            id: 'expert' as BookStructureMode,
            icon: IconStar,
            title: 'Expert Biographique',
            description: 'PLUME analyse et crée une structure sur-mesure',
            color: 'amber',
            features: ['Analyse dramaturgique de votre vie', 'Structure narrative optimisée', 'Vision éditoriale professionnelle'],
            recommended: true
        }
    ];

    const handleGenerate = async () => {
        if (!selectedMode) return;

        setIsGenerating(true);
        setError(null);

        try {
            const structure = await generateBookStructure(selectedMode, userId, userProfile);
            setGeneratedStructure(structure);
        } catch (err) {
            logger.error('Error generating structure:', err);
            setError('Erreur lors de la génération de la structure. Veuillez réessayer.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirm = () => {
        if (generatedStructure) {
            onStructureGenerated(generatedStructure);
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedMode(null);
        setGeneratedStructure(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8 text-white relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <IconX className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <IconZap className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold">Architecte de Livre</h2>
                            <p className="text-white/90 mt-1">PLUME génère une structure intelligente pour votre autobiographie</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {!generatedStructure ? (
                        <>
                            {/* Mode Selection */}
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-ink-900 mb-4">Choisissez un mode de structuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {modes.map((mode) => {
                                        const Icon = mode.icon;
                                        const isSelected = selectedMode === mode.id;
                                        return (
                                            <div
                                                key={mode.id}
                                                onClick={() => setSelectedMode(mode.id)}
                                                className={`relative cursor-pointer border-2 rounded-2xl p-6 transition-all ${isSelected
                                                        ? 'border-accent bg-accent/5 shadow-lg scale-105'
                                                        : 'border-ink-200 hover:border-ink-300 hover:shadow-md'
                                                    }`}
                                            >
                                                {mode.recommended && (
                                                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                                        Recommandé
                                                    </div>
                                                )}
                                                <div className={`w-12 h-12 rounded-xl bg-${mode.color}-100 flex items-center justify-center mb-4`}>
                                                    <Icon className={`w-6 h-6 text-${mode.color}-600`} />
                                                </div>
                                                <h4 className="font-bold text-ink-900 mb-2">{mode.title}</h4>
                                                <p className="text-sm text-ink-600 mb-4">{mode.description}</p>
                                                <ul className="space-y-2">
                                                    {mode.features.map((feature, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-xs text-ink-600">
                                                            <IconCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Generate Button */}
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl font-semibold transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={!selectedMode || isGenerating}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Génération en cours...
                                        </>
                                    ) : (
                                        <>
                                            <IconZap className="w-5 h-5" />
                                            Générer la structure
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Generated Structure Preview */}
                            <div className="space-y-6">
                                {/* Book Title */}
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                                    <div className="flex items-start gap-4">
                                        <IconBook className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-ink-900 mb-1">{generatedStructure.title}</h3>
                                            {generatedStructure.subtitle && (
                                                <p className="text-lg text-ink-600 italic">{generatedStructure.subtitle}</p>
                                            )}
                                            <div className="mt-4 flex items-center gap-4 text-sm text-ink-600">
                                                <span className="font-semibold">{generatedStructure.chapters.length} chapitres</span>
                                                <span>•</span>
                                                <span className="font-semibold">~{generatedStructure.totalEstimatedPages} pages</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Rationale */}
                                {generatedStructure.rationale && (
                                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                                        <p className="text-sm text-amber-900">
                                            <strong className="font-bold">Vision éditoriale de PLUME :</strong> {generatedStructure.rationale}
                                        </p>
                                    </div>
                                )}

                                {/* Chapters List */}
                                <div>
                                    <h4 className="text-lg font-bold text-ink-900 mb-4">Table des matières</h4>
                                    <div className="space-y-3">
                                        {generatedStructure.chapters.map((chapter, idx) => (
                                            <div
                                                key={chapter.id}
                                                className="bg-white border border-ink-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-indigo-700 font-bold">{idx + 1}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-ink-900 mb-1">{chapter.title}</h5>
                                                        <p className="text-sm text-ink-600 mb-2">{chapter.description}</p>
                                                        <div className="flex items-center gap-3 text-xs text-ink-500">
                                                            {chapter.period && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{chapter.period}</span>}
                                                            {chapter.theme && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{chapter.theme}</span>}
                                                            <span>{chapter.memoryIds.length} souvenirs</span>
                                                            <span>•</span>
                                                            <span>~{chapter.estimatedPages} pages</span>
                                                        </div>
                                                    </div>
                                                    <IconChevronRight className="w-5 h-5 text-ink-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-ink-200">
                                <button
                                    onClick={() => setGeneratedStructure(null)}
                                    className="px-6 py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl font-semibold transition-colors"
                                >
                                    Générer une autre structure
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                >
                                    <IconCheck className="w-5 h-5" />
                                    Utiliser cette structure
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookStructureModal;

