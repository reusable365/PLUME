import { useState, useEffect } from 'react';
import { subscriptionService, Plan, Subscription } from '../services/subscriptionService';
import { logger } from '../utils/logger';

export const useSubscription = (userId?: string) => {
    const [plan, setPlan] = useState<Plan | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const fetchSubscription = async () => {
            try {
                const sub = await subscriptionService.getUserSubscription(userId);
                setSubscription(sub);

                if (sub) {
                    const planDetails = await subscriptionService.getUserPlan(userId);
                    setPlan(planDetails);
                }
            } catch (error) {
                logger.error('Failed to fetch subscription', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscription();
    }, [userId]);

    return { plan, subscription, isLoading };
};
