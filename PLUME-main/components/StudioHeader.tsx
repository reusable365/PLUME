import React, { useState } from 'react';
import { IconSave, IconEdit3, IconSparkles } from './Icons';

interface StudioHeaderProps {
    title: string;
    onTitleChange: (newTitle: string) => void;
    maturityScore: number; // 0-100
    maturityStatus: 'germination' | 'en_cours' | 'pret';
    onGraverClick: () => void;
    onNewSouvenirClick: () => void;
    isGraverDisabled: boolean;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
    title,
    onTitleChange,
    maturityScore,
    maturityStatus,
    onGraverClick,
    onNewSouvenirClick,
    isGraverDisabled
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);

    const handleTitleSave = () => {
        if (tempTitle.trim()) {
            onTitleChange(tempTitle.trim());
        }
        setIsEditingTitle(false);
    };

    const statusConfig = {
        germination: { label: '🌱 Germination', color: 'text-slate-500', barColor: 'bg-slate-400' },
        en_cours: { label: '⚡ En cours', color: 'text-amber-600', barColor: 'bg-amber-500' },
        pret: { label: '✅ Prêt à graver', color: 'text-emerald-600', barColor: 'bg-gradient-to-r from-emerald-500 to-emerald-600' }
    };

    const currentStatus = statusConfig[maturityStatus];

    return (
        <div className="h-16 bg-white/95 backdrop-blur-sm border-b border-[#EFECE5] flex items-center justify-between px-6 shadow-sm z-40 flex-shrink-0">
            {/* TITRE (Gauche) */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                {isEditingTitle ? (
                    <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTitleSave();
                            if (e.key === 'Escape') { setTempTitle(title); setIsEditingTitle(false); }
                        }}
                        className="font-serif font-bold text-lg text-slate-800 border-b-2 border-[#D97706] outline-none bg-transparent px-1"
                        autoFocus
                    />
                ) : (
                    <>
                        <h1 className="font-serif font-bold text-lg text-slate-800 truncate max-w-xs">
                            {title}
                        </h1>
                        <button
                            onClick={() => { setTempTitle(title); setIsEditingTitle(true); }}
                            className="text-slate-400 hover:text-[#D97706] transition-colors p-1"
                            title="Modifier le titre"
                        >
                            <IconEdit3 className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>

            {/* JAUGE DE MATURITÉ (Centre) */}
            <div className="flex-1 max-w-md mx-8 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className={`flex items-center gap-1 ${currentStatus.color}`}>
                        <IconSparkles className="w-3 h-3" />
                        {currentStatus.label}
                    </span>
                    <span className="text-slate-500">{maturityScore}%</span>
                </div>
                <div className="h-2 w-full bg-[#EFECE5] rounded-full overflow-hidden">
                    <div
                        className={`h-full ${currentStatus.barColor} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                        style={{ width: `${Math.max(maturityScore, 5)}%` }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-white/30 w-full animate-shimmer transform -skew-x-12"></div>
                    </div>
                </div>
            </div>

            {/* BOUTON GRAVER (Droite) */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onNewSouvenirClick}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm text-slate-600 hover:bg-slate-100 transition-all"
                    title="Commencer un nouveau souvenir (Archive la conversation actuelle)"
                >
                    <IconSparkles className="w-4 h-4" />
                    <span>Nouveau</span>
                </button>

                <button
                    onClick={onGraverClick}
                    disabled={isGraverDisabled}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 whitespace-nowrap ${isGraverDisabled
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : maturityStatus === 'pret'
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg hover:shadow-xl hover:scale-105 animate-golden-pulse'
                            : 'bg-[#D97706] text-white shadow-md hover:shadow-lg hover:bg-[#B45309]'
                        }`}
                    title={
                        isGraverDisabled
                            ? `Continuez à écrire (${maturityScore}%)`
                            : maturityStatus === 'pret'
                                ? 'Graver le souvenir dans votre livre'
                                : `Presque prêt (${maturityScore}%)`
                    }
                >
                    <IconSave className="w-4 h-4" />
                    <span>Graver le Souvenir</span>
                </button>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
                @keyframes golden-pulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.4); }
                    50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.8); }
                }
                .animate-golden-pulse {
                    animation: golden-pulse 2s infinite;
                }
            `}</style>
        </div>
    );
};
