/**
 * HelpTooltip.tsx
 * Composant tooltip enrichi avec aide contextuelle
 */

import React, { useState, useRef, useEffect } from 'react';
import { getTooltipContent } from '../data/helpContent';
import { HelpCircle, ChevronRight, X } from 'lucide-react';

interface HelpTooltipProps {
    /** ID du tooltip dans helpContent.ts */
    helpId: string;
    /** Position du tooltip */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Afficher l'icône ? ou wrap children */
    children?: React.ReactNode;
    /** Callback pour "En savoir plus" */
    onLearnMore?: (section: string) => void;
    /** Délai avant affichage en ms (défaut: 800) */
    delay?: number;
    /** Taille de l'icône */
    iconSize?: number;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
    helpId,
    position = 'top',
    children,
    onLearnMore,
    delay = 800,
    iconSize = 16,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const content = getTooltipContent(helpId);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Fermer si clic en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isPinned && tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsPinned(false);
                setIsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isPinned]);

    const handleMouseEnter = () => {
        if (!isPinned) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(true);
            }, delay);
        }
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        if (!isPinned) {
            setIsVisible(false);
        }
    };

    const handleIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPinned(!isPinned);
        setIsVisible(!isPinned);
    };

    const handleClose = () => {
        setIsPinned(false);
        setIsVisible(false);
    };

    const handleLearnMoreClick = () => {
        if (content?.learnMoreSection && onLearnMore) {
            onLearnMore(content.learnMoreSection);
        }
        handleClose();
    };

    if (!content) return children ? <>{children}</> : null;

    // Position styles
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-white',
        bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-white',
        left: 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-white',
        right: 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-white',
    };

    return (
        <div
            className="relative inline-flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            ref={tooltipRef}
        >
            {children}

            {/* Icône d'aide */}
            <button
                onClick={handleIconClick}
                className={`ml-1 p-0.5 rounded-full transition-all ${isPinned
                        ? 'bg-amber-500 text-white'
                        : 'text-ink-400 hover:text-amber-600 hover:bg-amber-50'
                    }`}
                aria-label="Aide"
            >
                <HelpCircle size={iconSize} />
            </button>

            {/* Tooltip */}
            {isVisible && (
                <div
                    className={`absolute z-50 ${positionClasses[position]} animate-fade-in`}
                    style={{ minWidth: '280px', maxWidth: '320px' }}
                >
                    <div className="bg-white rounded-xl shadow-2xl border border-ink-100 p-4 relative">
                        {/* Bouton fermer si épinglé */}
                        {isPinned && (
                            <button
                                onClick={handleClose}
                                className="absolute top-2 right-2 p-1 text-ink-400 hover:text-ink-600 rounded-full hover:bg-ink-50"
                            >
                                <X size={14} />
                            </button>
                        )}

                        {/* Titre */}
                        <h4 className="font-bold text-ink-800 text-sm mb-1 pr-6">
                            {content.title}
                        </h4>

                        {/* Description */}
                        <p className="text-ink-600 text-xs leading-relaxed">
                            {content.description}
                        </p>

                        {/* Lien En savoir plus */}
                        {content.learnMoreSection && onLearnMore && (
                            <button
                                onClick={handleLearnMoreClick}
                                className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                            >
                                En savoir plus
                                <ChevronRight size={12} />
                            </button>
                        )}

                        {/* Flèche */}
                        <div
                            className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Wrapper pour ajouter un tooltip à n'importe quel élément
 */
interface WithHelpTooltipProps {
    helpId: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    onLearnMore?: (section: string) => void;
}

export const WithHelpTooltip: React.FC<WithHelpTooltipProps> = ({
    helpId,
    children,
    position = 'top',
    onLearnMore,
}) => {
    return (
        <HelpTooltip helpId={helpId} position={position} onLearnMore={onLearnMore}>
            {children}
        </HelpTooltip>
    );
};

export default HelpTooltip;
