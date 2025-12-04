import React, { useState } from 'react';
import { Heart, Zap, Eye, X } from 'lucide-react';

export type ChipType = 'emotion' | 'action' | 'sensoriel';

interface ChipData {
    type: ChipType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

interface EnhancedChipsProps {
    onChipSelect: (type: ChipType | null) => void;
    selectedChip: ChipType | null;
}

const CHIPS_DATA: ChipData[] = [
    {
        type: 'emotion',
        title: 'ÉMOTION',
        description: 'Explorez vos ressentis, vos émotions profondes et l\'impact émotionnel de vos souvenirs.',
        icon: <Heart size={24} />,
        color: '#FF6B9D'
    },
    {
        type: 'action',
        title: 'ACTION',
        description: 'Racontez les événements, les actions concrètes et le déroulement chronologique de votre histoire.',
        icon: <Zap size={24} />,
        color: '#FF9F40'
    },
    {
        type: 'sensoriel',
        title: 'SENSORIEL',
        description: 'Décrivez les sensations, les odeurs, les sons, les textures et l\'atmosphère de vos souvenirs.',
        icon: <Eye size={24} />,
        color: '#4A90E2'
    }
];

export const EnhancedChips: React.FC<EnhancedChipsProps> = ({ onChipSelect, selectedChip }) => {
    const [hoveredChip, setHoveredChip] = useState<ChipType | null>(null);

    const handleChipClick = (type: ChipType) => {
        if (selectedChip === type) {
            // Deselect if clicking the same chip
            onChipSelect(null);
        } else {
            onChipSelect(type);
        }
    };

    const handleBackdropClick = () => {
        if (selectedChip) {
            onChipSelect(null);
        }
    };

    return (
        <div className="enhanced-chips-container">
            {/* Backdrop when a chip is selected */}
            {selectedChip && (
                <div className="chips-backdrop" onClick={handleBackdropClick} />
            )}

            <div className={`enhanced-chips ${selectedChip ? 'chip-selected' : ''}`}>
                {CHIPS_DATA.map((chip) => {
                    const isSelected = selectedChip === chip.type;
                    const isHidden = selectedChip && !isSelected;

                    return (
                        <div
                            key={chip.type}
                            className={`enhanced-chip ${isSelected ? 'selected' : ''} ${isHidden ? 'hidden' : ''}`}
                            style={{
                                '--chip-color': chip.color
                            } as React.CSSProperties}
                            onClick={() => handleChipClick(chip.type)}
                            onMouseEnter={() => setHoveredChip(chip.type)}
                            onMouseLeave={() => setHoveredChip(null)}
                        >
                            {/* Close button when selected */}
                            {isSelected && (
                                <button
                                    className="chip-close-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChipSelect(null);
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            )}

                            {/* Icon */}
                            <div className="chip-icon" style={{ color: chip.color }}>
                                {chip.icon}
                            </div>

                            {/* Content */}
                            <div className="chip-content">
                                <h3 className="chip-title">{chip.title}</h3>
                                <p className="chip-description">{chip.description}</p>
                            </div>

                            {/* Hover/Selected indicator */}
                            <div className="chip-indicator" style={{ backgroundColor: chip.color }} />
                        </div>
                    );
                })}
            </div>

            {/* Helper text */}
            {!selectedChip && (
                <p className="chips-helper-text">
                    Choisissez un angle pour guider PLUME dans l'exploration de votre souvenir
                </p>
            )}

            {selectedChip && (
                <p className="chips-helper-text selected">
                    Mode <strong>{CHIPS_DATA.find(c => c.type === selectedChip)?.title}</strong> activé • Cliquez à nouveau pour désactiver
                </p>
            )}
        </div>
    );
};
