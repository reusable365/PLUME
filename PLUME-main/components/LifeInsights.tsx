import React from 'react';
import { LifeInsight, InsightType } from '../services/lifeInsightsService';

interface LifeInsightsProps {
    insights: LifeInsight[];
    isLoading: boolean;
    onRefresh: () => void;
    onInsightClick: (insight: LifeInsight) => void;
    totalSouvenirs: number;
}

const getInsightIcon = (type: InsightType): string => {
    switch (type) {
        case 'emotional': return '❤️';
        case 'temporal': return '⏰';
        case 'relational': return '👥';
        case 'geographical': return '🗺️';
        default: return '✨';
    }
};

const getInsightGradient = (type: InsightType): string => {
    switch (type) {
        case 'emotional': return 'from-pink-500 to-rose-500';
        case 'temporal': return 'from-blue-500 to-indigo-500';
        case 'relational': return 'from-purple-500 to-violet-500';
        case 'geographical': return 'from-green-500 to-emerald-500';
        default: return 'from-gray-500 to-slate-500';
    }
};

export const LifeInsights: React.FC<LifeInsightsProps> = ({
    insights,
    isLoading,
    onRefresh,
    onInsightClick,
    totalSouvenirs
}) => {
    if (isLoading) {
        return (
            <div className="mb-8 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-3xl p-8 shadow-xl border border-purple-200/50">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-purple-700 font-medium">L'IA analyse vos souvenirs...</p>
                        <p className="text-purple-600 text-sm mt-2">Découverte de patterns cachés en cours</p>
                    </div>
                </div>
            </div>
        );
    }

    if (insights.length === 0) {
        return null;
    }

    return (
        <div className="mb-8 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-3xl p-8 shadow-xl border border-purple-200/50 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ink-900 mb-2">
                        ✨ Vos Souvenirs Révèlent...
                    </h2>
                    <p className="text-ink-600">
                        L'IA a analysé <span className="font-bold text-purple-700">{totalSouvenirs} souvenirs</span> et découvert ces patterns
                    </p>
                </div>
                <button
                    onClick={onRefresh}
                    className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-sm font-medium hover:bg-white transition-all shadow-sm hover:shadow-md flex items-center gap-2 group"
                >
                    <span className="group-hover:rotate-180 transition-transform duration-500">🔄</span>
                    Actualiser
                </button>
            </div>

            {/* Insights Cards - Scroll Horizontal */}
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className="min-w-[320px] bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 snap-start hover:scale-105 transition-all duration-300 cursor-pointer group"
                        onClick={() => onInsightClick(insight)}
                        style={{
                            animationDelay: `${idx * 100}ms`
                        }}
                    >
                        {/* Icon */}
                        <div className={`w-14 h-14 bg-gradient-to-br ${getInsightGradient(insight.type)} rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            <span className="text-3xl">{getInsightIcon(insight.type)}</span>
                        </div>

                        {/* Titre */}
                        <h3 className="font-bold text-lg text-ink-900 mb-3 line-clamp-2">
                            {insight.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-ink-600 mb-4 line-clamp-4 leading-relaxed">
                            {insight.description}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs pt-4 border-t border-ink-100">
                            <span className="text-purple-700 font-bold flex items-center gap-1">
                                <span className="text-base">📚</span>
                                {insight.relatedSouvenirIds.length} souvenir{insight.relatedSouvenirIds.length > 1 ? 's' : ''}
                            </span>
                            <span className="text-ink-400 font-medium flex items-center gap-1">
                                <span className="text-base">🎯</span>
                                {insight.confidence}%
                            </span>
                        </div>

                        {/* Hover indicator */}
                        <div className="mt-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-purple-600 font-medium">
                                Cliquez pour filtrer →
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Scroll hint */}
            {insights.length > 3 && (
                <div className="text-center mt-4">
                    <p className="text-xs text-purple-600 animate-pulse">
                        ← Faites défiler pour voir tous les insights →
                    </p>
                </div>
            )}
        </div>
    );
};

// Style pour cacher la scrollbar tout en gardant le scroll
const style = document.createElement('style');
style.textContent = `
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
`;
document.head.appendChild(style);
