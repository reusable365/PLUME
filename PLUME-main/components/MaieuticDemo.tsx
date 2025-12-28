
import React, { useState, useEffect } from 'react';
import { IconFeather } from './Icons';

const MaieuticDemo: React.FC = () => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-ink-100 p-6 max-w-md mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-amber-400 h-full"></div>
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <IconFeather className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">L'Architecte IA</span>
            </div>

            <div className="space-y-4">
                {/* Message 1 */}
                <div className={`transition-opacity duration-500 ${step >= 0 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-amber-50 rounded-lg rounded-tl-none p-3 text-sm text-ink-800">
                        Vous avez mentionné l'odeur du café... C'était quel type de cafetière ?
                    </div>
                </div>

                {/* Response 1 */}
                <div className={`flex justify-end transition-opacity duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-ink-100 rounded-lg rounded-tr-none p-3 text-sm text-ink-700">
                        Une vieille italienne en aluminium, toute cabossée.
                    </div>
                </div>

                {/* Message 2 */}
                <div className={`transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-amber-50 rounded-lg rounded-tl-none p-3 text-sm text-ink-800">
                        Je vois. Et le bruit qu'elle faisait sur le feu ?
                    </div>
                </div>

                {/* Response 2 */}
                <div className={`flex justify-end transition-opacity duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-ink-100 rounded-lg rounded-tr-none p-3 text-sm text-ink-700">
                        Un gargouillis... puis un sifflement strident !
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-ink-100 text-center">
                <p className="text-xs text-ink-400 italic">Plume vous pose les bonnes questions pour réveiller vos souvenirs.</p>
            </div>
        </div>
    );
};

export default MaieuticDemo;
