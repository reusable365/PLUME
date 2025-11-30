
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessageToPlume, synthesizeNarrative, generateTitleAndMetadata, generateKickstarter } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { soundManager } from './services/soundManager';
import { detectGaps } from './services/analyticsService';
import { ChatMessage, PlumeResponse, Tone, Length, AppState, Idea, ViewType, User, Fidelity, PhotoCatalystResult, DigitalMemory } from './types';
import MessageBubble from './components/MessageBubble';
import IdeaChest from './components/IdeaChest';

import SouvenirGallery from './components/SouvenirGallery';
import ManuscriptView from './components/ManuscriptView';
import LandingPage from './components/LandingPage';
import ProfileModal from './components/ProfileModal';
import PlumeDashboard from './components/PlumeDashboard';
import PhotoCatalyst from './components/PhotoCatalyst';
import BoutiqueSouvenirs from './components/BoutiqueSouvenirs';
import LifeUniverse from './components/LifeUniverse';
import { DigitalMemoryImporter } from './components/DigitalMemoryImporter';
import { DigitalMemoryTimeline } from './components/DigitalMemoryTimeline';
import SupportSection from './components/SupportSection';
import { StyleSelector } from './components/StyleSelector';
import { IconMicrophone, IconStopCircle, IconSettings, IconSend, IconBook, IconFeather, IconLayout, IconLogOut, IconUser, IconClock, IconMagic, IconBookOpen, IconCheck, IconScissors, IconX, IconRefresh, IconTarget, IconSearch, IconCamera, IconUsers, IconMapPin, IconHelp, IconSun, IconMoon, IconSunset, IconEye, IconEyeOff, IconVolume2, IconVolumeX, IconMap, IconSparkles, IconShare2 } from './components/Icons';
import GuestMemoryCard from './components/GuestMemoryCard';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";

// Utility Functions for Audio Encoding/Decoding (from Google GenAI Coding Guidelines)
function createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}


