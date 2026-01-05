import React, { useEffect, useState } from 'react';
import { subscriptionService, Addon, UserAddon } from '../services/subscriptionService';
import { useSubscription } from '../hooks/useSubscription';
import { stripeService } from '../services/stripeService';
import { ShoppingCart, X, Zap, Mic, Printer, Plus } from 'lucide-react';
import { logger } from '../utils/logger';

interface AddonsStoreProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export const AddonsStore: React.FC<AddonsStoreProps> = ({ isOpen, onClose, userId }) => {
    const [addons, setAddons] = useState<Addon[]>([]);
    const [userAddons, setUserAddons] = useState<UserAddon[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [available, owned] = await Promise.all([
                    subscriptionService.getAvailableAddons(),
                    subscriptionService.getUserAddons(userId)
                ]);
                setAddons(available);
                setUserAddons(owned);
            } catch (error) {
                logger.error('Error loading addons', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (isOpen) loadData();
    }, [isOpen, userId]);

    if (!isOpen) return null;

    // Handle Purchase
    const handlePurchase = async (addon: Addon) => {
        if (!addon.stripe_price_id) {
            alert("Configuration incomplète pour cet add-on.");
            return;
        }

        try {
            const result = await stripeService.createCheckoutSession(addon.stripe_price_id, 'payment');
            stripeService.redirectToCheckout(result.url);
        } catch (error) {
            logger.error('Purchase failed', error);
            alert("Erreur lors de l'initialisation du paiement.");
        }
    };

    const getIcon = (type: string, name: string) => {
        if (name.toLowerCase().includes('audio')) return <Mic className="w-8 h-8 text-indigo-500" />;
        if (name.toLowerCase().includes('pdf') || name.toLowerCase().includes('livre')) return <Printer className="w-8 h-8 text-amber-500" />;
        if (type === 'consumable') return <Zap className="w-8 h-8 text-yellow-500" />;
        return <ShoppingCart className="w-8 h-8 text-emerald-500" />;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-gray-900">La Boutique des Possibles</h2>
                        <p className="text-gray-500 mt-2">Ajoutez des super-pouvoirs à votre récit, à la carte.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* My Addons Check */}
                {userAddons.length > 0 && (
                    <div className="px-8 py-6 bg-indigo-50/50 border-b border-indigo-100">
                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-widest mb-4">Vos Recharges Actives</h3>
                        <div className="flex flex-wrap gap-4">
                            {userAddons.map(ua => (
                                <div key={ua.id} className="bg-white border border-indigo-100 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="font-medium text-indigo-900">
                                        ID: {ua.addon_id.split('-')[0]}...
                                    </span>
                                    {ua.remaining_value && (
                                        <span className="text-indigo-500 text-sm font-bold">
                                            {JSON.stringify(ua.remaining_value).replace(/{|}|"/g, '')} restants
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Store Grid */}
                <div className="flex-1 p-8 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {addons.map((addon) => (
                            <div key={addon.id} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-indigo-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                        {getIcon(addon.type, addon.name)}
                                    </div>
                                    <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                                        {(addon.price / 100).toFixed(2)}€
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{addon.name}</h3>
                                <p className="text-gray-500 text-sm mb-6 min-h-[40px]">
                                    {addon.type === 'consumable'
                                        ? "Recharge ponctuelle pour booster votre usage immédiatement."
                                        : "Débloquez cette fonctionnalité de manière permanente."}
                                </p>

                                <button
                                    onClick={() => handlePurchase(addon)}
                                    className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold shadow-lg hover:bg-indigo-600 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                                    <Plus className="w-5 h-5" />
                                    Ajouter au panier
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
