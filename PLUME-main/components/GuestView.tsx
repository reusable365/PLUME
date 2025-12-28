import React, { useState, useEffect } from 'react';
import { IconUsers, IconSend, IconLink, IconMail, IconCheck, IconMessageCircle, IconPenTool, IconUser } from './Icons';
import { supabase } from '../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface GuestInvite {
    id: string;
    name: string; // guest_name in DB
    relation: string;
    question: string;
    status: 'sent' | 'opened' | 'answered';
    answer?: string; // from linked guest_contribution? Or just status. For now, basic listing.
    sentDate: string;
    token: string;
}

export const GuestView: React.FC = () => {
    const [invites, setInvites] = useState<GuestInvite[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [newInvite, setNewInvite] = useState({ name: '', relation: '', question: '' });
    const [activeTab, setActiveTab] = useState<'dashboard' | 'guest_demo'>('dashboard');
    const [demoGuestId, setDemoGuestId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Load invites on mount
    useEffect(() => {
        fetchInvites();
    }, []);

    const fetchInvites = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('guest_invites')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedInvites: GuestInvite[] = data.map(i => ({
                    id: i.id,
                    name: i.guest_name,
                    relation: i.relation,
                    question: i.question,
                    status: i.status as any,
                    sentDate: new Date(i.created_at).toLocaleDateString(),
                    token: i.token
                }));
                setInvites(mappedInvites);
            }
        } catch (error) {
            logger.error('Error fetching invites:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateInvite = async () => {
        if (!newInvite.name || !newInvite.question) return;
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
                guest_name: newInvite.name,
                relation: newInvite.relation,
                question: newInvite.question,
                token: token,
                status: 'sent'
            };

            const { data, error } = await supabase
                .from('guest_invites')
                .insert(invitePayload)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const newInviteObj: GuestInvite = {
                    id: data.id,
                    name: data.guest_name,
                    relation: data.relation,
                    question: data.question,
                    status: data.status as any,
                    sentDate: new Date(data.created_at).toLocaleDateString(),
                    token: data.token
                };
                setInvites([newInviteObj, ...invites]);
                setNewInvite({ name: '', relation: '', question: '' });
                // Auto-copy link? Or just show list.
            }
        } catch (error) {
            logger.error('Error creating invite:', error);
            alert("Erreur lors de la création de l'invitation.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyLink = (token: string, id: string) => {
        const link = `${window.location.origin}/?mode=guest&token=${token}`;
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSimulateGuest = (id: string) => {
        setDemoGuestId(id);
        setActiveTab('guest_demo');
    };

    const handleGuestSubmit = (text: string) => {
        // In simulation, we update local state only for visual feedback, 
        // OR we could actually submit to DB if we implement the backend logic in the demo component.
        // For now, keep visual feedback.
        setInvites(invites.map(inv =>
            inv.id === demoGuestId
                ? { ...inv, status: 'answered', answer: text }
                : inv
        ));
        setActiveTab('dashboard');
        setDemoGuestId(null);
    };

    return (
        <div className="max-w-6xl mx-auto pt-8 pb-12 px-6 min-h-screen">

            {/* Header */}
            <div className="text-center mb-12">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-200">
                    <IconUsers className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-serif text-slate-800 mb-3">Appel à Témoins</h1>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                    Invitez vos proches à enrichir votre histoire. Leurs souvenirs viendront compléter les vôtres.
                </p>

                {/* UX Tip Banner */}
                <div className="mt-8 max-w-3xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 text-left">
                    <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
                        <IconUsers className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-800 text-sm mb-1">💡 Conseil de Plume</h3>
                        <p className="text-amber-700/90 text-sm leading-relaxed">
                            Pour des témoignages plus riches, il est recommandé de lancer une invitation <strong>depuis un souvenir précis</strong>.
                            Rendez-vous dans la <a href="#" onClick={(e) => { e.preventDefault(); (document.querySelector('nav button:nth-child(3)') as HTMLElement)?.click(); /* Hacky nav */ }} className="underline font-bold hover:text-amber-900">Boutique des Souvenirs</a>, choisissez une carte et cliquez sur "Partager".
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs (Simulation) */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Espace Auteur (Tableau de bord)
                    </button>
                    <button
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'guest_demo'
                            ? 'bg-white text-emerald-700 shadow-sm'
                            : 'text-slate-400 cursor-not-allowed'
                            }`}
                        disabled
                    >
                        Vue Invité (Simulation)
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Create Invite Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-slate-100 sticky top-24">
                            <h3 className="text-xl font-serif text-slate-800 mb-6 flex items-center gap-2">
                                <IconPenTool className="w-5 h-5 text-emerald-600" />
                                Nouvelle Invitation
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prénom du témoin</label>
                                    <input
                                        type="text"
                                        value={newInvite.name}
                                        onChange={e => setNewInvite({ ...newInvite, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="ex: Mamie"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Lien de parenté</label>
                                    <input
                                        type="text"
                                        value={newInvite.relation}
                                        onChange={e => setNewInvite({ ...newInvite, relation: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="ex: Grand-mère"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Sujet / Question</label>
                                    <textarea
                                        rows={4}
                                        value={newInvite.question}
                                        onChange={e => setNewInvite({ ...newInvite, question: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                        placeholder="Sur quel souvenir aimeriez-vous qu'iel intervienne ?"
                                    />
                                </div>

                                <button
                                    onClick={handleCreateInvite}
                                    disabled={!newInvite.name || !newInvite.question || isCreating}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
                                >
                                    {isCreating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "Générer l'invitation"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Invites List Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-serif text-slate-800 mb-4 flex items-center gap-2">
                            <IconMail className="w-5 h-5 text-slate-600" />
                            Invitations en cours
                        </h3>

                        {isLoading ? (
                            <div className="text-center py-12 text-slate-400">Chargement...</div>
                        ) : invites.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                                <IconMail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Aucune invitation envoyée pour le moment.</p>
                            </div>
                        ) : (
                            invites.map(invite => (
                                <div key={invite.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    {invite.status === 'answered' && (
                                        <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-bl-xl">
                                            RÉPONDU
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                                                {invite.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{invite.name}</h4>
                                                <span className="text-sm text-slate-500">{invite.relation}</span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-slate-400">
                                            Envoyé le {invite.sentDate}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl mb-4 relative">
                                        <IconMessageCircle className="w-4 h-4 text-slate-400 absolute top-4 left-4" />
                                        <p className="text-slate-700 pl-6 italic">"{invite.question}"</p>
                                    </div>

                                    {invite.status === 'answered' && invite.answer ? (
                                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                            <h5 className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">Réponse reçue</h5>
                                            <p className="text-slate-800 leading-relaxed text-sm">
                                                "{invite.answer}"
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => handleCopyLink(invite.token, invite.id)}
                                                className={`flex-1 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${copiedId === invite.id
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {copiedId === invite.id ? (
                                                    <>
                                                        <IconCheck className="w-4 h-4" />
                                                        Lien copié !
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconLink className="w-4 h-4" />
                                                        Copier le lien
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleSimulateGuest(invite.id)}
                                                className="flex-1 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white"
                                            >
                                                <IconUser className="w-4 h-4" />
                                                Simuler la vue invité
                                            </button>
                                        </div>
                                    )}

                                    {/* Show Answer if received */}
                                    {invite.status === 'answered' && (
                                        <div className="mt-4 p-4 bg-emerald-50 rounded-lg text-sm text-slate-700 italic border border-emerald-100 animate-fade-in">
                                            <div className="flex items-center gap-2 text-emerald-700 font-bold mb-1">
                                                <IconMessageCircle className="w-4 h-4" />
                                                Réponse reçue :
                                            </div>
                                            "{invite.answer || "Réponse en attente de synchronisation..."}"
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <GuestInterfaceDemo
                    invite={invites.find(i => i.id === demoGuestId)!}
                    onSubmit={handleGuestSubmit}
                    onCancel={() => setActiveTab('dashboard')}
                />
            )
            }
        </div >
    );
};