// Simple Toast Notification Component
const Toast: React.FC<{ message: string; type: 'success' | 'error' }> = ({ message, type }) => (
    <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-lg shadow-xl text-white animate-fade-in ${type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
        <div className="flex items-center gap-2">
            <IconCheck className="w-5 h-5" />
            <span className="font-semibold">{message}</span>
        </div>
    </div>
);

const App: React.FC = () => {
    // --- Auth & Navigation State ---
    const [session, setSession] = useState<any>(null);
    const [currentView, setCurrentView] = useState<ViewType>('landing');
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPhotoCatalyst, setShowPhotoCatalyst] = useState(false);
    const [showSupport, setShowSupport] = useState(false);
    const [timeContext, setTimeContext] = useState<string | null>(null);
    const [showTimeContext, setShowTimeContext] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentProfilePhoto, setCurrentProfilePhoto] = useState<string | null>(null);
    const [hasWelcomedSession, setHasWelcomedSession] = useState(false);

    // --- App Logic State ---
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLeftPanel, setShowLeftPanel] = useState(true); // Left panel always visible on desktop, default open


    // Settings
    const [tone, setTone] = useState<Tone>(Tone.AUTHENTIQUE);
    const [length, setLength] = useState<Length>(Length.MOYEN);
    const [fidelity, setFidelity] = useState<Fidelity>(Fidelity.HAUTE);
    const [showSettings, setShowSettings] = useState(false);
    const [theme, setTheme] = useState<'aube' | 'crepuscule' | 'nuit'>('aube');
    const [focusMode, setFocusMode] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);

    useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);

    useEffect(() => {
        soundManager.setEnabled(soundEnabled);
    }, [soundEnabled]);

    // Regeneration State
    const [regenerationInfo, setRegenerationInfo] = useState<{ originalAssistantMessageId: string, originalUserPrompt: string } | null>(null);

    const [draftContent, setDraftContent] = useState('');
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [state, setState] = useState<AppState>({
        messages: [],
        ideas: [],
        aggregatedData: {
            dates: new Set<string>(),
            characters: new Set<string>(),
            tags: new Set<string>()
        }
    });

    // --- Digital Memory State ---
    const [digitalMemories, setDigitalMemories] = useState<DigitalMemory[]>([]);

    // --- Voice Recording State and Refs ---
    const [isRecording, setIsRecording] = useState(false);
    const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
    const currentLiveInputTranscriptionRef = useRef<string>('');
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const aiInstanceRef = useRef<GoogleGenAI | null>(null);

    const showToast = useCallback((message: string, type: 'success' | 'error', duration = 3000) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), duration);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) loadUserData(session.user);
        }).catch(err => {
            console.error("Supabase session error:", err);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                if (!userProfile || !userProfile.firstName || !userProfile.birthDate) loadUserData(session.user); // Reload if profile is incomplete
                if (currentView === 'landing') setCurrentView('dashboard');
            } else {
                setCurrentView('landing');
                setUserProfile(null);
                setState({ messages: [], ideas: [], aggregatedData: { dates: new Set(), characters: new Set(), tags: new Set() } });
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserData = async (authUser: any) => {
        if (!authUser) return;
        setIsLoading(true);

        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name, birth_date, photos')
                .eq('id', authUser.id)
                .single();

            let currentUser: User = {
                id: authUser.id,
                email: authUser.email,
                plan: 'premium',
                name: authUser.email.split('@')[0]
            };

            if (profileData && !profileError) {
                currentUser = {
                    ...currentUser,
                    firstName: profileData.first_name,
                    lastName: profileData.last_name,
                    birthDate: profileData.birth_date,
                    photos: profileData.photos || [],
                    name: profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''} `.trim() : currentUser.name
                };
                if (!profileData.first_name || !profileData.birth_date) {
                    setShowProfileModal(true);
                }
            } else {
                setShowProfileModal(true);
                console.warn("Profile not found or incomplete, showing modal.");
            }
            setUserProfile(currentUser);

            const { data: msgs, error: msgError } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
            let loadedMessages: ChatMessage[] = [];
            let initialAggregatedData = {
                dates: new Set<string>(),
                characters: new Set<string>(),
                tags: new Set<string>()
            };

            if (msgs && !msgError) {
                loadedMessages = msgs
                    .filter((m: any) => {
                        const content = m.content;
                        // Filter out archived messages
                        if (content && typeof content === 'object' && content.isArchived === true) return false;
                        return true;
                    })
                    .map((m: any) => {
                        if (m.isDivider) {
                            return { id: m.id, role: 'assistant', content: '', timestamp: new Date(m.created_at).getTime(), isDivider: true };
                        }
                        if (m.role === 'user') {
                            const userContent = typeof m.content === 'string' ? m.content : (m.content as any).text || '';
                            const userIsSynthesized = typeof m.content === 'object' && m.content !== null && (m.content as any).isSynthesized === true;
                            return { id: m.id, role: 'user', content: userContent, timestamp: new Date(m.created_at).getTime(), isSynthesized: userIsSynthesized };
                        } else {
                            const plumeResponse: PlumeResponse = m.content as PlumeResponse;
                            if (!Array.isArray(plumeResponse.questions)) plumeResponse.questions = [];
                            plumeResponse.isSynthesized = plumeResponse.isSynthesized === true;
                            plumeResponse.isDrafted = plumeResponse.isDrafted === true;

                            if (plumeResponse.data) {
                                plumeResponse.data.dates_chronologie?.forEach((d: string) => initialAggregatedData.dates.add(d));
                                plumeResponse.data.personnages_cites?.forEach((c: string) => initialAggregatedData.characters.add(c));
                                plumeResponse.data.tags_suggeres?.forEach((t: string) => initialAggregatedData.tags.add(t));
                            }
                            return { id: m.id, role: 'assistant', content: plumeResponse, timestamp: new Date(m.created_at).getTime(), isSynthesized: plumeResponse.isSynthesized };
                        }
                    });
            }

            if (loadedMessages.length === 0) {
                const welcomeMsg = { id: 'welcome', role: 'assistant', timestamp: Date.now(), content: { narrative: "Bonjour. Je suis PLUME, votre assistant biographe. Confiez-moi un souvenir, une image, ou une sensation, et nous commencerons à tisser le fil de votre histoire.", data: null, suggestion: null, questions: [{ type: 'emotion', label: '❤️ Émotion', text: "Quel sentiment prédomine quand vous y pensez ?" }, { type: 'action', label: '⚡ Action', text: "Par quel événement tout a commencé ?" }, { type: 'descriptif', label: '👁️ Sensoriel', text: "Quelle image ou odeur vous revient en premier ?" }] } as PlumeResponse };
                loadedMessages.push(welcomeMsg as ChatMessage);
            }

            const { data: ideas } = await supabase.from('ideas').select('*').order('created_at', { ascending: false });
            const mappedIdeas = ideas ? ideas.map((i: any) => {
                let title = i.title; let content = i.content; let tags = i.tags || [];
                if (!title && content && typeof content === 'string' && content.startsWith('[')) {
                    const match = content.match(/^\[(.*?)\s\|\s(.*?)\]\s+([\s\S]*)$/);
                    if (match) { title = match[1].trim(); const extractedTag = match[2].trim(); if (tags.length === 0 && extractedTag) tags = [extractedTag]; content = match[3].trim(); }
                }
                return { id: i.id, content: content, title: title, tags: tags, createdAt: new Date(i.created_at).getTime() };
            }) : [];

            try {
                const { data: drafts } = await supabase.from('chapters').select('*').eq('user_id', authUser.id).eq('status', 'draft_workspace').order('updated_at', { ascending: false }).limit(1);
                const draftData = drafts?.[0];
                if (draftData) { setDraftContent(draftData.content || ''); setWorkspaceId(draftData.id); }
            } catch (e) { console.warn("Erreur chargement brouillon", e); }

            setState({ messages: loadedMessages, ideas: mappedIdeas, aggregatedData: initialAggregatedData });
        } catch (err) {
            console.error("Critical error loading user data:", err);
            showToast("Erreur de chargement des données. Vérifiez votre connexion.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Random profile photo selection
    useEffect(() => {
        if (userProfile?.photos) {
            const profilePhotos = userProfile.photos.filter(p => p.isProfilePhoto === true);
            if (profilePhotos.length > 0) {
                const randomIndex = Math.floor(Math.random() * profilePhotos.length);
                setCurrentProfilePhoto(profilePhotos[randomIndex].url);
            } else {
                setCurrentProfilePhoto(null);
            }
        }
    }, [userProfile]);

    useEffect(() => {
        if (!session?.user) return;
        const timer = setTimeout(async () => {
            if (draftContent || workspaceId) {
                try {
                    if (workspaceId) {
                        await supabase.from('chapters').update({ content: draftContent, updated_at: new Date().toISOString() }).eq('id', workspaceId);
                    } else if (draftContent) {
                        const { data, error } = await supabase.from('chapters').insert({ user_id: session.user.id, title: 'Brouillon Atelier', content: draftContent, status: 'draft_workspace' }).select().single();
                        if (data && !error) setWorkspaceId(data.id);
                    }
                } catch (err) { console.error("Auto-save failed:", err); showToast("Erreur auto-sauvegarde du brouillon.", "error"); }
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [draftContent, session, workspaceId, showToast]);

    const handleLogout = async () => { await supabase.auth.signOut(); };
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    useEffect(() => { if (currentView === 'studio') scrollToBottom(); }, [state.messages, currentView]);

    const saveEntityToDB = async (type: string, value: string, userId: string) => {
        const { error } = await supabase.from('entities').upsert({ user_id: userId, type, value }, { onConflict: 'user_id,type,value' }).select();
        if (error) console.error("Error saving entity:", error);
    };

    const triggerSend = useCallback(async (text: string, imageUrl?: string) => {
        if (!text.trim() || isLoading || !session?.user) return;
        soundManager.playKeystroke();
        const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text, timestamp: Date.now(), imageUrl };
        const newMessages = [...state.messages, userMsg];
        setState(prev => ({ ...prev, messages: newMessages }));
        setInput(''); setIsLoading(true);
        try {
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'user', content: { text: text, isSynthesized: false }, image_url: imageUrl }); // Note: Ensure DB has image_url column or store in content JSON

            const lastDividerIndex = newMessages.map(m => m.isDivider).lastIndexOf(true);
            const relevantMessages = lastDividerIndex > -1 ? newMessages.slice(lastDividerIndex + 1) : newMessages;

            const apiHistory = relevantMessages
                .filter(m => m.id !== 'welcome' && !m.isDivider)
                .map(m => {
                    if (m.role === 'user') return { role: 'user', parts: [{ text: typeof m.content === 'string' ? m.content : (m.content as any).text || '' }] };
                    const c = m.content as PlumeResponse;
                    const questionsContext = Array.isArray(c.questions) ? c.questions.map(q => q.text).join(' | ') : '';
                    return { role: 'model', parts: [{ text: `[TEXTE_PLUME]${c.narrative} [/TEXTE_PLUME][CONTEXTE_QUESTIONS]${questionsContext} [/CONTEXTE_QUESTIONS]` }] };
                }) as { role: 'user' | 'model', parts: [{ text: string }] }[];

            const lastDraftedMsg = [...state.messages].reverse().find(m => m.role === 'assistant' && (m.content as PlumeResponse).isDrafted === true);
            let lastValidNarrative = '';
            if (lastDraftedMsg) lastValidNarrative = (lastDraftedMsg.content as PlumeResponse).narrative;
            const response = await sendMessageToPlume(text, tone, length, fidelity, apiHistory, lastValidNarrative, userProfile);
            const aiMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: response, timestamp: Date.now() };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: response });

            setState(prev => {
                const newAggregatedData = {
                    dates: new Set(prev.aggregatedData.dates),
                    characters: new Set(prev.aggregatedData.characters),
                    tags: new Set(prev.aggregatedData.tags),
                };

                if (response.data) {
                    response.data.dates_chronologie?.forEach(d => { if (d) { newAggregatedData.dates.add(d); saveEntityToDB('date', d, session.user.id); } });
                    response.data.personnages_cites?.forEach(c => { if (c) { newAggregatedData.characters.add(c); saveEntityToDB('person', c, session.user.id); } });
                    response.data.tags_suggeres?.forEach(t => { if (t) { newAggregatedData.tags.add(t); saveEntityToDB('theme', t, session.user.id); } });
                }
                const finalMessages = [...prev.messages, userMsg, aiMsg].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
                return { ...prev, messages: finalMessages, aggregatedData: newAggregatedData };
            });

        } catch (error) {
            console.error(error);
            showToast("Erreur Gemini: " + (error as Error).message, 'error');
            const errorMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: { narrative: "Une erreur de communication est survenue.", data: null, suggestion: null, questions: [{ type: 'action', label: 'Réessayer', text: "Pouvons-nous reprendre ?" }] } as PlumeResponse, timestamp: Date.now() };
            setState(prev => ({ ...prev, messages: [...prev.messages, errorMsg] }));
        } finally { setIsLoading(false); }
    }, [isLoading, session, state.messages, tone, length, fidelity, userProfile, showToast]);

    const handleSendMessage = () => {
        let textToSend = input;
        if (timeContext) {
            textToSend = `[CONTEXTE TEMPOREL: ${timeContext}] ${textToSend}`;
        }
        triggerSend(textToSend);
        setTimeContext(null);
    };

    const handleStartRecording = async () => {
        if (!process.env.API_KEY) {
            showToast("Clé API manquante pour l'enregistrement vocal.", 'error');
            return;
        }
        if (isLoading) return;

        setIsLoading(true);
        currentLiveInputTranscriptionRef.current = '';
        setInput('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            aiInstanceRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const inputAudioContext = new AudioContext({ sampleRate: 16000 });
            inputAudioContextRef.current = inputAudioContext;
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                liveSessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            liveSessionPromiseRef.current = aiInstanceRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.debug('Live session opened');
                        setIsRecording(true);
                        setIsLoading(false);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentLiveInputTranscriptionRef.current += text;
                            setInput(currentLiveInputTranscriptionRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                            const finalTranscription = currentLiveInputTranscriptionRef.current.trim();
                            if (finalTranscription) {
                                await triggerSend(finalTranscription);
                            }
                            currentLiveInputTranscriptionRef.current = '';
                            handleStopRecording();
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        showToast("Erreur d'enregistrement vocal: " + e.message, 'error');
                        handleStopRecording();
                    },
                    onclose: (e: CloseEvent) => {
                        console.debug('Live session closed');
                        setIsRecording(false);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                },
            });

        } catch (err: any) {
            console.error('Error starting recording:', err);
            showToast("Erreur d'accès au microphone. Vérifiez les permissions: " + err.message, 'error');
            setIsLoading(false);
            setIsRecording(false);
        }
    };

    const handleStopRecording = useCallback(() => {
        if (isRecording) {
            liveSessionPromiseRef.current?.then((session) => {
                session.close();
            }).catch(e => console.error("Error closing live session:", e));
            liveSessionPromiseRef.current = null;

            if (scriptProcessorRef.current) {
                scriptProcessorRef.current.disconnect();
                scriptProcessorRef.current.onaudioprocess = null;
                scriptProcessorRef.current = null;
            }
            if (inputAudioContextRef.current) {
                inputAudioContextRef.current.close().catch(e => console.error("Error closing audio context:", e));
                inputAudioContextRef.current = null;
            }

            setIsRecording(false);
            setIsLoading(false);
            showToast("Enregistrement vocal terminé.", 'success');
        }
    }, [isRecording, showToast]);

    useEffect(() => {
        return () => {
            if (isRecording) {
                handleStopRecording();
            }
        };
    }, [handleStopRecording, isRecording]);


    const handleSynthesis = async () => {
        if (isLoading || !session?.user) return;
        let cutoffTimestamp = 0;
        const lastDraftedMsg = [...state.messages].reverse().find(m => m.role === 'assistant' && (m.content as PlumeResponse).isDrafted === true);
        if (lastDraftedMsg) cutoffTimestamp = lastDraftedMsg.timestamp;
        const messagesToSynthesize = state.messages.filter(m => {
            if (m.id === 'welcome' || m.timestamp <= cutoffTimestamp) return false;
            let isDrafted = false, isSynthesized = m.isSynthesized === true;
            if (m.role === 'assistant') { const c = m.content as PlumeResponse; isDrafted = c.isDrafted === true; if (c.isSynthesized || c.isSynthesisResult) isSynthesized = true; }
            return !isDrafted && !isSynthesized;
        });
        if (messagesToSynthesize.length === 0) { showToast("Aucun nouvel échange à synthétiser.", 'error'); return; }
        setIsLoading(true);
        try {
            const historySegment = messagesToSynthesize.map(m => ({ role: m.role, content: m.role === 'user' ? (m.content as string) : (m.content as PlumeResponse).narrative }));
            const response = await synthesizeNarrative(historySegment, tone, length, fidelity);
            const aiMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: response, timestamp: Date.now() };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: response });
            const updatedMessages = state.messages.map(m => {
                if (messagesToSynthesize.find(target => target.id === m.id)) {
                    if (m.role === 'assistant') { const c = m.content as PlumeResponse; return { ...m, isSynthesized: true, content: { ...c, isSynthesized: true } }; }
                    return { ...m, isSynthesized: true };
                }
                return m;
            });
            for (const m of messagesToSynthesize) {
                let newContent: any;
                if (m.role === 'assistant') newContent = { ...(m.content as PlumeResponse), isSynthesized: true };
                else newContent = { text: m.content as string, isSynthesized: true };
                await supabase.from('messages').update({ content: newContent }).eq('id', m.id);
            }
            setState(prev => ({ ...prev, messages: [...updatedMessages, aiMsg] }));
        } catch (error) { console.error("Synthesis Failed", error); showToast("Erreur de synthèse.", 'error'); } finally { setIsLoading(false); }
    };

    const handleSelectAngle = async (messageId: string, index: number) => {
        setState(prev => ({ ...prev, messages: prev.messages.map(msg => (msg.id === messageId ? { ...msg, content: { ...(msg.content as PlumeResponse), selectedQuestionIndex: index } } : msg)) }));
        if (session?.user && messageId !== 'welcome') {
            const msgToUpdate = state.messages.find(m => m.id === messageId);
            if (msgToUpdate) await supabase.from('messages').update({ content: { ...(msgToUpdate.content as PlumeResponse), selectedQuestionIndex: index } }).eq('id', messageId);
        }
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const addIdea = async (title: string, content: string, tag: string) => {
        if (!session?.user) return;
        try {
            const { data, error } = await supabase.from('ideas').insert({ user_id: session.user.id, title, content, tags: [tag] }).select().single();
            if (error) throw error;
            if (data) {
                const newIdea: Idea = { id: data.id, title: data.title, content: data.content, tags: data.tags || [], createdAt: new Date(data.created_at).getTime() };
                setState(prev => ({ ...prev, ideas: [newIdea, ...prev.ideas] }));
                setShowLeftPanel(true);
                showToast("Idée ajoutée au coffre !", 'success');
            }
        } catch (err: any) {
            console.error("Erreur DB Idea (Insert Riche):", err);
            showToast("Erreur : Impossible d'ajouter l'idée. DB non à jour ?", 'error');
            const legacyContent = `[${title.toUpperCase()} | ${tag}] ${content} `;
            const { data: legacyData } = await supabase.from('ideas').insert({ user_id: session.user.id, content: legacyContent }).select().single();
            if (legacyData) { const newIdea: Idea = { id: legacyData.id, title, content: legacyContent, tags: [], createdAt: new Date(legacyData.created_at).getTime() }; setState(prev => ({ ...prev, ideas: [newIdea, ...prev.ideas] })); setShowLeftPanel(true); showToast("Idée ajoutée en mode compatible.", 'success'); }
        }
    };
    const manualAddIdea = async (title: string, content: string, tag: string) => await addIdea(title, content, tag);
    const deleteIdea = async (id: string) => {
        if (!session?.user) return;
        const previousIdeas = state.ideas;
        setState(prev => ({ ...prev, ideas: prev.ideas.filter(i => i.id !== id) }));
        const { error } = await supabase.from('ideas').delete().eq('id', id);
        if (error) { console.error("Erreur suppression:", error); setState(prev => ({ ...prev, ideas: previousIdeas })); showToast("Erreur : Impossible de supprimer l'idée.", 'error'); }
        else { showToast("Idée supprimée.", 'success'); }
    };
    const handleIdeaClick = (idea: Idea) => {
        const autoPrompt = `Je sélectionne cette idée de mon coffre: "${idea.title || 'Note'}".Contenu : "${idea.content}".Analyse et guide - moi.`;
        triggerSend(autoPrompt);
        if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    };
    const handleAddToDraft = async (text: string, messageId: string) => {
        setDraftContent(prev => prev + (prev ? '\n\n' : '') + text);
        setShowLeftPanel(true);
        setState(prev => ({ ...prev, messages: prev.messages.map(msg => (msg.id === messageId ? { ...msg, content: { ...(msg.content as PlumeResponse), isDrafted: true } } : msg)) }));
        if (session?.user && messageId !== 'welcome') {
            const msgToUpdate = state.messages.find(m => m.id === messageId);
            if (msgToUpdate) await supabase.from('messages').update({ content: { ...(msgToUpdate.content as PlumeResponse), isDrafted: true } }).eq('id', messageId);
        }
    };
    const handleUpdateDraft = (content: string) => setDraftContent(content);
    const handleInsertDraft = async () => {
        if (!session?.user || !draftContent.trim()) return;
        setIsLoading(true);
        try {
            // 1. Generate Title & Metadata via AI
            showToast("Analyse et titrage du souvenir...", 'success');
            const { title, dates, characters, tags } = await generateTitleAndMetadata(draftContent);

            // 2. Save Chapter with AI Title
            if (workspaceId) {
                // Update existing chapter (whether it was a draft or an existing souvenir)
                const { error } = await supabase.from('chapters').update({
                    title: title,
                    content: draftContent,
                    status: 'published',
                    metadata: {
                        dates,
                        characters,
                        tags
                    },
                    updated_at: new Date().toISOString()
                }).eq('id', workspaceId);
                if (error) throw error;
            } else {
                // Insert new chapter
                const { error } = await supabase.from('chapters').insert({
                    user_id: session.user.id,
                    title: title,
                    content: draftContent,
                    status: 'published',
                    metadata: {
                        dates,
                        characters,
                        tags
                    }
                });
                if (error) throw error;
            }

            // 3. Save Extracted Entities for Smart Filters
            const entityPromises = [
                ...dates.map(d => saveEntityToDB('date', d, session.user.id)),
                ...characters.map(c => saveEntityToDB('person', c, session.user.id)),
                ...tags.map(t => saveEntityToDB('theme', t, session.user.id))
            ];
            await Promise.all(entityPromises);

            // 4. Update Local State for Filters
            setState(prev => {
                const newDates = new Set(prev.aggregatedData.dates);
                const newCharacters = new Set(prev.aggregatedData.characters);
                const newTags = new Set(prev.aggregatedData.tags);

                dates.forEach(d => newDates.add(d));
                characters.forEach(c => newCharacters.add(c));
                tags.forEach(t => newTags.add(t));

                return {
                    ...prev,
                    aggregatedData: { dates: newDates, characters: newCharacters, tags: newTags }
                };
            });

            // 5. Archive Messages (Clear from View, Keep for Boutique)
            // We update all current messages to have isArchived: true
            // This ensures they don't show up in the active chat but remain in history/boutique
            const messagesToArchive = state.messages.filter(m => m.id !== 'welcome');
            const archivePromises = messagesToArchive.map(async (m) => {
                let newContent: any;
                if (typeof m.content === 'string') {
                    newContent = { text: m.content, isArchived: true };
                } else {
                    newContent = { ...m.content, isArchived: true };
                }
                return supabase.from('messages').update({ content: newContent }).eq('id', m.id);
            });
            await Promise.all(archivePromises);

            setDraftContent('');
            setWorkspaceId(null);

            // Reset Chat to Welcome Message only
            const welcomeMsg = {
                id: 'welcome',
                role: 'assistant',
                timestamp: Date.now(),
                content: {
                    narrative: "Souvenir gravé avec succès. Je suis prêt pour une nouvelle histoire.",
                    data: null,
                    suggestion: null,
                    questions: [
                        { type: 'action', label: 'Nouveau Souvenir', text: "De quoi voulez-vous parler maintenant ?" }
                    ]
                } as PlumeResponse
            };
            setState(prev => ({ ...prev, messages: [welcomeMsg as ChatMessage] }));

            soundManager.playSuccess();
            showToast(`Souvenir gravé: "${title}"`, 'success');

        } catch (err: any) {
            console.error("Error saving chapter:", err);
            showToast("Erreur sauvegarde : " + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSouvenirSelect = async (souvenirId: string) => {
        // Fetch from chapters table (since BoutiqueSouvenirs now lists chapters)
        const { data, error } = await supabase.from('chapters').select('*').eq('id', souvenirId).single();

        if (data) {
            setDraftContent(data.content);
            setWorkspaceId(data.id);
            setCurrentView('studio');
            setShowLeftPanel(true); // Open IdeaChest/Draft
            showToast("Chapitre chargé dans l'atelier", 'success');
        } else {
            console.error("Error loading chapter:", error);
            showToast("Erreur lors du chargement du souvenir", 'error');
        }
    };

    const handleAddManualDate = async (dateStr: string) => {
        if (!session?.user || !dateStr.trim()) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.from('entities').insert({ user_id: session.user.id, type: 'date', value: dateStr.trim() }).select().single();
            if (error) throw error;

            setState(prev => {
                const newDates = new Set(prev.aggregatedData.dates);
                newDates.add(dateStr.trim());
                return {
                    ...prev,
                    aggregatedData: { ...prev.aggregatedData, dates: newDates }
                };
            });
            showToast("Date ajoutée à la chronologie !", "success");
        } catch (error) {
            console.error("Error adding manual date:", error);
            showToast("Erreur: Impossible d'ajouter la date.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        const originalMessages = state.messages;
        setState(prev => ({ ...prev, messages: prev.messages.filter(m => m.id !== messageId) }));
        const { error } = await supabase.from('messages').delete().eq('id', messageId);
        if (error) {
            console.error("Failed to delete message:", error);
            showToast("Erreur de suppression", 'error');
            setState(prev => ({ ...prev, messages: originalMessages }));
        }
    };

    const handleInitiateRegeneration = (assistantMessageId: string) => {
        const assistantMsgIndex = state.messages.findIndex(m => m.id === assistantMessageId);
        if (assistantMsgIndex > 0) {
            // Find the last user message before this assistant message
            let lastUserMsg: ChatMessage | undefined;
            for (let i = assistantMsgIndex - 1; i >= 0; i--) {
                if (state.messages[i].role === 'user') {
                    lastUserMsg = state.messages[i];
                    break;
                }
            }

            if (lastUserMsg) {
                const userPrompt = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : (lastUserMsg.content as any).text || '';
                setRegenerationInfo({
                    originalAssistantMessageId: assistantMessageId,
                    originalUserPrompt: userPrompt,
                });
                setShowSettings(true);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            } else {
                showToast("Impossible de trouver le message utilisateur original pour régénérer.", 'error');
            }
        }
    };

    const handleConfirmRegeneration = async () => {
        if (!regenerationInfo || !session?.user) return;

        setIsLoading(true);
        const { originalAssistantMessageId, originalUserPrompt } = regenerationInfo;

        // 1. Visually remove old message
        setState(prev => ({ ...prev, messages: prev.messages.filter(m => m.id !== originalAssistantMessageId) }));

        // 2. Remove old message from DB
        await supabase.from('messages').delete().eq('id', originalAssistantMessageId);

        // 3. Reset regeneration state
        setRegenerationInfo(null);

        // 4. Call Gemini with new settings (similar to triggerSend but without adding user message)
        try {
            const lastDividerIndex = state.messages.map(m => m.isDivider).lastIndexOf(true);
            const relevantMessages = lastDividerIndex > -1 ? state.messages.slice(lastDividerIndex + 1) : state.messages;
            const apiHistory = relevantMessages
                .filter(m => m.id !== 'welcome' && !m.isDivider && m.id !== originalAssistantMessageId)
                .map(m => {
                    if (m.role === 'user') return { role: 'user', parts: [{ text: typeof m.content === 'string' ? m.content : (m.content as any).text || '' }] };
                    const c = m.content as PlumeResponse;
                    return { role: 'model', parts: [{ text: `[TEXTE_PLUME]${c.narrative} [/TEXTE_PLUME]` }] };
                }) as { role: 'user' | 'model', parts: [{ text: string }] }[];

            const response = await sendMessageToPlume(originalUserPrompt, tone, length, fidelity, apiHistory, '', userProfile);
            const aiMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: response, timestamp: Date.now() };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: response });

            setState(prev => {
                const newAggregatedData = { ...prev.aggregatedData };
                if (response.data) {
                    response.data.dates_chronologie?.forEach(d => newAggregatedData.dates.add(d));
                    response.data.personnages_cites?.forEach(c => newAggregatedData.characters.add(c));
                    response.data.tags_suggeres?.forEach(t => newAggregatedData.tags.add(t));
                }
                return { ...prev, messages: [...prev.messages, aiMsg], aggregatedData: newAggregatedData };
            });

        } catch (error) {
            console.error(error);
            showToast("Erreur durant la régénération: " + (error as Error).message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelRegeneration = () => setRegenerationInfo(null);

    const handleNewSequence = async () => {
        if (!session?.user) return;

        setIsLoading(true);

        try {
            // 1. Add divider to history (for persistence)
            const dividerMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: '', timestamp: Date.now(), isDivider: true };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: {}, isDivider: true });

            // 2. Detect narrative gaps (dark zones)
            const gaps = await detectGaps(state.messages, userProfile);
            const darkZones = gaps.map(gap => ({
                title: gap.title,
                description: gap.description,
                category: gap.icon === 'IconClock' ? 'period' : gap.icon === 'IconUsers' ? 'person' : 'theme'
            }));

            // 3. Get ideas from chest
            const ideasForKickstart = state.ideas.map(idea => ({
                id: idea.id,
                title: idea.title || 'Idée',
                content: idea.content,
                tags: idea.tags || []
            }));

            // 4. Generate AI kickstarter message
            const kickstarterResponse = await generateKickstarter(userProfile, ideasForKickstart, darkZones);

            // 5. Create AI message
            const aiMsg: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: kickstarterResponse,
                timestamp: Date.now()
            };

            // 6. Save to DB
            await supabase.from('messages').insert({
                user_id: session.user.id,
                role: 'assistant',
                content: kickstarterResponse
            });

            // 7. Update UI with divider + AI message
            setState(prev => ({ ...prev, messages: [dividerMsg, aiMsg] }));

            showToast("Nouvelle session démarrée ! Plume vous propose des pistes.", 'success');

        } catch (error) {
            console.error("Error in handleNewSequence:", error);

            // Fallback: simple divider
            const dividerMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: '', timestamp: Date.now(), isDivider: true };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: {}, isDivider: true });
            setState(prev => ({ ...prev, messages: [dividerMsg] }));

            showToast("Nouvelle session démarrée.", 'success');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoCatalystComplete = (result: PhotoCatalystResult) => {
        setShowPhotoCatalyst(false);
        // Automatically send the generated prompt to start the conversation
        triggerSend(result.generatedPrompt, result.photo.url);
        showToast("Photo analysée ! Création du souvenir en cours...", 'success');
    };

    const handleProfileComplete = (updatedUser: User) => { setUserProfile(updatedUser); setShowProfileModal(false); };
    const toggleLeftPanel = () => { setShowLeftPanel(!showLeftPanel); };

    const handleGapAction = (gap: any) => {
        setCurrentView('studio');
        const prompt = `Je souhaite explorer cette zone d'ombre identifiée : "${gap.title}". ${gap.description}. ${gap.impact}. Pose-moi une question pour m'aider à démarrer.`;
        triggerSend(prompt);
    };

    const handleDigitalMemoryImport = (memories: DigitalMemory[]) => {
        setDigitalMemories(memories);
        showToast(`${memories.length} souvenirs importés avec succès !`, 'success');
    };

    const handleRaconterDigitalMemory = (memory: DigitalMemory) => {
        setCurrentView('studio');
        setShowLeftPanel(true);

        const prompt = `[CONTEXTE_MEMOIRE_DIGITALE]
Plateforme: ${memory.platform}
Date: ${memory.date}
Lieu: ${memory.location || 'Non spécifié'}
Contenu original: "${memory.content}"
Analyse IA: ${memory.analysis?.emotion}, Thèmes: ${memory.analysis?.themes.join(', ')}
Suggestions: ${memory.analysis?.suggestedAngles.join(' | ')}
[/CONTEXTE_MEMOIRE_DIGITALE]

Je souhaite raconter ce souvenir. Aide-moi à le développer en me posant une question inspirante basée sur les suggestions.`;

        triggerSend(prompt, memory.imageUrl);
    };

    // Welcome Message Logic
    useEffect(() => {
        const generateWelcome = async () => {
            if (currentView === 'studio' && !hasWelcomedSession && session?.user && state.messages.length > 0) {
                setHasWelcomedSession(true);

                // Don't trigger if there's already a recent conversation (e.g. less than 1 hour)
                const lastMsg = state.messages[state.messages.length - 1];
                const now = Date.now();
                if (now - lastMsg.timestamp < 3600000 && lastMsg.role !== 'assistant') return;

                // Gather Context
                const gaps = await detectGaps(session.user.id, userProfile?.birthDate);
                const topGap = gaps.length > 0 ? gaps[0] : null;
                const topIdea = state.ideas.length > 0 ? state.ideas[0] : null;
                const today = new Date();
                const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const dateStr = today.toLocaleDateString('fr-FR', dateOptions);

                // Construct hidden prompt for context
                let contextPrompt = `[CONTEXTE_ACCUEIL]
Date: ${dateStr}.
`;
                if (topGap) contextPrompt += `Zone d'ombre détectée: ${topGap.title} (${topGap.description}).
`;
                if (topIdea) contextPrompt += `Idée dans le coffre: ${topIdea.title}.
`;
                contextPrompt += `Tâche: Accueille l'écrivain chaleureusement pour cette nouvelle session. Suggère une piste d'écriture en lien avec la date (saison, fêtes, événements sportifs/culturels actuels), la zone d'ombre ou l'idée du coffre. Sois inspirant et bref.
[/CONTEXTE_ACCUEIL]`;

                // We don't want this prompt to appear as a user message, so we call sendMessageToPlume directly and add the response
                try {
                    setIsLoading(true);
                    const response = await sendMessageToPlume(contextPrompt, tone, length, fidelity, [], '', userProfile);
                    const aiMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: response, timestamp: Date.now() };

                    await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: response });

                    setState(prev => ({ ...prev, messages: [...prev.messages, aiMsg] }));
                } catch (err) {
                    console.error("Error generating welcome:", err);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        generateWelcome();
    }, [currentView, hasWelcomedSession, session, userProfile, state.ideas]);

    if (!session || currentView === 'landing') return <LandingPage onLogin={() => { }} />;

    const lastAssistantMsgIndex = state.messages.map(m => m.role === 'assistant' && !m.isDivider).lastIndexOf(true);


    return (
        <div className="flex h-screen bg-paper text-ink-900 font-sans">
            {toast && <Toast message={toast.message} type={toast.type} />}
            {showProfileModal && userProfile && <ProfileModal user={userProfile} onComplete={handleProfileComplete} />}
            {showPhotoCatalyst && session?.user && (
                <PhotoCatalyst
                    userId={session.user.id}
                    userContext={{ firstName: userProfile?.firstName, birthDate: userProfile?.birthDate }}
                    onComplete={handlePhotoCatalystComplete}
                    onClose={() => setShowPhotoCatalyst(false)}
                />
            )}
            {showSupport && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSupport(false)}>
                    <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-ink-100 p-6 flex items-center justify-between">
                            <h2 className="font-serif text-2xl font-bold text-ink-900">Support & Aide</h2>
                            <button onClick={() => setShowSupport(false)} className="p-2 hover:bg-ink-100 rounded-lg transition-colors">
                                <IconX className="w-6 h-6 text-ink-400" />
                            </button>
                        </div>
                        <SupportSection />
                    </div>
                </div>
            )}
            <div className="fixed top-0 w-full h-20 bg-white/95 backdrop-blur-sm text-ink-900 z-40 flex items-center justify-between px-8 shadow-sm border-b border-ink-100">
                <div className="flex items-center gap-4">
                    <div className="bg-accent p-2 rounded-xl shadow-lg shadow-accent/20"><IconFeather className="w-6 h-6 text-white" /></div>
                    <div className="flex flex-col">
                        <span className="font-serif text-2xl font-bold tracking-tight text-ink-900">PLUME</span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-accent">Atelier d'Écriture</span>
                    </div>
                </div>
                <nav className="hidden md:flex items-center gap-2 bg-ink-50 p-1.5 rounded-xl border border-ink-100">
                    <button onClick={() => setCurrentView('studio')} className={`nav-btn ${currentView === 'studio' ? 'active' : ''}`}><IconLayout className="w-5 h-5" />Atelier</button>
                    <button onClick={() => setCurrentView('dashboard')} className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}><IconTarget className="w-5 h-5" />Tableau de Bord</button>
                    <button onClick={() => setCurrentView('boutique')} className={`nav-btn ${currentView === 'boutique' ? 'active' : ''}`}><IconSearch className="w-5 h-5" />Boutique</button>
                    <button onClick={() => setCurrentView('universe')} className={`nav-btn ${currentView === 'universe' ? 'active' : ''}`}><IconMap className="w-5 h-5" />Univers de Vie</button>
                    <button onClick={() => setCurrentView('manuscript')} className={`nav-btn ${currentView === 'manuscript' ? 'active' : ''}`}><IconBookOpen className="w-5 h-5" />Livre</button>
                    <button onClick={() => setCurrentView('gallery')} className={`nav-btn ${currentView === 'gallery' ? 'active' : ''}`}><IconUser className="w-5 h-5" />Souvenirs</button>
                    <button onClick={() => setCurrentView('digital-memory')} className={`nav-btn ${currentView === 'digital-memory' ? 'active' : ''}`}><IconSparkles className="w-5 h-5" />Mémoire Digitale</button>
                    <button onClick={() => setCurrentView('guest_prototype')} className={`nav-btn ${currentView === 'guest_prototype' ? 'active' : ''}`}><IconShare2 className="w-5 h-5" />Guest (Proto)</button>
                </nav>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center bg-ink-100 rounded-full p-1 border border-ink-200 mr-2">
                        <button onClick={() => setTheme('aube')} className={`p-1.5 rounded-full transition-all ${theme === 'aube' ? 'bg-white shadow text-accent' : 'text-ink-400 hover:text-ink-600'}`} title="Aube"><IconSun className="w-4 h-4" /></button>
                        <button onClick={() => setTheme('crepuscule')} className={`p-1.5 rounded-full transition-all ${theme === 'crepuscule' ? 'bg-white shadow text-amber-700' : 'text-ink-400 hover:text-ink-600'}`} title="Crépuscule"><IconSunset className="w-4 h-4" /></button>
                        <button onClick={() => setTheme('nuit')} className={`p-1.5 rounded-full transition-all ${theme === 'nuit' ? 'bg-ink-700 shadow text-white' : 'text-ink-400 hover:text-ink-600'}`} title="Nuit"><IconMoon className="w-4 h-4" /></button>
                    </div>
                    <button
                        onClick={() => { setSoundEnabled(!soundEnabled); soundManager.playNotification(); }}
                        className={`p-2 rounded-lg transition-all ${soundEnabled ? 'text-accent bg-accent/10' : 'text-ink-400 hover:text-ink-600 hover:bg-ink-100'}`}
                        title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
                    >
                        {soundEnabled ? <IconVolume2 className="w-5 h-5" /> : <IconVolumeX className="w-5 h-5" />}
                    </button>
                    <button onClick={() => setShowSupport(true)} className="text-ink-400 hover:text-accent transition-colors p-2 hover:bg-accent/10 rounded-lg" title="Support & Aide"><IconHelp className="w-6 h-6" /></button>
                    <button onClick={() => setShowProfileModal(true)} className="hidden md:flex items-center gap-3 cursor-pointer group hover:bg-ink-50 px-3 py-2 rounded-xl transition-colors">
                        <div className="flex flex-col items-end">
                            <span className="text-base font-semibold leading-none group-hover:text-accent transition-colors">{userProfile?.name}</span>
                            <span className="text-xs text-ink-400 uppercase tracking-wide mt-1">Auteur Premium</span>
                        </div>
                        {currentProfilePhoto ? (
                            <img src={currentProfilePhoto} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-ink-100 flex items-center justify-center text-ink-400"><IconUser className="w-6 h-6" /></div>
                        )}
                    </button>
                    <button onClick={handleLogout} className="text-ink-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg" title="Déconnexion"><IconLogOut className="w-6 h-6" /></button>
                </div>
            </div>
            <div className="md:hidden fixed bottom-0 w-full h-16 bg-white border-t border-ink-200 z-50 flex justify-around items-center text-[10px] font-medium text-ink-500">
                <button onClick={() => setCurrentView('studio')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'studio' ? 'text-accent' : ''}`}><IconLayout className="w-5 h-5" />Atelier</button>
                <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'dashboard' ? 'text-accent' : ''}`}><IconTarget className="w-5 h-5" />Tableau</button>
                <button onClick={() => setCurrentView('boutique')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'boutique' ? 'text-accent' : ''}`}><IconSearch className="w-5 h-5" />Boutique</button>
                <button onClick={() => setCurrentView('universe')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'universe' ? 'text-accent' : ''}`}><IconMap className="w-5 h-5" />Univers</button>
                <button onClick={() => setCurrentView('manuscript')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'manuscript' ? 'text-accent' : ''}`}><IconBookOpen className="w-5 h-5" />Livre</button>
                <button onClick={() => setCurrentView('gallery')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'gallery' ? 'text-accent' : ''}`}><IconUser className="w-5 h-5" />Souvenirs</button>
                <button onClick={() => setCurrentView('digital-memory')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'digital-memory' ? 'active' : ''}`}><IconSparkles className="w-5 h-5" />Mémoire</button>
                <button onClick={() => setCurrentView('guest_prototype')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'guest_prototype' ? 'text-accent' : ''}`}><IconShare2 className="w-5 h-5" />Guest</button>
            </div>
            <div className="flex flex-1 pt-20 h-full w-full overflow-y-auto">
                {currentView === 'studio' && (
                    <>
                        {!focusMode && (
                            <div className={`fixed inset-y-0 left-0 top-20 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'} ${showLeftPanel ? 'w-92 shadow-2xl' : 'w-0 md:w-0 lg:w-83'} bg-white overflow-hidden border-r border-ink-100`}>
                                <div className="h-full w-92 lg:w-83"><IdeaChest ideas={state.ideas} draftContent={draftContent} onAddIdea={manualAddIdea} onDeleteIdea={deleteIdea} onIdeaClick={handleIdeaClick} onUpdateDraft={handleUpdateDraft} onInsertDraft={handleInsertDraft} /></div>
                            </div>
                        )}
                        <div className="flex-1 flex flex-col h-full min-w-0 relative">
                            {!focusMode && (
                                <div className="md:hidden h-12 bg-white border-b border-ink-100 flex items-center justify-between px-4 shrink-0">
                                    <button onClick={toggleLeftPanel} className="p-2 text-ink-500 hover:text-ink-800"><IconBook className="w-5 h-5" /></button>
                                    <span className="font-serif font-bold text-ink-800">Chapitre en cours</span>
                                </div>
                            )}
                            <main className={`flex-1 overflow-y-auto scroll-smooth bg-gradient-to-br from-slate-50 via-amber-50/30 to-rose-50/20 ${focusMode ? 'p-8 md:p-16 pt-8' : 'p-4 md:p-8'}`}>
                                <div className={focusMode ? 'max-w-5xl mx-auto' : 'max-w-4xl mx-auto'}>
                                    <button
                                        onClick={() => setFocusMode(!focusMode)}
                                        className="fixed top-24 right-6 z-50 p-3 bg-white/90 backdrop-blur-sm border border-ink-200 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 text-ink-600 hover:text-accent group"
                                        title={focusMode ? 'Quitter le mode Focus' : 'Mode Focus'}
                                    >
                                        {focusMode ? <IconEye className="w-5 h-5" /> : <IconEyeOff className="w-5 h-5" />}
                                    </button>
                                    {state.messages.map((msg, index) => (<MessageBubble key={msg.id} message={msg} onSaveIdea={addIdea} onQuestionClick={handleSelectAngle} onAddToDraft={handleAddToDraft} onDeleteMessage={handleDeleteMessage} onInitiateRegenerate={handleInitiateRegeneration} isLastAssistantMessage={index === lastAssistantMsgIndex} />))}
                                    {isLoading && (
                                        <div className="flex justify-start mb-8">
                                            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-md border border-ink-100">
                                                <div className="bg-accent text-white p-2 rounded-full animate-feather-float">
                                                    <IconFeather className="w-5 h-5" />
                                                </div>
                                                <span className="text-ink-600 text-sm font-serif italic">Plume rédige votre histoire...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </main>
                            {!focusMode && (
                                <div className="w-full bg-white border-t border-ink-100 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20 mb-16 md:mb-0">
                                    <div className="max-w-5xl mx-auto space-y-3">
                                        {/* Settings Panel - Positioned Above Textarea */}
                                        {showSettings && (
                                            <div className="p-5 bg-white rounded-2xl border border-ink-200 shadow-lg animate-fade-in max-h-[60vh] overflow-y-auto">
                                                <StyleSelector
                                                    tone={tone}
                                                    length={length}
                                                    fidelity={fidelity}
                                                    onToneChange={setTone}
                                                    onLengthChange={setLength}
                                                    onFidelityChange={setFidelity}
                                                    isLoading={isLoading}
                                                />
                                            </div>
                                        )}

                                        {/* Settings Toggle Button */}
                                        <div className="px-1 flex justify-between items-center">
                                            <button onClick={() => setShowSettings(!showSettings)} className={`flex items-center gap-2 text-sm font-medium transition-colors px-4 py-2 rounded-full ${showSettings ? 'bg-accent/10 text-accent' : 'text-ink-500 hover:bg-ink-100'}`}><IconSettings className="w-4 h-4" /><span>Paramètres de rédaction</span></button>
                                            {isRecording && <span className="text-red-500 text-sm font-medium animate-pulse flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full"></span>Enregistrement...</span>}
                                        </div>

                                        <div className="relative group">
                                            <textarea
                                                ref={inputRef}
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                                placeholder={isRecording ? "Je vous écoute..." : regenerationInfo ? "Ajustez les paramètres et confirmez la régénération" : "Racontez-moi un souvenir..."}
                                                className="w-full bg-white border-2 border-ink-100 rounded-2xl px-8 py-4 pr-64 text-lg text-ink-800 placeholder-ink-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all resize-none min-h-[140px] max-h-[300px] font-sans shadow-sm group-hover:shadow-md"
                                                rows={3}
                                                disabled={isLoading || isRecording || !!regenerationInfo}
                                            />
                                            {regenerationInfo ? (
                                                <div className="absolute right-4 bottom-4 flex gap-2.5">
                                                    <button onClick={handleCancelRegeneration} className="p-3 rounded-xl bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors" title="Annuler"><IconX className="w-6 h-6" /></button>
                                                    <button onClick={handleConfirmRegeneration} className="p-3 rounded-xl bg-accent text-white shadow-lg hover:bg-accent-light transition-colors flex items-center gap-2 px-4 font-medium" title="Confirmer la régénération"><IconRefresh className="w-6 h-6" /><span>Régénérer</span></button>
                                                </div>
                                            ) : (
                                                <div className="absolute right-4 bottom-4 flex gap-2.5">
                                                    <button onClick={() => setShowTimeContext(!showTimeContext)} disabled={isLoading || isRecording} className={`input-btn ${timeContext ? 'text-accent bg-accent/10' : ''}`} title="Contexte Temporel"><IconClock className="w-6 h-6" /></button>
                                                    <button onClick={() => setShowPhotoCatalyst(true)} disabled={isLoading || isRecording} className="input-btn hover:bg-accent/10 hover:text-accent" title="Catalyseur Photo"><IconCamera className="w-6 h-6" /></button>
                                                    <button onClick={handleNewSequence} disabled={isLoading || isRecording} className="input-btn" title="Nouveau sujet"><IconScissors className="w-6 h-6" /></button>
                                                    <button onClick={handleSynthesis} disabled={isLoading || isRecording} className="input-btn" title="Synthèse"><IconMagic className="w-6 h-6" /></button>
                                                    {!isRecording ? (
                                                        <>
                                                            <button onClick={handleStartRecording} disabled={isLoading} className="input-btn hover:bg-red-50 hover:text-red-500" title="Dictée vocale"><IconMicrophone className="w-6 h-6" /></button>
                                                            <button onClick={handleSendMessage} disabled={!input.trim() || isLoading} className={`p-3 rounded-xl transition-all ${input.trim() && !isLoading ? 'bg-accent text-white shadow-lg hover:bg-accent-light hover:shadow-xl transform hover:-translate-y-0.5' : 'bg-ink-100 text-ink-300 cursor-not-allowed'}`} title="Envoyer"><IconSend className="w-6 h-6" /></button>
                                                        </>
                                                    ) : (
                                                        <button onClick={handleStopRecording} className="p-3 rounded-xl bg-red-500 text-white shadow-lg hover:bg-red-600 hover:shadow-xl transition-all animate-pulse flex items-center gap-2" title="Arrêter"><IconStopCircle className="w-6 h-6" /><span className="font-bold text-sm uppercase tracking-wide">Arrêter</span></button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Time Context Popover */}
                                            {showTimeContext && (
                                                <div className="absolute bottom-20 right-32 bg-white p-4 rounded-xl shadow-xl border border-ink-100 z-50 w-64 animate-fade-in">
                                                    <h3 className="font-bold text-ink-800 mb-2 text-sm">Situer ce souvenir</h3>
                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                        {['Enfance', 'Adolescence', 'Jeune Adulte', 'Adulte'].map(period => (
                                                            <button key={period} onClick={() => { setTimeContext(period); setShowTimeContext(false); }} className="px-3 py-2 bg-ink-50 hover:bg-accent/10 hover:text-accent rounded-lg text-xs transition-colors text-left font-medium">
                                                                {period}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Ou une année (ex: 1995)..."
                                                        className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm focus:border-accent outline-none"
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { setTimeContext(e.currentTarget.value); setShowTimeContext(false); } }}
                                                    />
                                                </div>
                                            )}

                                            {/* Time Context Badge */}
                                            {timeContext && (
                                                <div className="absolute -top-3 left-4 transform -translate-y-full bg-accent text-white px-3 py-1 rounded-t-lg text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
                                                    <IconClock className="w-3 h-3" />
                                                    <span>{timeContext}</span>
                                                    <button onClick={() => setTimeContext(null)} className="hover:text-white/80 ml-1"><IconX className="w-3 h-3" /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </>
                )}
                {currentView === 'dashboard' && session?.user && (<div className="w-full h-full pb-16 md:pb-0"><PlumeDashboard userId={session.user.id} userProfile={userProfile} messages={state.messages} onGapClick={handleGapAction} /></div>)}
                {currentView === 'boutique' && session?.user && (<div className="w-full h-full pb-16 md:pb-0"><BoutiqueSouvenirs userId={session.user.id} onSouvenirSelect={handleSouvenirSelect} /></div>)}
                {currentView === 'universe' && session?.user && (<div className="w-full h-full pb-16 md:pb-0"><LifeUniverse userId={session.user.id} userProfile={userProfile} messages={state.messages} /></div>)}
                {currentView === 'manuscript' && (<div className="w-full h-full pb-16 md:pb-0"><ManuscriptView userProfile={userProfile} showToast={showToast} /></div>)}
                {currentView === 'gallery' && (<div className="w-full h-full pb-16 md:pb-0"><SouvenirGallery characters={state.aggregatedData.characters} tags={state.aggregatedData.tags} photos={userProfile?.photos || []} /></div>)}
                {currentView === 'digital-memory' && (
                    <div className="w-full h-full pb-16 md:pb-0 overflow-y-auto bg-gradient-to-br from-slate-50 to-indigo-50/30 p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-8">
                                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Mémoire Digitale</h1>
                                <p className="text-slate-600">Connectez vos réseaux pour transformer vos traces numériques en récits inoubliables.</p>
                            </div>

                            {digitalMemories.length === 0 ? (
                                <div className="mt-12">
                                    <DigitalMemoryImporter onImportComplete={handleDigitalMemoryImport} />
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="font-medium text-slate-900">{digitalMemories.length}</span> souvenirs détectés
                                        </div>
                                        <button
                                            onClick={() => setDigitalMemories([])}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            Relancer l'analyse
                                        </button>
                                    </div>
                                    <DigitalMemoryTimeline
                                        memories={digitalMemories}
                                        onRaconter={handleRaconterDigitalMemory}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {currentView === 'guest_prototype' && (<div className="w-full h-full overflow-y-auto"><GuestMemoryCard /></div>)}
            </div>
            <style>{`
        .w-92 { width: 23rem; }
        .w-83 { width: 20.75rem; }
    .nav-btn { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.25rem; border-radius: 0.75rem; font-size: 1rem; font-weight: 500; transition: all 200ms ease-in-out; }
    .nav-btn.active { background-color: #fff; color: #b45309; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); font-weight: 600; }
    .nav-btn:not(.active) { color: #78716c; }
    .nav-btn:not(.active):hover { color: #292524; background-color: rgba(0, 0, 0, 0.03); }
    .settings-dropdown { background-color: #fff; border: 1px solid #e7e5e4; border-radius: 0.75rem; padding: 0.75rem 1rem; color: #292524; outline: none; transition: all 0.2s; }
    .settings-dropdown:focus { border-color: #b45309; ring: 2px solid rgba(180, 83, 9, 0.1); }
    .input-btn { padding: 0.75rem; border-radius: 0.75rem; background-color: #f5f5f4; color: #78716c; transition: all 150ms ease-in-out; }
    .input-btn:hover { color: #b45309; background-color: #e7e5e4; transform: translateY(-1px); }
    .input-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
`}</style>
        </div >
    );
};

export default App;
