import React, { useEffect, useState } from 'react';
import { subscriptionService, Plan } from '../services/subscriptionService';
import { Check, Zap, Crown, Star, Users } from 'lucide-react';
import { logger } from '../utils/logger';

interface PricingSectionProps {
    onSignUp: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ onSignUp }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
    /* removed loading state as we want seamless rendering or skeleton, but simple is fine for now */

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const availablePlans = await subscriptionService.getPlans();
                setPlans(availablePlans);
            } catch (error) {
                logger.error('Error loading plans', error);
            }
        };
        loadPlans();
    }, []);

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
        <section className="py-24 bg-white relative overflow-hidden" id="pricing">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Une offre pour <span className="text-accent">chaque histoire</span>
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Commencez gratuitement, puis choisissez l'écrin qui convient le mieux à vos mémoires.
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center font-medium text-sm shadow-inner">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-3 rounded-xl transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Mensuel
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Annuel <span className="hidden sm:inline-block text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">-20%</span>
                        </button>
                        <button
                            onClick={() => setBillingCycle('lifetime')}
                            className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${billingCycle === 'lifetime' ? 'bg-white shadow-md text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            À vie <span className="hidden sm:inline-block text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Best</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan) => {
                        const price = getPrice(plan);
                        const isAvailable = price !== null;

                        if (!isAvailable) return null;

                        const isPopular = plan.id === 'biographer';

                        return (
                            <div key={plan.id} className={`group relative bg-gradient-to-b ${getGradient(plan.id)} rounded-3xl p-8 border flex flex-col h-full hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}>
                                {isPopular && billingCycle === 'yearly' && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg tracking-wide uppercase">
                                        Recommandé
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`p-3 rounded-2xl bg-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                        {getIcon(plan.id)}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 font-serif">{plan.name}</h3>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-gray-900">{formatPrice(price)}</span>
                                        {billingCycle !== 'lifetime' && <span className="text-gray-500 text-sm font-medium">/mois</span>}
                                    </div>
                                    {billingCycle === 'yearly' && plan.price_monthly > 0 && (
                                        <p className="text-xs text-emerald-600 mt-2 font-medium">Facturé {formatPrice(plan.price_yearly)} /an</p>
                                    )}
                                    {billingCycle === 'lifetime' && (
                                        <p className="text-xs text-purple-600 mt-2 font-medium">Paiement unique, accès à vie</p>
                                    )}
                                </div>

                                <div className="space-y-4 flex-1 mb-8">
                                    <FeatureItem label={`${plan.limits.souvenirs === -1 ? 'Illimité' : plan.limits.souvenirs} Souvenirs`} />
                                    <FeatureItem label={`${plan.limits.ai_calls} Appels IA /mois`} />
                                    <FeatureItem label={`${plan.limits.photos === -1 ? 'Illimitées' : plan.limits.photos} Photos`} />
                                    <FeatureItem label={`${plan.limits.witnesses === -1 ? 'Illimités' : plan.limits.witnesses} Témoins`} />
                                    {plan.features.pdf_export && <FeatureItem label="Export PDF Qualité Livre" highlight />}
                                    {plan.features.premium_templates && <FeatureItem label="Templates Premium" />}
                                    {plan.features.multi_book && <FeatureItem label="Multi-Livres" />}
                                    {billingCycle === 'lifetime' && <FeatureItem label="Mises à jour à vie incluses" highlight />}
                                </div>

                                <button
                                    onClick={onSignUp}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 ${plan.id === 'free'
                                            ? 'bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-900'
                                            : 'bg-gray-900 text-white hover:bg-black shadow-xl hover:shadow-2xl'
                                        }`}
                                >
                                    {plan.id === 'free' ? 'Commencer Gratuitement' : 'Choisir ce plan'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const FeatureItem: React.FC<{ label: string; highlight?: boolean }> = ({ label, highlight }) => (
    <div className={`flex items-center gap-3 text-sm ${highlight ? 'text-purple-900 font-semibold' : 'text-gray-600'}`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${highlight ? 'bg-purple-500' : 'bg-gray-300'}`} />
        {label}
    </div>
);

export default PricingSection;
