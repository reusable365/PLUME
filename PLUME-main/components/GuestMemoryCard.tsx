import React, { useState } from 'react';
import { Mic, Image as ImageIcon, Send, Sparkles, MapPin, Calendar, Info, X, Check } from 'lucide-react';
import { IconFeather } from './Icons';
import { supabase } from '../services/supabaseClient';

interface GuestMemoryCardProps {
    souvenirId?: string;
    authorName?: string;
    memoryTitle?: string;
    memoryContext?: {
        location: string;
        date: string;
        tags: string[];
    };
    authorQuestion?: string;
    isModal?: boolean;
    onComplete?: () => void;
}

const GuestMemoryCard: React.FC<GuestMemoryCardProps> = ({
    souvenirId,
    authorName = "Stéphane",
    memoryTitle = "L'été en Bretagne",
    memoryContext = {
        location: "Saint-Malo, France",
        date: "Août 1998",
        tags: ["Plage", "Cerf-volant", "Orage"]
    },
    authorQuestion = "Je me souviens qu'on a perdu les clés de la voiture... mais qui est allé chercher de l'aide au village ?",
    isModal = false,
    onComplete
}) => {
    const [step, setStep] = useState<'contribute' | 'revealed'>('contribute');
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [photo, setPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!text && !photo && !isRecording) return;
        setIsSubmitting(true);

        if (souvenirId) {
            try {
                const { error } = await supabase.from('guest_contributions').insert({
                    chapter_id: souvenirId,
                    guest_name: 'Ami de ' + authorName, // Placeholder
                    content: text || (isRecording ? "[Enregistrement Audio]" : "[Photo Partagée]"),
                    contribution_type: isRecording ? 'audio' : photo ? 'photo' : 'text',
                    status: 'pending'
                });

                if (error) throw error;
            } catch (error) {
                console.error("Error saving contribution:", error);
                // In a real app, show error toast
            }
        }

        // Simulate submission delay for UX
        setTimeout(() => {
            setStep('revealed');
            setIsSubmitting(false);
            if (onComplete) {
                setTimeout(onComplete, 2000); // Wait a bit before closing
            }
        }, 1000);
    };

    const toggleRecording = () => {
        setIsRecording(!isRecording);
    };

    return (
        <div className={`${isModal ? 'h-full bg-[#fcfbf9] rounded-3xl' : 'min-h-screen bg-[#fcfbf9]'} font-sans text-slate-800 flex flex-col relative overflow-hidden transition-all`}>

            {/* Background Texture/Gradient - Subtle for SaaS feel */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-amber-50/80 to-transparent pointer-events-none" />

            {/* Header: Branding & Context */}
            <header className="relative z-10 px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-amber-600 p-1.5 rounded-lg shadow-sm">
                        <IconFeather className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-serif font-bold text-xl tracking-tight text-slate-900">PLUME</span>
                </div>
                <button
                    onClick={() => setShowInfo(true)}
                    className="text-slate-400 hover:text-amber-600 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                    <Info size={16} />
                    <span className="hidden sm:inline">C'est quoi Plume ?</span>
                </button>
            </header>

            <main className="flex-1 relative z-10 flex flex-col items-center px-4 pb-8 max-w-2xl mx-auto w-full">

                {/* Author Profile & Welcome */}
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="relative inline-block mb-3">
                        <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-tr from-amber-100 to-orange-100 flex items-center justify-center text-2xl font-serif text-amber-700">
                            {authorName.charAt(0)}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">
                        Aidez <span className="text-amber-600">{authorName}</span> à écrire sa vie
                    </h1>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        Il manque une pièce au puzzle. Votre mémoire est précieuse.
                    </p>
                </div>

                {step === 'contribute' && (
                    <div className="w-full space-y-6 animate-fadeIn">

                        {/* Memory Context Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1">
                                    <MapPin size={12} /> {memoryContext.location}
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1">
                                    <Calendar size={12} /> {memoryContext.date}
                                </span>
                            </div>

                            <h2 className="text-xl font-serif font-bold text-slate-800 mb-3">
                                "{memoryTitle}"
                            </h2>

                            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                                <p className="text-slate-700 italic leading-relaxed">
                                    {authorQuestion}
                                </p>
                            </div>
                        </div>

                        {/* Unified Contribution Area */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-amber-500/20">

                            {/* Text Input */}
                            <textarea
                                className="w-full p-5 text-lg text-slate-800 placeholder-slate-300 resize-none outline-none min-h-[120px] font-sans bg-transparent"
                                placeholder="Je me souviens que..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />

                            {/* Media Preview Area */}
                            {(isRecording || photo) && (
                                <div className="px-5 pb-4 flex gap-3 overflow-x-auto">
                                    {isRecording && (
                                        <div className="flex items-center gap-3 bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-100 animate-pulse">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                            <span className="text-sm font-medium">Enregistrement...</span>
                                            <button onClick={toggleRecording} className="ml-2 hover:bg-red-100 rounded-full p-1"><X size={14} /></button>
                                        </div>
                                    )}
                                    {photo && (
                                        <div className="relative group">
                                            <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-xs text-slate-400">Photo</div>
                                            <button onClick={() => setPhoto(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-0.5"><X size={12} /></button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Toolbar & Action */}
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleRecording}
                                        className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-red-100 text-red-600' : 'hover:bg-white hover:shadow-sm text-slate-500 hover:text-amber-600'}`}
                                        title="Enregistrer un vocal"
                                    >
                                        <Mic size={20} />
                                    </button>
                                    <button
                                        onClick={() => setPhoto('placeholder')}
                                        className="p-2.5 rounded-xl hover:bg-white hover:shadow-sm text-slate-500 hover:text-amber-600 transition-all"
                                        title="Ajouter une photo"
                                    >
                                        <ImageIcon size={20} />
                                    </button>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!text && !photo && !isRecording}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${text || photo || isRecording
                                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 transform hover:-translate-y-0.5'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <span>Envoyer</span>
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-xs text-slate-400">
                            Votre contribution est privée et sécurisée par PLUME.
                        </p>
                    </div>
                )}

                {step === 'revealed' && (
                    <div className="w-full animate-fadeIn space-y-6">
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600">
                                <Check size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-green-800 mb-1">Merci pour votre contribution !</h3>
                            <p className="text-green-700/80 text-sm">Stéphane sera ravi de redécouvrir ce moment.</p>
                        </div>

                        {/* The Reveal */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 relative overflow-hidden group cursor-pointer">
                            <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                Extrait du livre
                            </div>

                            <div className="flex items-center gap-2 mb-4 opacity-50">
                                <IconFeather className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-serif text-slate-400">Écrit par Stéphane avec PLUME</span>
                            </div>

                            <p className="font-serif text-lg text-slate-800 leading-relaxed blur-sm group-hover:blur-none transition-all duration-700">
                                "Ce jour-là, le vent soufflait si fort que le sable nous fouettait les jambes. Je tenais la main de mon père, et malgré l'orage qui grondait au loin, je me sentais invulnérable..."
                            </p>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-500">
                                <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-slate-600 shadow-sm border border-slate-200">
                                    Survolez pour lire l'extrait
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl p-6 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <h3 className="font-serif text-xl font-bold mb-2 relative z-10">Et vous ?</h3>
                            <p className="text-slate-300 text-sm mb-6 relative z-10">
                                Vous avez aussi des souvenirs qui méritent d'être gravés ? Découvrez la magie de l'écriture assistée.
                            </p>
                            <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-amber-50 transition-colors relative z-10">
                                Commencer mon livre gratuitement
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Info Modal / Overlay */}
            {showInfo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowInfo(false)}>
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-amber-600 p-1.5 rounded-lg">
                                <IconFeather className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-serif font-bold text-xl text-slate-900">PLUME</span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-900 mb-2">Le gardien de vos souvenirs</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            PLUME est une application qui aide chacun à écrire le livre de sa vie. Grâce à une IA bienveillante, vos souvenirs oraux ou écrits sont transformés en un récit littéraire magnifique.
                        </p>

                        <div className="bg-amber-50 rounded-xl p-4 mb-4">
                            <h4 className="font-bold text-amber-800 text-sm mb-1">Pourquoi votre aide compte ?</h4>
                            <p className="text-amber-700/80 text-xs">
                                La mémoire est collective. En partageant votre point de vue, vous enrichissez l'histoire de Stéphane avec des détails qu'il a peut-être oubliés.
                            </p>
                        </div>

                        <button onClick={() => setShowInfo(false)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
                            J'ai compris
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestMemoryCard;
