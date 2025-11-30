import React, { useState, useEffect } from 'react';
import { supabase, saveSupabaseKey } from '../services/supabaseClient';
import { IconFeather, IconGoogle, IconSettings, IconArrowRight, IconArrowLeft, IconCheck } from './Icons';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'login' | 'signup';
}

type OnboardingStep = 'welcome' | 'name' | 'email' | 'password' | 'config';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
    const [step, setStep] = useState<OnboardingStep>('welcome');
    const [isSignUp, setIsSignUp] = useState(initialView === 'signup');

    // Form Data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Status
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [debugUrl, setDebugUrl] = useState<string>('');

    // API Key Config
    const [apiKeyInput, setApiKeyInput] = useState('');

    useEffect(() => {
        setIsSignUp(initialView === 'signup');
        setStep('welcome');
        setError(null);
        setMessage(null);
        setDebugUrl(window.location.origin);
    }, [initialView, isOpen]);

    // Auto-detect API key error
    useEffect(() => {
        if (error && (error.includes('Invalid API key') || error.includes('apikey'))) {
            setStep('config');
        }
    }, [error]);

    if (!isOpen) return null;

    const handleNext = () => {
        setError(null);
        if (step === 'welcome') {
            setStep(isSignUp ? 'name' : 'email');
        } else if (step === 'name') {
            if (!name.trim()) { setError("Dites-moi comment vous appeler."); return; }
            setStep('email');
        } else if (step === 'email') {
            if (!email.includes('@')) { setError("Cette adresse ne semble pas valide."); return; }
            setStep('password');
        }
    };

    const handleBack = () => {
        setError(null);
        if (step === 'password') setStep('email');
        else if (step === 'email') setStep(isSignUp ? 'name' : 'welcome');
        else if (step === 'name') setStep('welcome');
        else if (step === 'config') setStep('welcome');
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: name,
                            full_name: name
                        }
                    }
                });
                if (error) throw error;
                setMessage("Votre chapitre commence. Vérifiez vos emails pour confirmer.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            }
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        const currentOrigin = window.location.origin;
        setDebugUrl(currentOrigin);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: currentOrigin,
                    queryParams: { access_type: 'offline', prompt: 'consent' },
                }
            });
            if (error) throw error;
        } catch (err: any) {
            console.error("Google Auth Error:", err);
            setError(err.message || "Erreur de connexion Google");
            setLoading(false);
        }
    };

    const handleSaveKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKeyInput.trim().length > 10) {
            saveSupabaseKey(apiKeyInput.trim());
            setStep('welcome'); // Reset after save
        }
    };

    // --- RENDER HELPERS ---

    const renderStepContent = () => {
        switch (step) {
            case 'welcome':
                return (
                    <div className="space-y-8 animate-fade-in text-center">
                        <div className="space-y-2">
                            <h3 className="font-serif text-3xl font-bold text-ink-900">
                                {isSignUp ? "Commencer l'aventure" : "Bon retour parmi nous"}
                            </h3>
                            <p className="text-ink-500 font-serif italic text-lg">
                                {isSignUp
                                    ? "Je suis PLUME. Ensemble, nous allons graver l'éternité."
                                    : "Votre plume n'attend que vous pour continuer le récit."}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-accent hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                {isSignUp ? "Commencer mon récit" : "Ouvrir mon journal"} <IconArrowRight className="w-5 h-5" />
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-ink-100"></div>
                                <span className="flex-shrink-0 mx-4 text-ink-300 text-xs uppercase tracking-widest">Ou</span>
                                <div className="flex-grow border-t border-ink-100"></div>
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                className="w-full py-3 bg-white border-2 border-ink-100 hover:border-ink-200 text-ink-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-3 group"
                            >
                                <IconGoogle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>Continuer avec Google</span>
                            </button>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                                className="text-ink-400 hover:text-accent text-sm font-medium transition-colors"
                            >
                                {isSignUp ? "J'ai déjà un compte" : "Je n'ai pas encore de compte"}
                            </button>
                        </div>
                    </div>
                );

            case 'name':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center space-y-2">
                            <h3 className="font-serif text-2xl font-bold text-ink-900">Les présentations</h3>
                            <p className="text-ink-500">Comment souhaitez-vous que je vous appelle ?</p>
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                            placeholder="Votre Prénom"
                            autoFocus
                            className="w-full text-center text-2xl font-serif border-b-2 border-ink-200 focus:border-accent bg-transparent py-2 outline-none placeholder-ink-200 text-ink-800 transition-colors"
                        />
                        <button onClick={handleNext} className="w-full py-3 bg-ink-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                            Enchanté, {name || '...'}
                        </button>
                    </div>
                );

            case 'email':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center space-y-2">
                            <h3 className="font-serif text-2xl font-bold text-ink-900">Correspondance</h3>
                            <p className="text-ink-500">Quelle est votre adresse secrète ?</p>
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                            placeholder="votre@email.com"
                            autoFocus
                            className="w-full text-center text-xl font-sans border-b-2 border-ink-200 focus:border-accent bg-transparent py-2 outline-none placeholder-ink-200 text-ink-800 transition-colors"
                        />
                        <button onClick={handleNext} className="w-full py-3 bg-ink-900 text-white rounded-xl font-bold hover:bg-black transition-colors">
                            Continuer
                        </button>
                    </div>
                );

            case 'password':
                return (
                    <form onSubmit={handleAuth} className="space-y-6 animate-fade-in">
                        <div className="text-center space-y-2">
                            <h3 className="font-serif text-2xl font-bold text-ink-900">Le Sceau</h3>
                            <p className="text-ink-500">Un mot de passe pour protéger vos souvenirs.</p>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoFocus
                            className="w-full text-center text-xl font-sans border-b-2 border-ink-200 focus:border-accent bg-transparent py-2 outline-none placeholder-ink-200 text-ink-800 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-accent hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? 'Signature en cours...' : (isSignUp ? 'Graver le pacte' : 'Ouvrir le coffre')}
                            {!loading && <IconFeather className="w-5 h-5" />}
                        </button>
                    </form>
                );

            case 'config':
                return (
                    <form onSubmit={handleSaveKey} className="space-y-4 animate-fade-in">
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
                            <p className="font-bold mb-1">🔧 Configuration Technique</p>
                            <p>Pour fonctionner, PLUME a besoin de la clé API Supabase (Anon Key).</p>
                        </div>
                        <input
                            type="text"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            required
                            placeholder="Collez la clé ici..."
                            className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none font-mono text-xs"
                        />
                        <button type="submit" className="w-full py-3 bg-ink-900 text-white font-bold rounded-xl hover:bg-black transition-colors">
                            Sauvegarder
                        </button>
                    </form>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1510]/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#fcfbf9] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative min-h-[500px] flex flex-col">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-amber-400 to-accent"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>

                {/* Header */}
                <div className="p-8 pb-0 flex justify-between items-center relative z-10">
                    {step !== 'welcome' && (
                        <button onClick={handleBack} className="p-2 -ml-2 text-ink-400 hover:text-ink-800 hover:bg-ink-50 rounded-full transition-colors">
                            <IconArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div className="flex-1 flex justify-center">
                        <div className="w-12 h-12 bg-white border border-ink-100 rounded-full flex items-center justify-center shadow-sm">
                            <IconFeather className="w-6 h-6 text-accent" />
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 -mr-2 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <div className="w-6 h-6 flex items-center justify-center font-bold text-xl">×</div>
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-8 flex flex-col justify-center relative z-10">
                    {renderStepContent()}
                </div>

                {/* Footer / Error Area */}
                <div className="p-6 text-center relative z-10">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 animate-shake">
                            {error}
                            {(error.includes('Invalid API key') || error.includes('apikey')) && (
                                <button onClick={() => setStep('config')} className="block mt-1 font-bold underline w-full">Configurer l'API</button>
                            )}
                        </div>
                    )}
                    {message && (
                        <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl border border-emerald-100 flex items-center justify-center gap-2">
                            <IconCheck className="w-4 h-4" /> {message}
                        </div>
                    )}

                    <div className="text-xs text-ink-300 font-serif italic">
                        "La mémoire est l'avenir du passé." — Paul Valéry
                    </div>
                </div>

                {/* Config Button (Hidden/Subtle) */}
                <button
                    onClick={() => setStep('config')}
                    className="absolute bottom-4 right-4 text-ink-200 hover:text-ink-400 transition-colors"
                    title="Configuration"
                >
                    <IconSettings className="w-4 h-4" />
                </button>

            </div>
        </div>
    );
};

export default AuthModal;