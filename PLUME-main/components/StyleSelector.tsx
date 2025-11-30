import React, { useState } from 'react';
import { Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { StyleStudio } from './StyleStudio';
import { Tone, Length, Fidelity } from '../types';

interface StyleSelectorProps {
    tone: Tone;
    length: Length;
    fidelity: Fidelity;
    onToneChange: (tone: Tone) => void;
    onLengthChange: (length: Length) => void;
    onFidelityChange: (fidelity: Fidelity) => void;
    isLoading?: boolean;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
    tone,
    length,
    fidelity,
    onToneChange,
    onLengthChange,
    onFidelityChange,
    isLoading = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [intensity, setIntensity] = useState(50);
    const [authorStyle, setAuthorStyle] = useState<string | undefined>(undefined);

    const handleConfigChange = (config: { tone: Tone; intensity: number; authorStyle?: string }) => {
        onToneChange(config.tone);
        setIntensity(config.intensity);
        setAuthorStyle(config.authorStyle);
    };

    return (
        <div className="space-y-4">
            {/* Compact Mode - Traditional Selectors */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label htmlFor="tone" className="font-bold text-ink-700 text-base block mb-2">
                        Ton
                    </label>
                    <select
                        id="tone"
                        value={tone}
                        onChange={(e) => onToneChange(e.target.value as Tone)}
                        className="w-full settings-dropdown text-base p-3"
                        disabled={isLoading}
                    >
                        {Object.values(Tone).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="length" className="font-bold text-ink-700 text-base block mb-2">
                        Longueur
                    </label>
                    <select
                        id="length"
                        value={length}
                        onChange={(e) => onLengthChange(e.target.value as Length)}
                        className="w-full settings-dropdown text-base p-3"
                        disabled={isLoading}
                    >
                        {Object.values(Length).map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="fidelity" className="font-bold text-ink-700 text-base block mb-2">
                        Fidélité
                    </label>
                    <select
                        id="fidelity"
                        value={fidelity}
                        onChange={(e) => onFidelityChange(e.target.value as Fidelity)}
                        className="w-full settings-dropdown text-base p-3"
                        disabled={isLoading}
                    >
                        {Object.values(Fidelity).map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Expand Button for Advanced Studio */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent to-amber-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                disabled={isLoading}
            >
                <Palette className="w-5 h-5" />
                <span>{isExpanded ? 'Masquer' : 'Ouvrir'} le Studio de Style</span>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {/* Expanded Mode - Full Style Studio */}
            {isExpanded && (
                <div className="animate-slideDown">
                    <StyleStudio
                        currentConfig={{
                            tone,
                            intensity,
                            authorStyle
                        }}
                        onConfigChange={handleConfigChange}
                    />
                </div>
            )}

            {/* Current Style Summary */}
            {(intensity !== 50 || authorStyle) && (
                <div className="bg-amber-50 border border-accent/30 rounded-lg p-3 text-sm">
                    <p className="text-ink-700">
                        <span className="font-semibold">Style actif:</span> {tone}
                        {intensity !== 50 && ` • Intensité: ${intensity}%`}
                        {authorStyle && ` • Inspiré de ${authorStyle}`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default StyleSelector;
