import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SimpleIdeaChest from './SimpleIdeaChest';
import { StyleSelector } from './StyleSelector';
import { Tone, Length, Fidelity } from '../types';

interface LeftPanelProps {
    isCollapsed: boolean;
    onToggle: () => void;
    ideas: any[];
    onAddIdea: (title: string, content: string, tag: string) => void;
    onDeleteIdea: (id: string) => void;
    onIdeaClick: (idea: any) => Promise<void>;
    tone: Tone;
    length: Length;
    fidelity: Fidelity;
    onToneChange: (tone: Tone) => void;
    onLengthChange: (length: Length) => void;
    onFidelityChange: (fidelity: Fidelity) => void;
    onDataChange?: (key: string, value: any) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
    isCollapsed,
    onToggle,
    ideas,
    onAddIdea,
    onDeleteIdea,
    onIdeaClick,
    tone,
    length,
    fidelity,
    onToneChange,
    onLengthChange,
    onFidelityChange,
    onDataChange
}) => {
    return (
        <div className={`left-panel ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Toggle Button - ENHANCED */}
            <button
                className={`panel-toggle-btn ${!isCollapsed ? 'animate-custom-pulse' : ''}`}
                onClick={onToggle}
                title={isCollapsed ? 'Ouvrir le panneau' : 'Fermer le panneau'}
                style={{
                    width: '40px',
                    height: '40px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
                }}
            >
                {isCollapsed ? <ChevronRight size={28} /> : <ChevronLeft size={28} />}
            </button>

            {/* Panel Content */}
            {!isCollapsed && (
                <div className="left-panel-content">
                    {/* Style Settings Section */}
                    <div className="panel-section">
                        <h3 className="panel-section-title">Paramètres de Style</h3>
                        <StyleSelector
                            tone={tone}
                            length={length}
                            fidelity={fidelity}
                            onToneChange={onToneChange}
                            onLengthChange={onLengthChange}
                            onFidelityChange={onFidelityChange}
                            onDataChange={onDataChange} // Pass it down
                        />
                    </div>

                    {/* Idea Chest Section */}
                    <div className="panel-section flex-1 min-h-0 flex flex-col">
                        <SimpleIdeaChest
                            ideas={ideas}
                            onAddIdea={onAddIdea}
                            onDeleteIdea={onDeleteIdea}
                            onIdeaClick={onIdeaClick}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
