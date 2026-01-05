import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { subscriptionService, Plan, UserAddon } from './subscriptionService';

export type UsageMetric = 'souvenirs' | 'ai_calls' | 'photos' | 'witnesses' | 'audio_exports';

export const usageTrackingService = {
    /**
     * Track a metric usage (increment count)
     */
    async trackUsage(userId: string, metric: UsageMetric, amount: number = 1): Promise<void> {
        const today = new Date();
        const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString(); // Start of month

        // Check if we should consume from an add-on first
        const addons = await subscriptionService.getUserAddons(userId);
        const consumableAddon = addons.find(a =>
            a.remaining_value &&
            (a.remaining_value[metric] || 0) > 0
        );

        if (consumableAddon) {
            // Decrement addon
            const newValue = (consumableAddon.remaining_value[metric] || 0) - amount;
            const updatedValue = { ...consumableAddon.remaining_value, [metric]: newValue };

            const { error } = await supabase
                .from('user_addons')
                .update({ remaining_value: updatedValue })
                .eq('id', consumableAddon.id);

            if (error) logger.error('Error updating addon usage:', error);
            return;
        }

        // Otherwise track locally in usage_tracking table (monthly quota)
        // 1. Check if row exists
        const { data: existingUsage } = await supabase
            .from('usage_tracking')
            .select('*')
            .eq('user_id', userId)
            .eq('metric', metric)
            .eq('period_start', periodStart)
            .single();

        if (existingUsage) {
            await supabase
                .from('usage_tracking')
                .update({ count: existingUsage.count + amount })
                .eq('id', existingUsage.id);
        } else {
            await supabase
                .from('usage_tracking')
                .insert({
                    user_id: userId,
                    metric,
                    count: amount,
                    period_start: periodStart
                });
        }
    },

    /**
     * Get current usage for a metric in the current period
     */
    async getUsage(userId: string, metric: UsageMetric): Promise<number> {
        const today = new Date();
        const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        const { data, error } = await supabase
            .from('usage_tracking')
            .select('count')
            .eq('user_id', userId)
            .eq('metric', metric)
            .eq('period_start', periodStart)
            .single();

        if (error && error.code !== 'PGRST116') {
            logger.error('Error fetching usage:', error);
            return 0;
        }

        return data?.count || 0;
    },

    /**
     * Check if user can perform an action based on limits
     */
    async checkLimit(userId: string, metric: UsageMetric): Promise<{ allowed: boolean; limit: number; used: number; source: 'plan' | 'addon' | 'unlimited' }> {
        const plan = await subscriptionService.getUserPlan(userId);
        const usage = await this.getUsage(userId, metric);
        const addons = await subscriptionService.getUserAddons(userId);

        // Calculate total addon capacity for this metric
        const addonCapacity = addons.reduce((acc, addon) => {
            return acc + (addon.remaining_value?.[metric] || 0);
        }, 0);

        if (!plan) return { allowed: false, limit: 0, used: usage, source: 'plan' };

        const planLimit = plan.limits[metric];

        // Unlimited (-1)
        if (planLimit === -1) {
            return { allowed: true, limit: -1, used: usage, source: 'unlimited' };
        }

        // Check if within plan limit
        if (usage < planLimit) {
            return { allowed: true, limit: planLimit, used: usage, source: 'plan' };
        }

        // Check addons
        if (addonCapacity > 0) {
            // If we have addon capacity, we are allowed (tracking logic handles consumption)
            return { allowed: true, limit: planLimit + addonCapacity, used: usage, source: 'addon' };
        }

        return { allowed: false, limit: planLimit, used: usage, source: 'plan' };
    }
};
