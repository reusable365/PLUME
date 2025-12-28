import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Sparkles } from 'lucide-react';
import { Tone, Length, Fidelity } from '../types';

interface RegenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRegenerate: (settings: RegenerateSettings) => void;
    currentTone: Tone;
    currentLength: Length;
    currentFidelity: Fidelity;
    isLoading?: boolean;
}

export interface RegenerateSettings {
    tone: Tone;
    length: Length;
    authenticity: number; // 0-100, 100 = Texte Sacré
    applyAsDefault: boolean;
}

const TONES_DISPLAY = [
    { value: Tone.NOSTALGIQUE, label: 'Nostalgique' },
    { value: Tone.POETIQUE, label: 'Poétique' },
    { value: Tone.INTIMISTE, label: 'Intime' },
    { value: Tone.AUTHENTIQUE, label: 'Authentique' },
    { value: Tone.HUMOUR, label: 'Humour' },
];

const LENGTHS_DISPLAY = [
    { value: Length.COURT, label: 'Court' },
    { value: Length.MOYEN, label: 'Normal' },
    { value: Length.LONG, label: 'Long' },
];

export const RegenerateModal: React.FC<RegenerateModalProps> = ({
    isOpen,
    onClose,
    onRegenerate,
    currentTone,
    currentLength,
    currentFidelity,
    isLoading = false
}) => {
    const [selectedTone, setSelectedTone] = useState<Tone>(currentTone);
    const [selectedLength, setSelectedLength] = useState<Length>(currentLength);
    const [authenticity, setAuthenticity] = useState<number>(
        currentFidelity === Fidelity.HAUTE ? 100 : 50
    );
    const [applyAsDefault, setApplyAsDefault] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset values when modal opens with new values
    useEffect(() => {
        if (isOpen) {
            setSelectedTone(currentTone);
            setSelectedLength(currentLength);
            setAuthenticity(currentFidelity === Fidelity.HAUTE ? 100 : 50);
            setApplyAsDefault(false);
        }
    }, [isOpen, currentTone, currentLength, currentFidelity]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose]);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleRegenerate = () => {
        onRegenerate({
            tone: selectedTone,
            length: selectedLength,
            authenticity,
            applyAsDefault
        });
    };

    const getAuthenticityLabel = () => {
        if (authenticity >= 90) return 'Sacré (original)';
        if (authenticity >= 70) return 'Fidèle';
        if (authenticity >= 30) return 'Équilibré';
        return 'Libre (enrichi)';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-fade-in">
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in border border-ink-100"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent/20 rounded-lg">
                            <RefreshCw className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <h3 className="font-bold text-ink-800 text-lg">Régénérer ce passage</h3>
                            <p className="text-xs text-ink-500">Ajustez les paramètres selon vos préférences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-ink-400 hover:text-ink-600 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Length Selection */}
                    <div>
                        <label className="block text-sm font-bold text-ink-700 mb-3">
                            Longueur
                        </label>
                        <div className="flex gap-2">
                            {LENGTHS_DISPLAY.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setSelectedLength(value)}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${selectedLength === value
                                            ? 'bg-accent text-white shadow-md'
                                            : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tone Selection */}
                    <div>
                        <label className="block text-sm font-bold text-ink-700 mb-3">
                            Ton
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TONES_DISPLAY.map(({ value, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setSelectedTone(value)}
                                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${selectedTone === value
                                            ? 'bg-accent text-white shadow-md'
                                            : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Authenticity Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-ink-700">
                                Authenticité
                            </label>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${authenticity >= 90
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-ink-100 text-ink-600'
                                }`}>
                                {getAuthenticityLabel()}
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={authenticity}
                                onChange={(e) => setAuthenticity(Number(e.target.value))}
                                className="w-full h-2 bg-gradient-to-r from-indigo-200 via-amber-200 to-amber-400 rounded-lg appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-5
                                    [&::-webkit-slider-thumb]:h-5
                                    [&::-webkit-slider-thumb]:bg-white
                                    [&::-webkit-slider-thumb]:border-2
                                    [&::-webkit-slider-thumb]:border-accent
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:shadow-md
                                    [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-webkit-slider-thumb]:transition-transform
                                    [&::-webkit-slider-thumb]:hover:scale-110"
                            />
                            <div className="flex justify-between text-[10px] font-medium text-ink-400 mt-2 px-1">
                                <span>Libre (enrichi)</span>
                                <span>Sacré (original)</span>
                            </div>
                        </div>
                    </div>

                    {/* Apply as Default Checkbox */}
                    <div className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg border border-ink-100">
                        <input
                            type="checkbox"
                            id="apply-default"
                            checked={applyAsDefault}
                            onChange={(e) => setApplyAsDefault(e.target.checked)}
                            className="w-4 h-4 text-accent border-ink-300 rounded focus:ring-accent cursor-pointer"
                        />
                        <label htmlFor="apply-default" className="text-sm text-ink-600 cursor-pointer">
                            Appliquer comme nouveau style par défaut
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-ink-50 border-t border-ink-100">
                    <button
                        onClick={handleRegenerate}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-accent to-amber-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Sparkles className="w-5 h-5 animate-spin" />
                                <span>Régénération en cours...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5" />
                                <span>Régénérer</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegenerateModal;
