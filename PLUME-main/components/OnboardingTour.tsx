import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';
import '../styles/onboarding.css';

interface OnboardingTourProps {
    run: boolean;
    onFinish: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onFinish }) => {
    const [steps] = useState<Step[]>([
        {
            target: 'body',
            content: (
                <div className="text-center">
                    <h3 className="font-serif text-xl font-bold text-amber-900 mb-2">Bienvenue dans votre Atelier</h3>
                    <p>Laissez-moi vous faire visiter votre nouvel espace d'écriture. Cela ne prendra qu'une minute.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '[data-tour="input-area"]',
            content: (
                <div>
                    <h4 className="font-bold text-amber-800 mb-1">Votre Espace de Parole</h4>
                    <p>C'est ici que tout commence. Racontez vos souvenirs naturellement, comme si vous parliez à un ami. Plume vous écoute et vous guide.</p>
                </div>
            ),
            placement: 'top',
        },
        {
            target: '[data-tour="action-buttons"]',
            content: (
                <div>
                    <h4 className="font-bold text-amber-800 mb-1">Enrichissez vos Récits</h4>
                    <p>Utilisez ces outils pour donner vie à vos souvenirs :</p>
                    <ul className="list-disc pl-4 mt-2 text-sm space-y-1">
                        <li><strong>Style</strong> : Ajustez le ton de Plume</li>
                        <li><strong>Contexte</strong> : Situez le souvenir dans le temps</li>
                        <li><strong>Photo</strong> : Importez une image pour raviver la mémoire</li>
                    </ul>
                </div>
            ),
        },
        {
            target: '[data-tour="left-panel"]',
            content: (
                <div>
                    <h4 className="font-bold text-amber-800 mb-1">Votre Coffre à Idées</h4>
                    <p>Retrouvez ici toutes vos idées notées à la volée. Cliquez sur une idée pour commencer à l'écrire.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '[data-tour="compilation-panel"]',
            content: (
                <div>
                    <h4 className="font-bold text-amber-800 mb-1">La Magie en Temps Réel</h4>
                    <p>Pendant que vous discutez, Plume tisse votre récit ici même. Vous verrez votre souvenir prendre forme sous vos yeux.</p>
                </div>
            ),
            placement: 'left',
        },
        {
            target: '[data-tour="graver-button"]',
            content: (
                <div>
                    <h4 className="font-bold text-amber-800 mb-1">Gravez pour l'Éternité</h4>
                    <p>Une fois satisfait de votre récit, cliquez ici pour le "Graver". Il rejoindra alors votre collection dans la Boutique des Souvenirs.</p>
                </div>
            ),
        },
        {
            target: '[data-tour="navigation"]',
            content: (
                <div>
                    <h4 className="font-bold text-amber-800 mb-1">Explorez votre Univers</h4>
                    <p>Naviguez entre l'Atelier, votre Tableau de Bord, et la Boutique où tous vos souvenirs sont précieusement gardés.</p>
                </div>
            ),
            placement: 'bottom',
        },
    ]);

    const handleJoyrideCallback = async (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            onFinish();
            // Mark as completed in DB
            try {
                const { error } = await supabase.rpc('mark_tutorial_complete');
                if (error) {
                    // Fallback if RPC doesn't exist yet or fails
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase
                            .from('profiles')
                            .update({ has_completed_tutorial: true })
                            .eq('id', user.id);
                    }
                }
            } catch (err) {
                logger.error("Error saving tutorial status:", err);
            }
        }
    };

    const customStyles: Styles = {
        options: {
            arrowColor: '#fff',
            backgroundColor: '#fff',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: '#b45309', // amber-700
            textColor: '#4b5563', // gray-600
            zIndex: 10000,
        },
        tooltip: {
            borderRadius: '1rem',
            padding: '1.5rem',
        },
        buttonNext: {
            backgroundColor: '#b45309',
            color: '#fff',
            fontFamily: 'inherit',
            fontWeight: 600,
            borderRadius: '0.5rem',
            padding: '0.5rem 1rem',
        },
        buttonBack: {
            color: '#9ca3af',
            marginRight: '1rem',
        },
        buttonSkip: {
            color: '#9ca3af',
        },
    };

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            styles={customStyles}
            callback={handleJoyrideCallback}
            locale={{
                back: 'Précédent',
                close: 'Fermer',
                last: 'Terminer',
                next: 'Suivant',
                skip: 'Passer',
            }}
            floaterProps={{
                disableAnimation: true,
            }}
        />
    );
};
