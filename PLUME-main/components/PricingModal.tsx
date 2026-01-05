import React, { useEffect, useState } from 'react';
import { subscriptionService, Plan } from '../services/subscriptionService';
import { useSubscription } from '../hooks/useSubscription';
import { stripeService } from '../services/stripeService';
import { Check, X, Crown, Zap, Star, Users } from 'lucide-react';
import { logger } from '../utils/logger';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, userId }) => {
    const { plan: currentPlan, subscription } = useSubscription(userId);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const availablePlans = await subscriptionService.getPlans();
                setPlans(availablePlans);
            } catch (error) {
                logger.error('Error loading plans', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (isOpen) loadPlans();
    }, [isOpen]);

    if (!isOpen) return null;

    const getPrice = (plan: Plan) => {
        if (billingCycle === 'monthly') return plan.price_monthly;
        if (billingCycle === 'yearly') return plan.price_yearly;
        if (billingCycle === 'lifetime') return plan.price_lifetime;
        return null;
    };

    const formatPrice = (price: number | null) => {
        if (price === 0) return 'Gratuit';
        if (price === null) return 'N/A';
        return `${(price / 100).toFixed(2)}€`;
    };

    const getIcon = (planId: string) => {
        switch (planId) {
            case 'free': return <Zap className="w-6 h-6 text-gray-400" />;
            case 'writer': return <Crown className="w-6 h-6 text-emerald-500" />;
            case 'biographer': return <Star className="w-6 h-6 text-purple-500" />;
            case 'family': return <Users className="w-6 h-6 text-amber-500" />;
            default: return <Check className="w-6 h-6" />;
        }
    };

    const getGradient = (planId: string) => {
        switch (planId) {
            case 'writer': return 'from-emerald-50 to-emerald-100/50 border-emerald-200';
            case 'biographer': return 'from-purple-50 to-purple-100/50 border-purple-200';
            case 'family': return 'from-amber-50 to-amber-100/50 border-amber-200';
            default: return 'from-gray-50 to-gray-100/50 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col items-center justify-center p-4 backdrop-blur-sm overflow-hidden">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[85vh] m-auto flex flex-col shadow-2xl animate-fade-in relative">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-gray-900">Choisissez votre Plume</h2>
                        <p className="text-gray-500 mt-2">Débloquez tout le potentiel de votre biographie</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center py-6 bg-white sticky top-0 z-10 border-b border-gray-50">
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center font-medium text-sm">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-4 py-2 rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Annuel <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">-20%</span>
                        </button>
                        <button
                            onClick={() => setBillingCycle('lifetime')}
                            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${billingCycle === 'lifetime' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            À vie <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">Best</span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="flex-1 p-8 bg-gray-50/50 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {plans.map((plan) => {
                            const price = getPrice(plan);
                            const isCurrent = currentPlan?.id === plan.id;
                            const isAvailable = price !== null;

                            if (!isAvailable) return null;

                            return (
                                <div key={plan.id} className={`relative bg-gradient-to-b ${getGradient(plan.id)} rounded-2xl p-6 border flex flex-col h-full hover:shadow-lg transition-shadow duration-300`}>
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                            ACTUEL
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                                            {getIcon(plan.id)}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-bold text-gray-900">{formatPrice(price)}</span>
                                            {billingCycle !== 'lifetime' && <span className="text-gray-500 text-sm">/mois</span>}
                                        </div>
                                        {billingCycle === 'yearly' && plan.price_monthly > 0 && (
                                            <p className="text-xs text-emerald-600 mt-1">Facturé {formatPrice(plan.price_yearly)} /an</p>
                                        )}
                                        {billingCycle === 'lifetime' && (
                                            <p className="text-xs text-purple-600 mt-1">Paiement unique, accès à vie</p>
                                        )}
                                    </div>

                                    <div className="space-y-4 flex-1 mb-8">
                                        <FeatureItem label={`${plan.limits.souvenirs === -1 ? 'Illimité' : plan.limits.souvenirs} Souvenirs`} />
                                        <FeatureItem label={`${plan.limits.ai_calls} Appels IA /mois`} />
                                        <FeatureItem label={`${plan.limits.photos === -1 ? 'Illimitées' : plan.limits.photos} Photos`} />
                                        <FeatureItem label={`${plan.limits.witnesses === -1 ? 'Illimités' : plan.limits.witnesses} Témoins`} />
                                        {plan.features.pdf_export && <FeatureItem label="Export PDF" />}
                                        {plan.features.premium_templates && <FeatureItem label="Templates Premium" />}
                                        {plan.features.multi_book && <FeatureItem label="Multi-Livres" />}
                                        {billingCycle === 'lifetime' && <FeatureItem label="Mises à jour à vie incluses" highlight />}
                                    </div>

                                    <button
                                        disabled={isCurrent}
                                        onClick={async () => {
                                            if (isCurrent) return;
                                            // Handle Plan Switch
                                            try {
                                                const price = getPrice(plan);
                                                if (!price) return;

                                                // Find the price ID (This assumes we have a mapping or the price object has the ID)
                                                // Since our backend service 'getPlans' constructs the plan object, we need to ensure it includes Stripe Price IDs.
                                                // For now, let's assume valid price IDs are stored or we fetch them. 
                                                // Wait, subscriptionService.getPlans returns Plan objects with numeric prices, not Stripe IDs.
                                                // We need to fetch the actual Stripe Price ID.
                                                // PROVISIONAL: We will use a lookup or fetch from subscriptionService if possible,
                                                // OR we rely on the backend to find price by plan_id + interval.
                                                // Let's pass the PlanID and Interval to the Edge Function instead?
                                                // No, Edge Function expects priceId.

                                                // SOLUTION: We need to map Plan + Interval to Price ID.
                                                // Since we don't have them in the frontend state yet without querying Stripe,
                                                // we can either add them to the Plan interface or simple Lookup.

                                                // For this MVP step, I will add a placeholder to get Price ID from the backend logic 
                                                // or strictly speaking, the SubscriptionService should return them.

                                                // Let's assume for now we call createCheckoutSession with a 'lookup_key' logic if functionality existed,
                                                // but since we need a Price ID, we will assume we can get it.

                                                // TODO: Update subscriptionService to return stripe_price_ids

                                                console.log("Checkout for", plan.id, billingCycle);
                                                // alert("Paiement via Stripe bientôt disponible !");

                                                /* 
                                                const response = await stripeService.createCheckoutSession('price_H5ggYJ...', 'subscription');
                                                stripeService.redirectToCheckout(response.url);
                                                */

                                            } catch (err) {
                                                logger.error(err);
                                            }
                                        }}
                                        className={`w-full py-3 rounded-xl font-bold transition-all transform active:scale-95 ${isCurrent
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'
                                            }`}
                                    >
                                        {isCurrent ? 'Plan Actuel' : 'Choisir ce plan'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureItem: React.FC<{ label: string; highlight?: boolean }> = ({ label, highlight }) => (
    <div className={`flex items-center gap-2 text-sm ${highlight ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${highlight ? 'bg-purple-500' : 'bg-gray-400'}`} />
        {label}
    </div>
);
