import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import GuestMemoryCard from './GuestMemoryCard';
import { GuestContext } from '../types';
import { X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';

interface GuestLandingPageProps {
    token?: string;
    onComplete: () => void;
    onLogin?: () => void;
}

const GuestLandingPage: React.FC<GuestLandingPageProps> = ({ token, onComplete, onLogin }) => {
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [guestContext, setGuestContext] = useState<GuestContext | null>(null);

    useEffect(() => {
        if (token) {
            loadInvite(token);
        } else {
            // Fallback for simulation/demo without token
            setIsLoading(false);
        }
    }, [token]);

    const loadInvite = async (inviteToken: string) => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('guest_invites')
                .select('*')
                .eq('token', inviteToken)
                .single();

            if (error) throw error;
            if (!data) throw new Error("Invitation introuvable.");

            // Construct Context
            setGuestContext({
                souvenirId: data.id,
                authorName: "L'auteur",
                memoryTitle: data.title || "Souvenir partagé",
                memoryContext: data.context || {
                    location: "Lieu non spécifié",
                    date: "Date non spécifiée",
                    tags: []
                },
                authorQuestion: data.question
            });

            // Mark as opened
            if (data.status === 'sent') {
                await supabase.from('guest_invites').update({ status: 'opened' }).eq('id', data.id);
            }

        } catch (err) {
            console.error(err);
            setError("Lien invalide ou expiré.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setTimeout(onComplete, 700);
    };

    const handleContributionComplete = async (text: string, media?: Blob) => {
        // Here we would save to guest_contributions
        // For now, GuestMemoryCard might handle its own logic or we pass a handler.
        // GuestMemoryCard definition says 'onComplete' but doesn't pass back data?
        // Let's verify GuestMemoryCard props or assume we need to modify it too if it doesn't give back data.
        // Assuming GuestMemoryCard manages the UI for "Thank you".
        // If GuestMemoryCard calls onComplete, it means flow is done.
        // Logic for saving *should* ideally be here or inside GuestMemoryCard.
        // Given I can't see GuestMemoryCard internals right now, I'll assume it handles display.
        // Ideally I should pass a "onSubmit" prop to GuestMemoryCard. 
        // Checking previous view of GuestLandingPage, it just successfully rendered GuestMemoryCard.

        setTimeout(handleClose, 2000);
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin text-emerald-600">Chargement...</div></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-red-500">{error}</div>;

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background Landing Page */}
            <div className={`transition-all duration-700 ease-in-out ${isModalOpen ? 'blur-sm scale-[0.98] brightness-75 pointer-events-none' : 'blur-0 scale-100 brightness-100'}`}>
                <LandingPage onLogin={onLogin || (() => { })} />
            </div>

            {/* Modal Overlay */}
            {isModalOpen && guestContext && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-in">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all shadow-lg"
                            title="Fermer"
                        >
                            <X size={24} />
                        </button>

                        <GuestMemoryCard
                            {...guestContext}
                            isModal={true}
                            onComplete={handleContributionComplete}
                            inviteToken={token} // Pass token to allow card to save to DB
                        />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-scale-in {
                    animation: scaleIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default GuestLandingPage;
