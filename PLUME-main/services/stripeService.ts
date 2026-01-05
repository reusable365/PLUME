
import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';

export interface CheckoutSession {
    sessionId: string;
    url: string;
}

export const stripeService = {
    /**
     * Create a Stripe Checkout Session for a subscription or one-time purchase
     */
    createCheckoutSession: async (
        priceId: string,
        mode: 'subscription' | 'payment' = 'subscription',
        metaData: any = {}
    ): Promise<CheckoutSession> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('User not authenticated');

            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: {
                    priceId,
                    userId: session.user.id,
                    successUrl: window.location.origin + '?payment=success',
                    cancelUrl: window.location.origin + '?payment=cancel',
                    mode,
                    ...metaData
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data;
        } catch (error) {
            logger.error('Error creating checkout session:', error);
            throw error;
        }
    },

    /**
     * Redirects to Stripe Checkout (wrapper around window.location)
     */
    redirectToCheckout: (url: string) => {
        window.location.href = url;
    }
};
