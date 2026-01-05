import React from 'react';
import { useQuota } from '../hooks/useQuota';
import { UsageMetric } from '../services/usageTrackingService';

interface QuotaIndicatorProps {
    userId: string;
    metric: UsageMetric;
    label?: string;
    compact?: boolean;
    onClick?: () => void;
}

export const QuotaIndicator: React.FC<QuotaIndicatorProps> = ({ userId, metric, label, compact, onClick }) => {
    const { usage, limit, loading } = useQuota(userId, metric);

    // Unlimited case or loading
    if (loading) return <div className="animate-pulse w-8 h-8 bg-gray-200 rounded-full" />;

    if (limit === -1) {
        return (
            <div className="flex items-center gap-2 text-gray-400" title="Illimité">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 flex items-center justify-center text-emerald-600 font-bold bg-emerald-50">
                    ∞
                </div>
            </div>
        );
    }

    const percentage = Math.min((usage / limit) * 100, 100);
    const isWarning = percentage > 80;
    const isCritical = percentage >= 100;

    const color = isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-indigo-500';
    const trackColor = isCritical ? 'text-red-100' : isWarning ? 'text-amber-100' : 'text-indigo-100';

    // Circular SVG
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div
            onClick={onClick}
            className={`flex items-center gap-2 group ${onClick ? 'cursor-pointer' : ''}`}
            title={`${usage}/${limit} ${label || metric}`}
        >
            <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Track */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        className={trackColor}
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="16"
                        cy="16"
                    />
                    {/* Progress */}
                    <circle
                        className={`${color} transition-all duration-500 ease-out`}
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="16"
                        cy="16"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-500">
                    {Math.floor(percentage)}%
                </div>
            </div>

            {!compact && (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-700">{label || 'Quota'}</span>
                    <span className="text-[10px] text-gray-400">{usage} / {limit}</span>
                </div>
            )}
        </div>
    );
};
