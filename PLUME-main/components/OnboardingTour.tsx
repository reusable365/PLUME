import React, { useState, useMemo, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';
import { TOUR_STEPS, getTourStepsForSection } from '../data/helpContent';
import '../styles/onboarding.css';

interface OnboardingTourProps {
    run: boolean;
    onFinish: () => void;
    /** Section spécifique à montrer (optionnel) */
    section?: 'atelier' | 'sanctuaire' | 'dashboard' | 'univers' | 'livre' | 'repertoire' | 'all';
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onFinish, section = 'all' }) => {
    const [validSteps, setValidSteps] = useState<Step[]>([]);

    // Check which targets actually exist in the DOM
    useEffect(() => {
        if (!run) return;

        // Small delay to let DOM render
        const timer = setTimeout(() => {
            const tourSteps = section === 'all'
                ? TOUR_STEPS.sort((a, b) => a.order - b.order)
                : getTourStepsForSection(section);

            const filteredSteps = tourSteps.filter((step) => {
                // 'body' always exists
                if (step.target === 'body') return true;
                // Check if element exists
                const element = document.querySelector(step.target);
                return element !== null;
            });

            // If no specific targets found, show only centered welcome/end steps
            const stepsToShow = filteredSteps.length > 0
                ? filteredSteps
                : tourSteps.filter(s => s.target === 'body');

            setValidSteps(stepsToShow.map((step) => ({
                target: step.target,
                content: (
                    <div className={step.target === 'body' ? 'text-center' : ''}>
                        <h4 className="font-bold text-amber-800 mb-2 text-lg">{step.title}</h4>
                        <p className="text-ink-600 leading-relaxed">{step.content}</p>
                    </div>
                ),
                placement: step.placement || 'auto',
                disableBeacon: true, // Always disable beacon for cleaner UX
                spotlightClicks: true,
            })));
        }, 300);

        return () => clearTimeout(timer);
    }, [run, section]);

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            onFinish();
            // Mark as completed in DB only for full tour
            if (section === 'all') {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase
                            .from('profiles')
                            .update({ has_completed_tutorial: true })
                            .eq('id', user.id);
                    }
                } catch (err) {
                    logger.error("Error saving tutorial status:", err);
                }
            }
        }
    };

    const customStyles: Partial<Styles> = {
        options: {
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.6)',
            primaryColor: '#b45309', // amber-700
            textColor: '#4b5563', // gray-600
            zIndex: 10000,
        },
        tooltip: {
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '380px',
        },
        tooltipTitle: {
            fontSize: '1.125rem',
            fontWeight: 700,
        },
        tooltipContent: {
            fontSize: '0.95rem',
            lineHeight: 1.6,
        },
        buttonNext: {
            backgroundColor: '#b45309',
            color: '#fff',
            fontFamily: 'inherit',
            fontWeight: 600,
            borderRadius: '0.5rem',
            padding: '0.625rem 1.25rem',
            fontSize: '0.9rem',
        },
        buttonBack: {
            color: '#6b7280',
            marginRight: '0.75rem',
            fontWeight: 500,
        },
        buttonSkip: {
            color: '#9ca3af',
            fontSize: '0.85rem',
        },
        spotlight: {
            borderRadius: '0.75rem',
        },
    };

    // Don't render until we have valid steps
    if (!run || validSteps.length === 0) {
        return null;
    }

    return (
        <Joyride
            steps={validSteps}
            run={run}
            continuous
            showProgress
            showSkipButton
            scrollToFirstStep
            disableScrolling={false}
            styles={customStyles}
            callback={handleJoyrideCallback}
            locale={{
                back: '← Précédent',
                close: 'Fermer',
                last: '🎉 Terminé !',
                next: 'Suivant →',
                skip: 'Passer le tour',
                open: 'Ouvrir le dialogue',
            }}
            floaterProps={{
                disableAnimation: false,
                styles: {
                    floater: {
                        transition: 'transform 0.3s ease-out',
                    },
                },
            }}
        />
    );
};
