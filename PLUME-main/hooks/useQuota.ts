import { useState, useEffect, useCallback } from 'react';
import { usageTrackingService, UsageMetric } from '../services/usageTrackingService';
import { logger } from '../utils/logger';

export const useQuota = (userId?: string, metric: UsageMetric = 'ai_calls') => {
    const [usage, setUsage] = useState(0);
    const [limit, setLimit] = useState(0);
    const [loading, setLoading] = useState(true);

    const checkQuota = useCallback(async () => {
        if (!userId) return;
        try {
            const status = await usageTrackingService.checkLimit(userId, metric);
            setUsage(status.used);
            setLimit(status.limit);
        } catch (error) {
            logger.error('Failed to check quota', error);
        } finally {
            setLoading(false);
        }
    }, [userId, metric]);

    useEffect(() => {
        checkQuota();
    }, [checkQuota]);

    return { usage, limit, loading, refresh: checkQuota };
};
