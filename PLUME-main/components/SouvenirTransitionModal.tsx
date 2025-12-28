import React, { useState } from 'react';
import { X, Save, Leaf, Trash2, AlertTriangle, Sparkles } from 'lucide-react';

interface SouvenirTransitionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGraver: () => void;         // Ouvre ValidationModal pour finaliser
    onLaisserGermer: () => void;  // Ouvre ValidationModal pour brouillon
    onAbandonner: () => void;     // Abandonne le souvenir actuel
    hasContent: boolean;          // Y a-t-il du contenu dans la session ?
    suggestedTitle: string;
    contentPreview: string;
}

export const SouvenirTransitionModal: React.FC<SouvenirTransitionModalProps> = ({
    isOpen,
    onClose,
    onGraver,
    onLaisserGermer,
    onAbandonner,
    hasContent,
    suggestedTitle,
    contentPreview
}) => {
    const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

    if (!isOpen) return null;

    const handleAbandonClick = () => {
        setShowAbandonConfirm(true);
    };

    const handleConfirmAbandon = () => {
        setShowAbandonConfirm(false);
        onAbandonner();
    };

    const handleCancelAbandon = () => {
        setShowAbandonConfirm(false);
    };

    // If no content, skip the modal and go directly to new souvenir
    if (!hasContent) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

                {/* Header */}
                <div className="px-6 py-5 border-b border-ink-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-serif text-xl font-bold text-ink-900">Nouveau souvenir</h2>
                            <p className="text-ink-500 text-sm">Un souvenir est en cours de rédaction</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-ink-100 rounded-full transition-colors text-ink-400 hover:text-ink-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Preview */}
                {suggestedTitle && (
                    <div className="px-6 py-4 bg-slate-50 border-b border-ink-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">Souvenir en cours</p>
                        <p className="font-serif text-lg font-medium text-ink-800">{suggestedTitle}</p>
                        {contentPreview && (
                            <p className="text-ink-500 text-sm mt-2 line-clamp-2 italic">"{contentPreview}"</p>
                        )}
                    </div>
                )}

                {/* Abandon Confirmation Overlay */}
                {showAbandonConfirm ? (
                    <div className="p-6 space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-red-800">Abandonner ce souvenir ?</p>
                                <p className="text-red-600 text-sm mt-1">
                                    Les échanges seront archivés mais le texte ne sera pas conservé comme souvenir.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelAbandon}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-ink-600 hover:bg-ink-100 transition-colors border border-ink-200"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmAbandon}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                            >
                                Oui, abandonner
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Actions */
                    <div className="p-6 space-y-3">
                        <p className="text-ink-600 text-sm mb-4">
                            Que souhaitez-vous faire avec ce souvenir avant d'en commencer un nouveau ?
                        </p>

                        {/* Graver le souvenir */}
                        <button
                            onClick={onGraver}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Save className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-emerald-800">Graver le souvenir</p>
                                <p className="text-emerald-600 text-sm">Finaliser et ajouter au Livre</p>
                            </div>
                        </button>

                        {/* Laisser germer */}
                        <button
                            onClick={onLaisserGermer}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Leaf className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-amber-800">Laisser germer</p>
                                <p className="text-amber-600 text-sm">Sauvegarder pour y revenir plus tard</p>
                            </div>
                        </button>

                        {/* Abandonner */}
                        <button
                            onClick={handleAbandonClick}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-ink-200 bg-white hover:bg-ink-50 hover:border-ink-300 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-ink-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Trash2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-ink-700">Abandonner</p>
                                <p className="text-ink-500 text-sm">Ne pas conserver ce souvenir</p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Footer hint */}
                {!showAbandonConfirm && (
                    <div className="px-6 py-4 border-t border-ink-100 bg-slate-50">
                        <p className="text-xs text-ink-400 text-center">
                            💡 Même un brouillon conserve vos métadonnées (dates, lieux, personnes)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
