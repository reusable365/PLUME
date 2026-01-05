import React from 'react';
import { useSubscription } from '../hooks/useSubscription';

interface PlanBadgeProps {
    userId: string;
    onClick?: () => void;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ userId, onClick }) => {
    const { plan, subscription, isLoading } = useSubscription(userId);

    if (isLoading || !plan) return null;

    const getBadgeColor = (planId: string) => {
        switch (planId) {
            case 'free': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'writer': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'biographer': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'family': return 'bg-amber-50 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const name = plan.name;
    const isLifetime = subscription?.is_lifetime;

    return (
        <div
            onClick={onClick}
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getBadgeColor(plan.id)} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
        >
            {isLifetime && <span title="Plan à vie">∞</span>}
            {name}
        </div>
    );
};
