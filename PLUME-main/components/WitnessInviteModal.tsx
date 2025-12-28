import React, { useState, useEffect } from 'react';
import { X, Send, Link, Mail, MessageCircle, Sparkles, Users, Copy, Check } from 'lucide-react';
import { IconFeather } from './Icons';
import { suggestWitnessQuestions } from '../services/witnessService';
import { supabase } from '../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';


interface WitnessInviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    souvenir: {
        id: string;
        title: string;
        content: string;
        location?: string;
        date?: string;
        tags?: string[];
    };
    authorName: string;
}

const WitnessInviteModal: React.FC<WitnessInviteModalProps> = ({
    isOpen,
    onClose,
    souvenir,
    authorName
}) => {
    const [guestName, setGuestName] = useState('');
    const [guestRelation, setGuestRelation] = useState('');
    const [customQuestion, setCustomQuestion] = useState('');
    const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState<'form' | 'share'>('form');
    const [isCreating, setIsCreating] = useState(false); // New loading state for creation

    useEffect(() => {
        if (isOpen && souvenir.content) {
            loadSuggestions();
        }
    }, [isOpen, souvenir.content]);

    const loadSuggestions = async () => {
        setIsLoadingSuggestions(true);
        try {
            const questions = await suggestWitnessQuestions(souvenir.content, souvenir.title);
            setSuggestedQuestions(questions);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const handleCreateInvite = async () => {
        if (!customQuestion.trim()) return;
        setIsCreating(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Vous devez être connecté.");
                return;
            }

            const token = uuidv4();
            const invitePayload = {
                user_id: user.id,
                guest_name: guestName || 'Témoin',
                relation: guestRelation,
                question: customQuestion,
                token: token,
                status: 'sent',
                title: souvenir.title,
                chapter_id: souvenir.id,
                context: {
                    location: souvenir.location,
                    date: souvenir.date,
                    tags: souvenir.tags,
                    excerpt: souvenir.content ? souvenir.content.substring(0, 200) : ''
                }
            };

            const { error } = await supabase
                .from('guest_invites')
                .insert(invitePayload);

            if (error) throw error;

            const baseUrl = window.location.origin;
            const link = `${baseUrl}/?mode=guest&token=${token}`;

            setInviteLink(link);
            setStep('share');
        } catch (error) {
            console.error('Error creating invite:', error);
            alert("Erreur lors de la création de l'invitation.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const handleShareWhatsApp = () => {
        const message = `${authorName} t'invite à enrichir un souvenir 📖\n\n"${souvenir.title}"\n\nIl te demande :\n"${customQuestion}"\n\n👉 Contribue ici : ${inviteLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleShareEmail = () => {
        const subject = `${authorName} a besoin de tes souvenirs !`;
        const body = `Bonjour${guestName ? ` ${guestName}` : ''},\n\nJ'écris le livre de ma vie avec PLUME et j'aurais besoin de ton aide pour enrichir un souvenir.\n\n📖 "${souvenir.title}"\n\nMa question :\n"${customQuestion}"\n\nTa mémoire est précieuse ! Clique ici pour contribuer :\n${inviteLink}\n\nMerci d'avance !\n${authorName}`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleSelectSuggestion = (question: string) => {
        setCustomQuestion(question);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Users size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Appeler un témoin</h2>
                    </div>
                    <p className="text-white/80 text-sm">
                        Invitez quelqu'un à enrichir "{souvenir.title}"
                    </p>
                </div>

                {step === 'form' && (
                    <div className="p-6 space-y-5">
                        {/* Guest Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nom du témoin
                                </label>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="Marie"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Relation
                                </label>
                                <input
                                    type="text"
                                    value={guestRelation}
                                    onChange={(e) => setGuestRelation(e.target.value)}
                                    placeholder="Ma sœur"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Custom Question */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Votre question pour le témoin
                            </label>
                            <textarea
                                value={customQuestion}
                                onChange={(e) => setCustomQuestion(e.target.value)}
                                placeholder="Que s'est-il passé exactement ? Qui était là ?"
                                rows={3}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* AI Suggestions */}
                        {suggestedQuestions.length > 0 && (
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <div className="flex items-center gap-2 text-amber-800 mb-3">
                                    <Sparkles size={16} />
                                    <span className="text-sm font-medium">PLUME suggère :</span>
                                </div>
                                <div className="space-y-2">
                                    {suggestedQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSelectSuggestion(q)}
                                            className="w-full text-left px-3 py-2 text-sm text-amber-900 bg-white hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoadingSuggestions && (
                            <div className="flex items-center justify-center gap-2 text-amber-600 py-4">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                                <span className="text-sm">PLUME réfléchit...</span>
                            </div>
                        )}

                        {/* Create Button */}
                        <button
                            onClick={handleCreateInvite}
                            disabled={!customQuestion.trim()}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${customQuestion.trim()
                                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <Send size={18} />
                            Créer l'invitation
                        </button>
                    </div>
                )}

                {step === 'share' && (
                    <div className="p-6 space-y-5">
                        {/* Success message */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Check size={24} className="text-green-600" />
                            </div>
                            <h3 className="font-bold text-green-800">Invitation prête !</h3>
                            <p className="text-sm text-green-700">Partagez ce lien avec {guestName || 'votre témoin'}</p>
                        </div>

                        {/* Link display */}
                        <div className="bg-slate-100 rounded-xl p-3 flex items-center gap-2">
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-transparent text-sm text-slate-600 outline-none truncate"
                            />
                            <button
                                onClick={handleCopyLink}
                                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-white text-slate-700 hover:bg-slate-200'
                                    }`}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copié !' : 'Copier'}
                            </button>
                        </div>

                        {/* Share options */}
                        <div className="space-y-3">
                            <button
                                onClick={handleShareWhatsApp}
                                className="w-full p-4 bg-green-50 hover:bg-green-100 rounded-xl flex items-center gap-4 transition-colors border border-green-200"
                            >
                                <div className="bg-green-500 text-white p-2 rounded-full">
                                    <MessageCircle size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-900">WhatsApp</span>
                                    <span className="text-xs text-slate-500">Envoyer avec un message personnalisé</span>
                                </div>
                            </button>

                            <button
                                onClick={handleShareEmail}
                                className="w-full p-4 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-4 transition-colors border border-blue-200"
                            >
                                <div className="bg-blue-500 text-white p-2 rounded-full">
                                    <Mail size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="block font-bold text-slate-900">Email</span>
                                    <span className="text-xs text-slate-500">Envoyer une invitation par email</span>
                                </div>
                            </button>
                        </div>

                        {/* Back button */}
                        <button
                            onClick={() => setStep('form')}
                            className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                        >
                            ← Modifier la question
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WitnessInviteModal;