// Sub-component for the Guest View Demo
const GuestInterfaceDemo: React.FC<{
    invite: GuestInvite;
    onSubmit: (text: string) => void;
    onCancel: () => void;
}> = ({ invite, onSubmit, onCancel }) => {
    const [response, setResponse] = useState('');

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-slide-up">
            <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <p className="text-emerald-400 text-sm font-bold tracking-widest uppercase mb-2">PLUME • APPEL À TÉMOIN</p>
                <h2 className="text-2xl font-serif">Bonjour {invite.name} !</h2>
                <p className="text-slate-300 mt-2">
                    L'auteur de ce livre aimerait recueillir votre précieux témoignage.
                </p>
            </div>

            <div className="p-8">
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-8 relative">
                    <IconMessageCircle className="w-8 h-8 text-amber-300 absolute -top-4 -left-3 bg-white rounded-full p-1 border border-amber-100 shadow-sm" />
                    <h3 className="font-bold text-slate-800 mb-2 text-lg">La question</h3>
                    <p className="text-slate-600 italic text-lg leading-relaxed">
                        "{invite.question}"
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Votre souvenir</label>
                    <textarea
                        className="w-full h-48 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-slate-700 leading-relaxed bg-slate-50"
                        placeholder="Je me souviens..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                    ></textarea>
                    <p className="text-xs text-slate-400 mt-2 text-right">
                        Votre réponse sera envoyée directement à l'auteur.
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => onSubmit(response)}
                        disabled={!response.trim()}
                        className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <IconSend className="w-4 h-4" />
                        Envoyer mon témoignage
                    </button>
                </div>
            </div>
        </div>
    );
};
