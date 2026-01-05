import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

export interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    price_yearly: number | null;
    price_lifetime: number | null;
    stripe_price_id_monthly?: string;
    stripe_price_id_yearly?: string;
    stripe_price_id_lifetime?: string;
    limits: {
        souvenirs: number;
        ai_calls: number;
        photos: number;
        witnesses: number;
        audio_exports: number;
    };
    features: {
        pdf_export: boolean;
        premium_templates?: boolean;
        multi_book?: boolean;
    };
}

export interface Subscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: 'active' | 'canceled' | 'past_due' | 'expired';
    billing_cycle?: 'monthly' | 'yearly' | 'lifetime';
    current_period_end?: string;
    is_lifetime: boolean;
}

export interface Addon {
    id: string;
    name: string;
    price: number;
    type: 'consumable' | 'feature';
    value: Record<string, number>;
    validity_days: number | null;
    stripe_price_id?: string;
}

export interface UserAddon {
    id: string;
    addon_id: string;
    remaining_value: Record<string, number>;
    expires_at: string | null;
}

export const subscriptionService = {
    /**
     * Get all available plans
     */
    async getPlans(): Promise<Plan[]> {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('price_monthly', { ascending: true });

        if (error) {
            logger.error('Error fetching plans:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get user's current subscription
     * If no subscription exists, creates a default 'free' subscription
     */
    async getUserSubscription(userId: string): Promise<Subscription | null> {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = JSON object requested, multiple (or no) rows returned
            logger.error('Error fetching subscription:', error);
            return null;
        }

        if (!data) {
            // Create default free subscription
            const { data: newSub, error: createError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan_id: 'free',
                    status: 'active'
                })
                .select()
                .single();

            if (createError) {
                logger.error('Error creating default subscription:', createError);
                return null;
            }
            return newSub;
        }

        return data;
    },

    /**
     * Get current plan details for a user
     */
    async getUserPlan(userId: string): Promise<Plan | null> {
        const sub = await this.getUserSubscription(userId);
        if (!sub) return null;

        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('id', sub.plan_id)
            .single();

        if (error) {
            logger.error('Error fetching user plan details:', error);
            return null;
        }
        return data;
    },

    /**
     * Get user's purchased addons
     */
    async getUserAddons(userId: string): Promise<UserAddon[]> {
        const { data, error } = await supabase
            .from('user_addons')
            .select('*')
            .eq('user_id', userId)
            .gte('expires_at', new Date().toISOString()); // Filter expired

        if (error) {
            logger.error('Error fetching user addons:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get available addons
     */
    async getAvailableAddons(): Promise<Addon[]> {
        const { data, error } = await supabase
            .from('addons')
            .select('*');

        if (error) {
            logger.error('Error fetching addons:', error);
            return [];
        }
        return data || [];
    }
};
