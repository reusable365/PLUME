
import React, { useEffect, useState } from 'react';

const ACTIVITIES = [
    { user: "Michel", action: "vient d'écrire le chapitre", subject: "Rencontre avec Marie" },
    { user: "Sophie", action: "a structuré son souvenir", subject: "L'été 1982" },
    { user: "Jean-Pierre", action: "a illustré", subject: "La maison d'enfance" },
    { user: "Marie", action: "a complété son livre", subject: "Les Racines" },
    { user: "Lucas", action: "a ajouté une note vocale", subject: "Souvenir de grand-père" },
    { user: "Hélène", action: "a retrouvé une photo de", subject: "1965" },
];

const RecentActivityTicker: React.FC = () => {
    const [index, setIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false); // Fade out
            setTimeout(() => {
                setIndex((prev) => (prev + 1) % ACTIVITIES.length);
                setIsVisible(true); // Fade in
            }, 500);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const activity = ACTIVITIES[index];

    return (
        <div className="mt-12 md:mt-16 flex justify-center w-full animate-fade-in">
            <div
                className={`
                    bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-6 py-3 flex items-center gap-3 shadow-xl 
                    transition-all duration-500 ease-in-out
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}
            >
                <div className="flex relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 relative z-10" />
                </div>

                <p className="text-white/90 text-xs md:text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[250px] md:max-w-none">
                    <span className="font-bold text-amber-200">{activity.user}</span> {activity.action} <span className="italic text-white">"{activity.subject}"</span>
                </p>
            </div>
        </div>
    );
};

export default RecentActivityTicker;
