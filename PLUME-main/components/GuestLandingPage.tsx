import React, { useState } from 'react';
import LandingPage from './LandingPage';
import GuestMemoryCard from './GuestMemoryCard';
import { GuestContext } from '../types';
import { X } from 'lucide-react';

interface GuestLandingPageProps {
    guestContext: GuestContext;
    onClose: () => void;
    onLogin?: () => void;
}

const GuestLandingPage: React.FC<GuestLandingPageProps> = ({ guestContext, onClose, onLogin }) => {
    const [isModalOpen, setIsModalOpen] = useState(true);

    const handleClose = () => {
        setIsModalOpen(false);
        setTimeout(onClose, 700); // Wait for transition to complete
    };

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Background Landing Page - Blurred and Scaled Down slightly to focus on modal */}
            <div className={`transition-all duration-700 ease-in-out ${isModalOpen ? 'blur-sm scale-[0.98] brightness-75 pointer-events-none' : 'blur-0 scale-100 brightness-100'}`}>
                <LandingPage onLogin={onLogin || (() => { })} />
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
                    <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-in">
                        {/* Close Button for the modal itself if user wants to skip */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-50 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all shadow-lg"
                            title="Fermer et découvrir PLUME"
                        >
                            <X size={24} />
                        </button>

                        <GuestMemoryCard
                            {...guestContext}
                            isModal={true}
                            onComplete={() => {
                                setTimeout(handleClose, 2000); // Close after success message
                            }}
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
