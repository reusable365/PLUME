
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessageToPlume, synthesizeNarrative, generateTitleAndMetadata, generateKickstarter } from './services/geminiService';
import { supabase, supabaseConfigError } from './services/supabaseClient';
import { soundManager } from './services/soundManager';
import { logger } from './utils/logger';
import { useDebounce, DEBOUNCE_DELAYS } from './hooks/useDebounce';
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
import AddressBook from './components/AddressBook';
import { BookView } from './components/BookView';
import { DigitalMemoryImporter } from './components/DigitalMemoryImporter';
import { DigitalMemoryTimeline } from './components/DigitalMemoryTimeline';
import SupportSection from './components/SupportSection';
import { StudioView } from './components/StudioView';
import { RegenerateSettings } from './components/RegenerateModal';
import { ValidationModal, ValidationData } from './components/ValidationModal';
import { SouvenirTransitionModal } from './components/SouvenirTransitionModal';
import EntityConfirmationModal from './components/EntityConfirmationModal';
import { analyzeEntityMentions, processEntityConfirmations } from './services/entityResolutionService';
import type { EntityResolutionSuggestion, EntityConfirmation } from './types/entityResolution';
import { StyleSelector } from './components/StyleSelector';
import { IconMicrophone, IconStopCircle, IconSettings, IconSend, IconBook, IconFeather, IconLayout, IconLogOut, IconUser, IconClock, IconMagic, IconBookOpen, IconCheck, IconScissors, IconX, IconRefresh, IconTarget, IconSearch, IconCamera, IconUsers, IconMapPin, IconHelp, IconSun, IconMoon, IconSunset, IconEye, IconEyeOff, IconVolume2, IconVolumeX, IconMap, IconSparkles, IconShare2, IconCloud } from './components/Icons';
import { GuestView } from './components/GuestView';
import GuestMemoryCard from './components/GuestMemoryCard';
import ContributionReviewPanel from './components/ContributionReviewPanel';
import GuestLandingPage from './components/GuestLandingPage';
import { HelpButton } from './components/HelpButton';
import { OnboardingTour } from './components/OnboardingTour';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAIBlob } from "@google/genai";

// Utility Functions for Audio Encoding/Decoding (from Google GenAI Coding Guidelines)
function createBlob(data: Float32Array): GenAIBlob {
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


// Feature Flags - Set to true to enable features in development only
const IS_DEV_MODE = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.')
);

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
    if (supabaseConfigError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-8 text-center text-red-900 font-sans">
                <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg border border-red-200">
                    <h1 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                        ⚠️ Configuration Manquante
                    </h1>
                    <p className="mb-6 text-red-700">
                        {supabaseConfigError}
                    </p>
                    <div className="text-left bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-700 mb-6 border border-gray-200">
                        <p className="font-bold mb-2">Instructions :</p>
                        <ol className="list-decimal pl-5 space-y-1">
                            <li>Créez un fichier <code>.env.local</code> à la racine.</li>
                            <li>Ajoutez vos clés Supabase et Gemini.</li>
                            <li>Redémarrez le serveur (npm run dev).</li>
                        </ol>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
                    >
                        Réessayer
                    </button>
                    <button
                        onClick={() => {
                            // Temporary override for demo if needed
                            const key = prompt("Entrez la clé Supabase Anon (Optionnel pour démo):");
                            if (key) {
                                localStorage.setItem('plume_supabase_key', key);
                                window.location.reload();
                            }
                        }}
                        className="block mt-4 text-xs text-red-500 hover:text-red-700 underline mx-auto"
                    >
                        Configurer manuellement (Session)
                    </button>
                </div>
            </div>
        );
    }

    // --- Auth & Navigation State ---
    const [session, setSession] = useState<any>(null);
    const [currentView, setCurrentView] = useState<ViewType>('landing');
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPhotoCatalyst, setShowPhotoCatalyst] = useState(false);
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [showTransitionModal, setShowTransitionModal] = useState(false);
    const [transitionMode, setTransitionMode] = useState<'graver' | 'germer' | null>(null);
    const [suggestedTitle, setSuggestedTitle] = useState('');
    // Entity Resolution States
    const [showEntityModal, setShowEntityModal] = useState(false);
    const [entitySuggestions, setEntitySuggestions] = useState<EntityResolutionSuggestion[]>([]);
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
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Witness Contributions State
    const [showContributionsPanel, setShowContributionsPanel] = useState(false);
    const [pendingContributionsCount, setPendingContributionsCount] = useState(0);

    // Help & Onboarding State
    const [showOnboardingTour, setShowOnboardingTour] = useState(false);
    const [tourSection, setTourSection] = useState<'atelier' | 'sanctuaire' | 'dashboard' | 'univers' | 'livre' | 'repertoire' | 'all'>('all');

    const [draftContent, setDraftContent] = useState('');
    const debouncedDraftContent = useDebounce(draftContent, DEBOUNCE_DELAYS.AUTO_SAVE); // 5s debounce for auto-save
    const [draftPhotos, setDraftPhotos] = useState<string[]>([]);
    const [workspaceId, setWorkspaceId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [state, setState] = useState<AppState>({
        messages: [],
        ideas: [],
        aggregatedData: {
            dates: new Set<string>(),
            locations: new Set<string>(),
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
    const loadingInProgress = useRef<boolean>(false); // 🔒 Guard against multiple loads
    const freshSessionStarted = useRef<boolean>(false); // 🔒 Guard against reloading right after new session
    const justPublished = useRef<boolean>(false); // 🔒 Guard against auto-save race condition after publishing

    const showToast = useCallback((message: string, type: 'success' | 'error', duration = 3000) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), duration);
    }, []);

    // FIX BUG #1: Persist currentView in localStorage
    // FIX BUG #1: Persist currentView in localStorage
    useEffect(() => {
        // Check for Guest Invites (URL params)
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        const token = params.get('token');

        if (mode === 'guest' && token) {
            // Public guest mode
            setCurrentView('guest_landing');
            setGuestToken(token);
            return;
        }

        // Restore last view from localStorage on mount
        const savedView = localStorage.getItem('plume_current_view') as ViewType;
        if (savedView && savedView !== 'landing') {
            setCurrentView(savedView);
        }
    }, []);

    // Guest Token State
    const [guestToken, setGuestToken] = useState<string | null>(null);

    // FIX UX MOBILE: Gérer le viewport dynamique pour le clavier virtuel
    console.log('[DEBUG] App RENDER. View:', currentView, 'Session:', !!session, 'Token:', guestToken);

    const [isInputLoaded, setIsInputLoaded] = useState(false);

    useEffect(() => {
        // Gérer le resize du viewport (clavier mobile)
        const handleResize = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Appel initial

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Marquer comme chargé après le premier rendu pour activer les transitions
        const timer = setTimeout(() => setIsInputLoaded(true), 150);
        return () => clearTimeout(timer);
    }, []);

    // Save currentView to localStorage whenever it changes
    useEffect(() => {
        if (currentView !== 'landing') {
            localStorage.setItem('plume_current_view', currentView);
        }
    }, [currentView]);

    // Load pending contributions count for the notification badge
    useEffect(() => {
        const loadPendingContributions = async () => {
            if (!session?.user?.id) return;
            try {
                // FIX: Use guest_invites directly
                const { count, error } = await supabase
                    .from('guest_invites')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', session.user.id)
                    .eq('status', 'answered'); // Count answered invites as pending contributions

                if (!error && count !== null) {
                    setPendingContributionsCount(count);
                }
            } catch (error) {
                logger.error('Error loading pending contributions count:', error);
            }
        };

        loadPendingContributions();
    }, [session?.user?.id]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) loadUserData(session.user);
        }).catch(err => {
            logger.error("Supabase session error:", err);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                if (!userProfile || !userProfile.firstName || !userProfile.birthDate) loadUserData(session.user);

                // FIX BUG #1: Only set dashboard on initial login, not when changing tabs
                if (currentView === 'landing') {
                    // Try to restore saved view first
                    const savedView = localStorage.getItem('plume_current_view') as ViewType;
                    setCurrentView(savedView || 'dashboard');
                }
                // Otherwise, keep the current view (don't force dashboard)
            } else {
                // FIX: Don't kick out guests
                // Only redirect to landing if we are NOT in a guest view
                // We access the state directly or trust the closure because of [currentView] dep
                if (currentView !== 'guest_landing') {
                    setCurrentView('landing');
                    localStorage.removeItem('plume_current_view'); // Clear saved view on logout
                }

                setUserProfile(null);
                setState({ messages: [], ideas: [], aggregatedData: { dates: new Set(), locations: new Set(), characters: new Set(), tags: new Set() } });
            }
        });

        return () => subscription.unsubscribe();
    }, [currentView]);

    const loadUserData = async (authUser: any) => {
        // 🔒 CRITICAL: Prevent multiple simultaneous loads (React StrictMode + Supabase triggers)
        if (loadingInProgress.current) {
            logger.debug('loadUserData SKIPPED (already in progress)');
            return;
        }

        // 🔒 CRITICAL: Don't reload if we just started a fresh session
        if (freshSessionStarted.current) {
            logger.debug('loadUserData SKIPPED (fresh session just started, preventing reload)');
            // Reset the flag after skipping once
            freshSessionStarted.current = false;
            return;
        }

        loadingInProgress.current = true;
        logger.debug('loadUserData CALLED for user:', authUser?.email);
        if (!authUser) {
            loadingInProgress.current = false;
            return;
        }
        setIsLoading(true);

        try {
            console.time('⏱️ Loading profile');
            let profileData = null;
            let profileError = null;

            // 1. Try Supabase
            try {
                const result = await supabase
                    .from('profiles')
                    .select('first_name, last_name, birth_date, photos')
                    .eq('id', authUser.id)
                    .single();
                profileData = result.data;
                profileError = result.error;
            } catch (e) {
                console.warn("Supabase profile fetch failed", e);
            }
            console.timeEnd('⏱️ Loading profile');

            let currentUser: User = {
                id: authUser.id,
                email: authUser.email,
                plan: 'premium',
                subscription_status: 'premium',
                name: authUser.email.split('@')[0]
            };

            // 2. Try LocalStorage Fallback
            const localProfileStr = localStorage.getItem(`user_profile_${authUser.id}`);
            let localProfile = null;
            if (localProfileStr) {
                try {
                    localProfile = JSON.parse(localProfileStr);
                } catch (e) { logger.error("Error parsing local profile", e); }
            }

            if (profileData && !profileError) {
                currentUser = {
                    ...currentUser,
                    firstName: profileData.first_name,
                    lastName: profileData.last_name,
                    birthDate: profileData.birth_date,
                    photos: profileData.photos || [],
                    name: profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''} `.trim() : currentUser.name
                };
            } else if (localProfile) {
                logger.debug('Using local profile fallback');
                currentUser = { ...currentUser, ...localProfile };
            }

            if (!currentUser.firstName || !currentUser.birthDate) {
                setShowProfileModal(true);
            }

            setUserProfile(currentUser);

            console.time('⏱️ Loading messages');
            // CRITICAL OPTIMIZATION: Only load recent messages (last 200) to improve performance
            // We load in descending order and reverse to get the most recent session
            const { data: msgs, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200); // Only load last 200 messages instead of ALL
            console.timeEnd('⏱️ Loading messages');

            let loadedMessages: ChatMessage[] = [];
            let initialAggregatedData = {
                dates: new Set<string>(),
                locations: new Set<string>(),
                characters: new Set<string>(),
                tags: new Set<string>()
            };

            if (msgs && !msgError) {
                console.time('⏱️ Parsing messages');
                // Reverse since we loaded in descending order
                const reversedMsgs = [...msgs].reverse();

                // 1. Raw mapping & Parsing - OPTIMIZED with early filtering
                let allMessages = reversedMsgs
                    .filter((m: any) => {
                        const content = m.content;
                        if (content && typeof content === 'object' && content.isArchived === true) return false;
                        return true;
                    })
                    .map((m: any) => {
                        // Check both column-based and content-based divider flags
                        const isColumnDivider = m.isDivider || m.is_divider;
                        const isContentDivider = m.content && typeof m.content === 'object' && m.content.isDivider === true;

                        if (isColumnDivider || isContentDivider) {
                            return { id: m.id, role: 'assistant' as const, content: '', timestamp: new Date(m.created_at).getTime(), isDivider: true };
                        }
                        if (m.role === 'user') {
                            const userContent = typeof m.content === 'string' ? m.content : (m.content as any).text || '';
                            const userIsSynthesized = typeof m.content === 'object' && m.content !== null && (m.content as any).isSynthesized === true;
                            // Fallback: Check both image_url column and content.imageUrl JSON field
                            const recoveredImageUrl = m.image_url || (typeof m.content === 'object' ? (m.content as any).imageUrl : undefined);
                            return { id: m.id, role: 'user' as const, content: userContent, timestamp: new Date(m.created_at).getTime(), isSynthesized: userIsSynthesized, imageUrl: recoveredImageUrl };
                        } else {
                            const plumeResponse: PlumeResponse = m.content as PlumeResponse;
                            if (!Array.isArray(plumeResponse.questions)) plumeResponse.questions = [];
                            plumeResponse.isSynthesized = plumeResponse.isSynthesized === true;
                            plumeResponse.isDrafted = plumeResponse.isDrafted === true;
                            return { id: m.id, role: 'assistant' as const, content: plumeResponse, timestamp: new Date(m.created_at).getTime(), isSynthesized: plumeResponse.isSynthesized };
                        }
                    });

                // 2. PRD v2: Session Isolation Logic
                // We find the last divider and only keep messages AFTER it.
                // This ensures that refreshing the page doesn't load old sessions.
                const lastDividerIndex = allMessages.map((m: any) => m.isDivider).lastIndexOf(true);

                if (lastDividerIndex !== -1) {
                    // FIX BUG #2: Only keep messages AFTER the divider (exclude the divider itself)
                    loadedMessages = allMessages.slice(lastDividerIndex + 1);

                    // Additional check: If there's ONLY a divider and kickstarter in the new session,
                    // and no user messages yet, keep only the kickstarter message
                    const userMessagesAfterDivider = loadedMessages.filter(m => m.role === 'user');
                    if (userMessagesAfterDivider.length === 0 && loadedMessages.length > 0) {
                        // This is a fresh session with just the kickstarter
                        // Keep only the first assistant message (the kickstarter)
                        loadedMessages = loadedMessages.slice(0, 1);
                    }
                } else {
                    loadedMessages = allMessages;
                }

                // 3. Compute Aggregated Data (Scope: Current Session Only)
                loadedMessages.forEach((m: ChatMessage) => {
                    if (m.role === 'assistant' && !m.isDivider) {
                        const pr = m.content as PlumeResponse;
                        if (pr.data) {
                            pr.data.dates_chronologie?.forEach((d: string) => initialAggregatedData.dates.add(d));
                            pr.data.lieux_cites?.forEach((l: string) => initialAggregatedData.locations.add(l));
                            pr.data.personnages_cites?.forEach((c: string) => initialAggregatedData.characters.add(c));
                            pr.data.tags_suggeres?.forEach((t: string) => initialAggregatedData.tags.add(t));
                        }
                    }
                });

                // 4. Restore Draft Photos from Session
                const loadedPhotos = loadedMessages
                    .filter(m => m.imageUrl)
                    .map(m => m.imageUrl as string);
                setDraftPhotos(loadedPhotos);
                console.timeEnd('⏱️ Parsing messages');
            }

            if (loadedMessages.length === 0) {
                // If session is empty, we start a new one (conceptually)
                const welcomeMsg = {
                    id: 'welcome',
                    role: 'assistant',
                    timestamp: Date.now(),
                    content: {
                        narrative: "Bonjour. Je suis PLUME, votre assistant biographe. Confiez-moi un souvenir pour commencer.",
                        conversation: "Bonjour. Je suis PLUME, votre assistant biographe. Confiez-moi un souvenir, une image, ou une sensation, et nous commencerons à tisser le fil de votre histoire.",
                        data: null,
                        suggestion: null,
                        questions: [
                            { type: 'emotion', label: '❤️ Émotion', text: "Quel sentiment prédomine quand vous y pensez ?" },
                            { type: 'action', label: '⚡ Action', text: "Par quel événement tout a commencé ?" },
                            { type: 'descriptif', label: '👁️ Sensoriel', text: "Quelle image ou odeur vous revient en premier ?" }
                        ]
                    } as PlumeResponse
                };
                loadedMessages.push(welcomeMsg as ChatMessage);
            }

            console.time('⏱️ Loading ideas');
            const { data: ideas } = await supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(50); // Limit ideas too
            console.timeEnd('⏱️ Loading ideas');

            const mappedIdeas = ideas ? ideas.map((i: any) => {
                let title = i.title; let content = i.content; let tags = i.tags || [];
                if (!title && content && typeof content === 'string' && content.startsWith('[')) {
                    const match = content.match(/^\[(.*?)\s\|\s(.*?)\]\s+([\s\S]*)$/);
                    if (match) { title = match[1].trim(); const extractedTag = match[2].trim(); if (tags.length === 0 && extractedTag) tags = [extractedTag]; content = match[3].trim(); }
                }
                return { id: i.id, content: content, title: title, tags: tags, createdAt: new Date(i.created_at).getTime() };
            }) : [];

            try {
                console.time('⏱️ Loading draft');
                // 🔒 CRITICAL: Don't reload draft if we just started a fresh session
                if (!freshSessionStarted.current) {
                    const { data: drafts } = await supabase.from('chapters').select('*').eq('user_id', authUser.id).eq('status', 'draft_workspace').order('updated_at', { ascending: false }).limit(1);
                    console.timeEnd('⏱️ Loading draft');
                    const draftData = drafts?.[0];
                    if (draftData) { setDraftContent(draftData.content || ''); setWorkspaceId(draftData.id); }
                } else {
                    console.timeEnd('⏱️ Loading draft');
                    logger.debug('Draft loading skipped (fresh session)');
                }
            } catch (e) { console.warn("Erreur chargement brouillon", e); }

            logger.info('Data loaded', { messages: loadedMessages.length, ideas: mappedIdeas.length });
            setState({ messages: loadedMessages, ideas: mappedIdeas, aggregatedData: initialAggregatedData });
            logger.debug('loadUserData COMPLETE');
        } catch (err) {
            logger.error("Critical error loading user data:", err);
            showToast("Erreur de chargement des données. Vérifiez votre connexion.", 'error');
        } finally {
            setIsLoading(false);
            loadingInProgress.current = false; // 🔓 Release guard
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

    // OPTIMIZED AUTO-SAVE: Uses debounced draft content (5s delay instead of 2s)
    // FIX: Don't create new chapters during edit mode - only update existing ones
    useEffect(() => {
        if (!session?.user || !debouncedDraftContent) {
            if (!debouncedDraftContent && justPublished.current) {
                // Reset the flag once the debounce catches up to the empty state
                justPublished.current = false;
                logger.debug('Auto-save guard reset (content cleared)');
            }
            return;
        }

        // 🔒 CRITICAL FIX: Prevent ghost drafts after publishing
        if (justPublished.current) {
            logger.debug('Auto-save SKIPPED (just published)');
            return;
        }

        const saveDraft = async () => {
            try {
                if (workspaceId) {
                    // Update existing chapter (either recalled souvenir or previously created draft)
                    await supabase.from('chapters').update({ content: debouncedDraftContent, updated_at: new Date().toISOString() }).eq('id', workspaceId);
                    logger.debug('Draft auto-saved (update)');
                } else {
                    // Only create a NEW draft if this is genuinely new content (not recalled from Boutique)
                    // Check if there's already a draft_workspace for this user to avoid duplicates
                    const { data: existingDraft } = await supabase
                        .from('chapters')
                        .select('id')
                        .eq('user_id', session.user.id)
                        .eq('status', 'draft_workspace')
                        .single();

                    if (existingDraft) {
                        // Update existing draft_workspace instead of creating new one
                        await supabase.from('chapters').update({ content: debouncedDraftContent, updated_at: new Date().toISOString() }).eq('id', existingDraft.id);
                        setWorkspaceId(existingDraft.id);
                        logger.debug('Draft auto-saved (reused existing workspace)');
                    } else {
                        // Create new draft_workspace only if none exists
                        const { data, error } = await supabase.from('chapters').insert({ user_id: session.user.id, title: 'Brouillon Atelier', content: debouncedDraftContent, status: 'draft_workspace' }).select().single();
                        if (data && !error) {
                            setWorkspaceId(data.id);
                            logger.debug('Draft auto-saved (new)');
                        }
                    }
                }
            } catch (err) {
                logger.error('Auto-save failed', err);
                showToast("Erreur auto-sauvegarde du brouillon.", "error");
            }
        };

        saveDraft();
    }, [debouncedDraftContent, session, workspaceId, showToast]);

    const handleLogout = async () => { await supabase.auth.signOut(); };
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    useEffect(() => { if (currentView === 'studio') scrollToBottom(); }, [state.messages, currentView]);

    const saveEntityToDB = async (type: string, value: string, userId: string) => {
        const { error } = await supabase.from('entities').upsert({ user_id: userId, type, value }, { onConflict: 'user_id,type,value' }).select();
        if (error) logger.error("Error saving entity:", error);
    };

    const triggerSend = useCallback(async (text: string, imageUrl?: string, hiddenText?: string, isSacred?: boolean) => {
        if (!text.trim() || isLoading || !session?.user) return;
        soundManager.playKeystroke();

        const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text, timestamp: Date.now(), imageUrl };

        // Use functional update to ensure we always append to the latest state
        setState(prev => ({ ...prev, messages: [...prev.messages, userMsg] }));

        setInput('');
        setIsLoading(true);

        try {
            // Save visible text to DB
            // Store imageUrl in BOTH the dedicated column (if exists) AND the content JSON (as backup)
            await supabase.from('messages').insert({
                user_id: session.user.id,
                role: 'user',
                content: { text: text, isSynthesized: false, imageUrl: imageUrl },
                image_url: imageUrl
            });

            // 🌟 SACRED MODE: Skip AI
            if (isSacred) {
                const sacredResponse: PlumeResponse = {
                    narrative: text,
                    conversation: "C'est noté. J'ai ajouté ce passage tel quel à votre récit." + (isSacred ? " (Mode Sacré)" : ""),
                    data: null, suggestion: null, questions: [], isDrafted: false, isSynthesized: true,
                    thinking: "Mode Import détecté. Copie stricte."
                };
                const aiMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: sacredResponse, timestamp: Date.now() };
                await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: sacredResponse });

                setState(prev => ({ ...prev, messages: [...prev.messages, aiMsg] }));

                setIsLoading(false);
                return;
                return;
            }

            // Reconstruct newMessages for API history context (using current state)
            const newMessages = [...state.messages, userMsg];

            const lastDividerIndex = newMessages.map(m => m.isDivider).lastIndexOf(true);
            const relevantMessages = lastDividerIndex > -1 ? newMessages.slice(lastDividerIndex + 1) : newMessages;

            const apiHistory = relevantMessages
                .filter(m => m.id !== 'welcome' && !m.isDivider)
                .map(m => {
                    if (m.role === 'user') return { role: 'user', parts: [{ text: typeof m.content === 'string' ? m.content : (m.content as any).text || '' }] };

                    // RECONSTRUCT XML FROM PARSED CONTENT
                    const c = m.content as PlumeResponse;
                    const conversation = c.conversation ? `<CONVERSATION>${c.conversation}</CONVERSATION>` : '';
                    const narrative = c.narrative ? `<NARRATIVE>${c.narrative}</NARRATIVE>` : '';
                    // We don't necessarily need to send back Metadata/Questions in history, just the core content
                    // to save tokens and keep context focused.
                    // But if we want to be strict:
                    return { role: 'model', parts: [{ text: `${conversation}\n${narrative}` }] };
                }) as { role: 'user' | 'model', parts: [{ text: string }] }[];

            const lastDraftedMsg = [...state.messages].reverse().find(m => m.role === 'assistant' && (m.content as PlumeResponse).isDrafted === true);
            let lastValidNarrative = '';
            if (lastDraftedMsg) lastValidNarrative = (lastDraftedMsg.content as PlumeResponse).narrative;

            // Use hiddenText if provided, otherwise text
            const textToSend = hiddenText || text;
            const response = await sendMessageToPlume(textToSend, tone, length, fidelity, apiHistory, lastValidNarrative, userProfile);
            const aiMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: response, timestamp: Date.now() };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: response });

            setState(prev => {
                const newAggregatedData = {
                    dates: new Set(prev.aggregatedData.dates),
                    locations: new Set(prev.aggregatedData.locations),
                    characters: new Set(prev.aggregatedData.characters),
                    tags: new Set(prev.aggregatedData.tags),
                };

                if (response.data) {
                    response.data.dates_chronologie?.forEach(d => { if (d) { newAggregatedData.dates.add(d); saveEntityToDB('date', d, session.user.id); } });
                    response.data.lieux_cites?.forEach(l => { if (l) { newAggregatedData.locations.add(l); saveEntityToDB('place', l, session.user.id); } });
                    response.data.personnages_cites?.forEach(c => { if (c) { newAggregatedData.characters.add(c); saveEntityToDB('person', c, session.user.id); } });
                    response.data.tags_suggeres?.forEach(t => { if (t) { newAggregatedData.tags.add(t); saveEntityToDB('theme', t, session.user.id); } });
                }
                const finalMessages = [...prev.messages, userMsg, aiMsg].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
                return { ...prev, messages: finalMessages, aggregatedData: newAggregatedData };
            });

        } catch (error) {
            logger.error(error);
            showToast("Erreur Gemini: " + (error as Error).message, 'error');
            // FIX: Do NOT put error text in 'narrative', otherwise it gets auto-compiled into the book!
            const errorMsg: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: {
                    narrative: "", // Empty narrative prevents auto-compile
                    conversation: "Une erreur de communication est survenue. Veuillez réessayer.",
                    data: null,
                    suggestion: null,
                    questions: [{ type: 'action', label: 'Réessayer', text: "Pouvons-nous reprendre ?" }]
                } as PlumeResponse,
                timestamp: Date.now()
            };
            setState(prev => ({ ...prev, messages: [...prev.messages, errorMsg] }));
        } finally { setIsLoading(false); }
    }, [isLoading, session, state.messages, tone, length, fidelity, userProfile, showToast]);

    const handleSendMessage = (overrideText?: string, isSacred?: boolean) => {
        let textToSend = overrideText || input;
        if (timeContext) {
            textToSend = `[CONTEXTE TEMPOREL: ${timeContext}] ${textToSend}`;
        }
        triggerSend(textToSend, undefined, undefined, isSacred);
        setTimeContext(null);
    };

    const handleQuestionClick = async (messageId: string, questionIndex: number) => {
        setState(prev => ({
            ...prev,
            messages: prev.messages.map(m => {
                if (m.id === messageId && m.role === 'assistant') {
                    const content = m.content as PlumeResponse;
                    return {
                        ...m,
                        content: {
                            ...content,
                            selectedQuestionIndex: questionIndex
                        }
                    };
                }
                return m;
            })
        }));
        // Note: We don't auto-send anymore, we just select the question.
        // The user can then click send or edit the input.
        // If we wanted to auto-fill input:
        const msg = state.messages.find(m => m.id === messageId);
        if (msg) {
            const content = msg.content as PlumeResponse;
            if (content.questions && content.questions[questionIndex]) {
                setInput(content.questions[questionIndex].text);
            }
        }
    };

    // Regenerate a specific assistant message with new style settings
    const handleRegenerate = async (messageId: string, settings: RegenerateSettings) => {
        if (isRegenerating || !session?.user) return;

        // Find the assistant message to regenerate
        const messageIndex = state.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return;

        const targetMessage = state.messages[messageIndex];
        if (targetMessage.role !== 'assistant') return;

        // Find the corresponding user message (should be the one before)
        let userMessage: ChatMessage | null = null;
        for (let i = messageIndex - 1; i >= 0; i--) {
            if (state.messages[i].role === 'user') {
                userMessage = state.messages[i];
                break;
            }
        }

        if (!userMessage) {
            showToast("Impossible de trouver le message original.", 'error');
            return;
        }

        const userText = typeof userMessage.content === 'string'
            ? userMessage.content
            : (userMessage.content as any).text || '';

        if (!userText.trim()) {
            showToast("Le message original est vide.", 'error');
            return;
        }

        setIsRegenerating(true);

        try {
            // Map authenticity to fidelity
            const newFidelity = settings.authenticity >= 90 ? Fidelity.HAUTE : Fidelity.BASSE;

            // Build API history (messages before the one being regenerated)
            const relevantMessages = state.messages.slice(0, messageIndex).filter(m => !m.isDivider && m.id !== 'welcome');
            const apiHistory = relevantMessages.map(m => {
                if (m.role === 'user') {
                    const text = typeof m.content === 'string' ? m.content : (m.content as any).text || '';
                    return { role: 'user' as const, parts: [{ text: text as string }] as [{ text: string }] };
                } else {
                    const c = m.content as PlumeResponse;
                    const conversation = c.conversation ? `<CONVERSATION>${c.conversation}</CONVERSATION>` : '';
                    const narrative = c.narrative ? `<NARRATIVE>${c.narrative}</NARRATIVE>` : '';
                    return { role: 'model' as const, parts: [{ text: `${conversation}\n${narrative}` }] as [{ text: string }] };
                }
            }) as { role: 'user' | 'model', parts: [{ text: string }] }[];

            // Call the AI with new settings
            const response = await sendMessageToPlume(
                userText,
                settings.tone,
                settings.length,
                newFidelity,
                apiHistory,
                '',
                userProfile
            );

            // Create the new assistant message with the same ID (to replace in-place)
            const newAssistantMessage: ChatMessage = {
                ...targetMessage,
                content: response
            };

            // Update state: replace the old message with the new one
            setState(prev => ({
                ...prev,
                messages: prev.messages.map(m =>
                    m.id === messageId ? newAssistantMessage : m
                )
            }));

            // Update in database
            await supabase.from('messages').update({ content: response }).eq('id', messageId);

            // Update the draft content: find and replace the old narrative with the new one
            const oldContent = targetMessage.content as PlumeResponse;
            const oldNarrative = oldContent.narrative || '';
            const newNarrative = response.narrative || '';

            if (oldNarrative && newNarrative) {
                setDraftContent(prev => {
                    // Try to find and replace the old narrative
                    if (prev.includes(oldNarrative.trim())) {
                        return prev.replace(oldNarrative.trim(), newNarrative.trim());
                    }
                    // If not found, it might have been slightly modified, just append
                    return prev;
                });
            }

            showToast("Texte régénéré avec succès !", 'success');

        } catch (error) {
            logger.error("Regeneration failed:", error);
            showToast("Erreur lors de la régénération: " + (error as Error).message, 'error');
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleStartRecording = async () => {
        if (isLoading) return;

        // HYBRID APPROACH: Try Web Speech API first (FREE + FAST), fallback to Gemini
        // @ts-ignore - webkitSpeechRecognition exists in Chrome/Edge/Safari
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            // ✅ USE WEB SPEECH API (Native, Free, Fast)
            logger.debug('Using Web Speech API (Native)');
            const recognition = new SpeechRecognition();
            recognition.lang = 'fr-FR';
            recognition.continuous = true;
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            let finalTranscript = '';

            recognition.onstart = () => {
                setIsRecording(true);
                logger.debug('Web Speech: Recording started');
            };

            recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript + ' ';
                        logger.debug('Web Speech partial', event.results[i][0].transcript);
                    }
                }
            };

            recognition.onerror = (event) => {
                logger.error('❌ Web Speech error:', event.error);
                setIsRecording(false);
                if (event.error === 'no-speech') {
                    showToast("Aucun son détecté. Parlez plus fort ou vérifiez votre micro.", 'error');
                } else {
                    showToast("Erreur d'enregistrement: " + event.error, 'error');
                }
            };

            recognition.onend = async () => {
                setIsRecording(false);
                logger.debug('Web Speech: Recording ended');
                logger.debug('Final transcript:', finalTranscript.trim());

                if (finalTranscript.trim()) {
                    setIsLoading(true);
                    const { cleanAndOptimizeTranscription } = await import('./services/transcriptionCleanerService');
                    const cleanedText = await cleanAndOptimizeTranscription(finalTranscript.trim());
                    setInput(cleanedText);
                    showToast("✅ Transcription prête ! Vous pouvez relire et envoyer.", 'success');
                    setIsLoading(false);
                }
            };

            // Store recognition instance to stop it later
            // @ts-ignore
            window.currentRecognition = recognition;
            recognition.start();

        } else {
            // ⚠️ FALLBACK: Use Gemini Audio API for unsupported browsers
            logger.debug('Web Speech API not supported, using Gemini fallback');

            if (!process.env.GEMINI_API_KEY) {
                showToast("Clé API Gemini manquante pour l'enregistrement vocal.", 'error');
                return;
            }

            setIsLoading(true);
            currentLiveInputTranscriptionRef.current = '';
            setInput('');

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                aiInstanceRef.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
                                logger.debug('Transcription partielle:', text);
                                // MODE DICTAPHONE : On n'affiche PAS la transcription en temps réel
                                // setInput(currentLiveInputTranscriptionRef.current); ❌ SUPPRIMÉ
                            }
                            if (message.serverContent?.turnComplete) {
                                logger.debug('Transcription terminée');
                                const finalTranscription = currentLiveInputTranscriptionRef.current.trim();
                                logger.debug('Texte brut:', finalTranscription);

                                if (finalTranscription) {
                                    // Nettoie et optimise
                                    setIsLoading(true);
                                    logger.debug('Début du nettoyage...');
                                    const { cleanAndOptimizeTranscription } = await import('./services/transcriptionCleanerService');
                                    const cleanedText = await cleanAndOptimizeTranscription(finalTranscription);
                                    logger.debug('Texte nettoyé:', cleanedText);

                                    // MODE DICTAPHONE : On met le texte dans l'input, l'utilisateur valide
                                    setInput(cleanedText);
                                    logger.debug('Texte mis dans input');
                                    showToast("Transcription prête ! Vous pouvez relire et envoyer.", 'success');
                                    setIsLoading(false);

                                    // ❌ SUPPRIMÉ : await triggerSend(cleanedText);
                                } else {
                                    console.warn('⚠️ Transcription vide !');
                                }
                                currentLiveInputTranscriptionRef.current = '';
                                handleStopRecording();
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            logger.error('Live session error:', e);
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
                logger.error('Error starting recording:', err);
                showToast("Erreur d'accès au microphone. Vérifiez les permissions: " + err.message, 'error');
                setIsLoading(false);
                setIsRecording(false);
            }
        }
    };

    const handleStopRecording = useCallback(() => {
        // @ts-ignore
        if (window.currentRecognition) {
            // Stop Web Speech API
            // @ts-ignore
            window.currentRecognition.stop();
            // @ts-ignore
            window.currentRecognition = null;
        } else if (isRecording) {
            // Stop Gemini Audio API
            liveSessionPromiseRef.current?.then((session) => {
                session.close();
            }).catch(e => logger.error("Error closing live session:", e));
            liveSessionPromiseRef.current = null;

            if (scriptProcessorRef.current) {
                scriptProcessorRef.current.disconnect();
                scriptProcessorRef.current.onaudioprocess = null;
                scriptProcessorRef.current = null;
            }
            if (inputAudioContextRef.current) {
                inputAudioContextRef.current.close().catch(e => logger.error("Error closing audio context:", e));
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

        // Undo: Push current state
        if (draftContent.trim()) pushToUndoStack(draftContent);

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
        } catch (error) { logger.error("Synthesis Failed", error); showToast("Erreur de synthèse.", 'error'); } finally { setIsLoading(false); }
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
            logger.error("Erreur DB Idea (Insert Riche):", err);
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
        if (error) { logger.error("Erreur suppression:", error); setState(prev => ({ ...prev, ideas: previousIdeas })); showToast("Erreur : Impossible de supprimer l'idée.", 'error'); }
        else { showToast("Idée supprimée.", 'success'); }
    };

    const convertIdea = async (id: string) => {
        if (!session?.user) return;
        // Optimistic update: Mark as converted in local state (effectively hiding it from chest if filtered)
        // Ideally we filter state.ideas to only show active ones, OR we update status.
        // For now, let's remove it from the list to hide it, as filtering happens at query time usually.
        // But if we want to keep it in "history", we should just update status in state?
        // Let's remove it to simple "hide from chest" behavior for now, matching deleteIdea UX but preserving in DB.

        setState(prev => ({ ...prev, ideas: prev.ideas.filter(i => i.id !== id) }));

        // DB Update
        try {
            const { error } = await supabase.from('ideas').update({ status: 'converted', souvenir_id: workspaceId || undefined }).eq('id', id);
            if (error) {
                // If column doesn't exist, this will error. We should just log it for now as we can't migrate DB here.
                // If error, we might consider "hard delete" logic if we really want it gone, but let's assume V2.1 schema.
                console.warn("Soft-delete/Convert failed (Schema mismatch?), falling back to hard delete to clean up.", error);
                await supabase.from('ideas').delete().eq('id', id);
            }
        } catch (e) {
            logger.error("Conversion error", e);
        }
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
    const [undoStack, setUndoStack] = useState<string[]>([]);

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const previousContent = undoStack[undoStack.length - 1];
        setDraftContent(previousContent);
        setUndoStack(prev => prev.slice(0, -1));
        showToast("Rétablissement de la version précédente.", 'success');
    };

    const pushToUndoStack = (content: string) => {
        setUndoStack(prev => [...prev.slice(-4), content]); // Keep last 5 states
    };

    const handleUpdateDraft = (content: string) => {
        // We push state before large updates or user manual edits if needed, but for now user just requested "active des régénération".
        // React state updates are tricky for "before" state.
        // We will call pushToUndoStack inside handleSynthesis before it updates state.
        setDraftContent(content);
    };


    const handleValidationConfirm = async (data: ValidationData) => {
        setIsLoading(true);

        // Determine status based on transition mode
        const saveStatus = transitionMode === 'germer' ? 'draft' : 'published';

        try {
            // DEBUG: Log workspaceId to understand update vs insert decision
            logger.debug('handleValidationConfirm - workspaceId:', workspaceId);
            logger.debug('handleValidationConfirm - saveStatus:', saveStatus);

            // Save Chapter with Validated Data
            if (workspaceId) {
                logger.info(`UPDATING existing chapter: ${workspaceId}`);
                const { error } = await supabase.from('chapters').update({
                    title: data.title,
                    content: data.content,
                    status: saveStatus,
                    image_url: draftPhotos[0] || null,
                    metadata: {
                        dates: data.metadata.dates,
                        locations: data.metadata.locations,
                        characters: data.metadata.people,
                        tags: data.metadata.tags,
                        photos: draftPhotos
                    },
                    updated_at: new Date().toISOString()
                }).eq('id', workspaceId);
                if (error) throw error;
            } else {
                logger.info('INSERTING new chapter (workspaceId is null)');
                const { error } = await supabase.from('chapters').insert({
                    user_id: session.user.id,
                    title: data.title,
                    content: data.content,
                    status: saveStatus,
                    image_url: draftPhotos[0] || null,
                    metadata: {
                        dates: data.metadata.dates,
                        locations: data.metadata.locations,
                        characters: data.metadata.people,
                        tags: data.metadata.tags,
                        photos: draftPhotos
                    }
                });
                if (error) throw error;
            }

            // Save Extracted Entities
            const entityPromises = [
                ...data.metadata.dates.map(d => saveEntityToDB('date', d, session.user.id)),
                ...data.metadata.locations.map(l => saveEntityToDB('place', l, session.user.id)),
                ...data.metadata.people.map(c => saveEntityToDB('person', c, session.user.id)),
                ...data.metadata.tags.map(t => saveEntityToDB('theme', t, session.user.id))
            ];
            await Promise.all(entityPromises);

            // Update Local State
            setState(prev => {
                const newDates = new Set(prev.aggregatedData.dates);
                const newLocations = new Set(prev.aggregatedData.locations);
                const newCharacters = new Set(prev.aggregatedData.characters);
                const newTags = new Set(prev.aggregatedData.tags);

                data.metadata.dates.forEach(d => newDates.add(d));
                data.metadata.locations.forEach(l => newLocations.add(l));
                data.metadata.people.forEach(c => newCharacters.add(c));
                data.metadata.tags.forEach(t => newTags.add(t));

                return {
                    ...prev,
                    aggregatedData: { dates: newDates, locations: newLocations, characters: newCharacters, tags: newTags }
                };
            });

            // Archive Messages
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

            // Cleanup Ghost Drafts: Ensure no other 'draft_workspace' remains for this user
            // This prevents "Zombie" drafts from appearing on next reload.
            await supabase.from('chapters')
                .update({ status: 'draft' }) // Archive them as normal drafts
                .eq('user_id', session.user.id)
                .eq('status', 'draft_workspace')
                .neq('id', workspaceId || '00000000-0000-0000-0000-000000000000');

            setDraftContent('');
            justPublished.current = true; // 🔒 Lock auto-save to prevent ghost draft
            setWorkspaceId(null);
            setShowValidationModal(false);
            setSuggestedTitle('');

            // --- SMART WELCOME (Re-engagement) ---
            // Instead of a static message, we generate a fresh kickstarter context.

            // 1. Add divider
            const dividerMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: '', timestamp: Date.now(), isDivider: true };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: {}, is_divider: true });

            // 2. Context Analysis (Gaps & Ideas)
            const gaps = await detectGaps(session.user.id, userProfile?.birthDate);
            const darkZones = gaps.map(gap => ({
                title: gap.title,
                description: gap.description,
                category: gap.icon === 'IconClock' ? 'period' : gap.icon === 'IconUsers' ? 'person' : 'theme'
            }));
            const ideasForKickstart = state.ideas.map(idea => ({
                id: idea.id,
                title: idea.title || 'Idée',
                content: idea.content,
                tags: idea.tags || []
            }));

            // 3. Generate AI Kickstarter
            // We tell the AI we just finished a memory to adapt the tone.
            const kickstarterResponse = await generateKickstarter(userProfile, ideasForKickstart, darkZones);

            // Override the default "Welcome" conversation to acknowledge the success
            if (kickstarterResponse.conversation && !kickstarterResponse.conversation.startsWith("Bravo")) {
                kickstarterResponse.conversation = `C'est gravé ! ${kickstarterResponse.conversation}`;
            }

            const aiMsg: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: kickstarterResponse,
                timestamp: Date.now()
            };

            await supabase.from('messages').insert({
                user_id: session.user.id,
                role: 'assistant',
                content: kickstarterResponse
            });

            setState(prev => ({
                ...prev,
                messages: [dividerMsg, aiMsg],
                aggregatedData: {
                    dates: new Set<string>(),
                    locations: new Set<string>(),
                    characters: new Set<string>(),
                    tags: new Set<string>()
                }
            }));

            soundManager.playSuccess();
            showToast(`Souvenir gravé: "${data.title}"`, 'success');
            setDraftPhotos([]); // Clear photos after saving souvenir

        } catch (err: any) {
            logger.error("Error saving chapter:", err);
            showToast("Erreur sauvegarde : " + err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInsertDraft = async () => {
        if (!session?.user || !draftContent.trim()) return;

        // Generate title automatically
        setIsLoading(true);
        try {
            const { generateSouvenirTitle } = await import('./services/geminiService');
            const autoTitle = await generateSouvenirTitle(draftContent, {
                dates: Array.from(state.aggregatedData.dates),
                locations: Array.from(state.aggregatedData.locations),
                people: Array.from(state.aggregatedData.characters),
                tags: Array.from(state.aggregatedData.tags)
            });
            setSuggestedTitle(autoTitle);
        } catch (error) {
            logger.error('Error generating title:', error);
            // Fallback intelligent : utiliser la première phrase du contenu
            const firstSentence = draftContent.split(/[.!?]/)[0].trim();
            const fallbackTitle = firstSentence.substring(0, 50) || 'Mon Souvenir';
            setSuggestedTitle(fallbackTitle);
        } finally {
            setIsLoading(false);
        }

        // ENTITY RESOLUTION: Analyze before opening ValidationModal
        await analyzeEntitiesBeforeGraver();
    };

    // Entity Resolution: Analyze narrative for person mentions
    const analyzeEntitiesBeforeGraver = async () => {
        if (!session?.user) {
            setShowValidationModal(true);
            return;
        }

        try {
            // Get the latest narrative from messages
            const lastMessage = state.messages[state.messages.length - 1];
            if (!lastMessage || lastMessage.role !== 'assistant') {
                setShowValidationModal(true);
                return;
            }

            const narrative = typeof lastMessage.content === 'string'
                ? lastMessage.content
                : (lastMessage.content as PlumeResponse).narrative;

            if (!narrative || narrative.length < 50) {
                // Too short to analyze
                setShowValidationModal(true);
                return;
            }

            // Analyze entities
            const suggestions = await analyzeEntityMentions(narrative, session.user.id);

            if (suggestions.length > 0) {
                // Show entity confirmation modal first
                setEntitySuggestions(suggestions);
                setShowEntityModal(true);
            } else {
                // No entities detected, proceed to validation
                setShowValidationModal(true);
            }
        } catch (error) {
            logger.error('Entity analysis failed:', error);
            // Continue to validation modal even if entity analysis fails
            setShowValidationModal(true);
        }
    };

    // Entity Resolution: Handle user confirmations
    const handleEntityConfirmation = async (confirmations: EntityConfirmation[]) => {
        try {
            const lastMessageId = state.messages[state.messages.length - 1]?.id;
            await processEntityConfirmations(
                confirmations,
                session!.user.id,
                lastMessageId
            );
            setShowEntityModal(false);
            setShowValidationModal(true);
        } catch (error) {
            logger.error('Error processing entity confirmations:', error);
            showToast('Erreur lors de la sauvegarde des personnes', 'error');
            // Still proceed to validation
            setShowEntityModal(false);
            setShowValidationModal(true);
        }
    };

    // Entity Resolution: Skip entity confirmation
    const handleEntitySkip = () => {
        setShowEntityModal(false);
        setShowValidationModal(true);
    };


    const handleSouvenirSelect = async (souvenirId: string) => {
        // Fetch from chapters table
        const { data, error } = await supabase.from('chapters').select('*').eq('id', souvenirId).single();

        if (data) {
            setDraftContent(data.content || '');
            setWorkspaceId(data.id);
            setCurrentView('studio');
            setShowLeftPanel(true);

            // PRD v2: Session Reset & Contextuation
            // 1. Reset Chat State (Clear previous conversation)
            setState(prev => ({
                ...prev,
                messages: []
            }));

            // 2. Start new editing session with AI Context
            setIsLoading(true);
            try {
                // Construct a system-like prompt to orient the AI
                const editPrompt = `[MODE ÉDITION ACTIVÉ]
L'auteur souhaite modifier ou compléter le souvenir intitulé : "${data.title}".
Contenu actuel : "${(data.content || '').substring(0, 200)}..."

TA MISSION :
Accueille l'auteur et demande-lui ce qu'il souhaite modifier. 
Sois bref et professionnel.`;

                // We send this directly to getting a "Welcome to Edit Mode" response
                const response = await sendMessageToPlume(editPrompt, tone, length, fidelity, [], data.content, userProfile);

                const aiMsg: ChatMessage = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: response,
                    timestamp: Date.now()
                };

                // Insert into DB as a new session start
                await supabase.from('messages').insert({
                    user_id: session.user.id,
                    role: 'assistant',
                    content: response,
                    is_divider: true // Mark this as a new session start in DB
                });

                setState(prev => ({ ...prev, messages: [aiMsg] }));
                showToast("Mode édition activé", 'success');

            } catch (err) {
                logger.error("Error starting edit session:", err);
                // Fallback UI
                setState(prev => ({
                    ...prev,
                    messages: [{
                        id: uuidv4(),
                        role: 'assistant',
                        content: {
                            narrative: '',
                            conversation: `Je suis prêt à modifier "${data.title}" avec vous. Que souhaitez-vous changer ?`,
                            data: null,
                            suggestion: null,
                            questions: []
                        } as PlumeResponse,
                        timestamp: Date.now()
                    }]
                }));
            } finally {
                setIsLoading(false);
            }

        } else {
            logger.error("Error loading chapter:", error);
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
            logger.error("Error adding manual date:", error);
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
            logger.error("Failed to delete message:", error);
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
            logger.error(error);
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
            // 0. Auto-save current draft if exists
            // 0. Auto-save current draft if exists AND ARCHIVE IT
            if (draftContent.trim()) {
                if (workspaceId) {
                    await supabase.from('chapters').update({
                        content: draftContent,
                        status: 'draft', // <--- CRITICAL FIX: Archive it so it's no longer the active workspace
                        updated_at: new Date().toISOString()
                    }).eq('id', workspaceId);
                } else {
                    await supabase.from('chapters').insert({
                        user_id: session.user.id,
                        title: "Brouillon auto - " + new Date().toLocaleTimeString(),
                        content: draftContent,
                        status: 'draft',
                        metadata: {
                            dates: Array.from(state.aggregatedData.dates),
                            locations: Array.from(state.aggregatedData.locations),
                            characters: Array.from(state.aggregatedData.characters),
                            tags: Array.from(state.aggregatedData.tags)
                        }
                    });
                }
                showToast("Brouillon précédent archivé.", 'success');
            }

            // 0.5 ARCHIVE OLD MESSAGES (Fix persistence issue)
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

            // Double Check: Ensure no other 'draft_workspace' status remains
            if (session?.user) {
                await supabase.from('chapters').update({ status: 'draft' }).eq('user_id', session.user.id).eq('status', 'draft_workspace');
            }

            // Reset workspace for new sequence
            setDraftContent('');
            setDraftPhotos([]); // Clear photos from previous draft
            setWorkspaceId(null);
            lastCompiledMessageIdRef.current = null;

            // 1. Add divider to history (for persistence)
            const dividerMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: '', timestamp: Date.now(), isDivider: true };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: {}, is_divider: true });

            // 2. Detect narrative gaps (dark zones)
            const gaps = await detectGaps(session.user.id, userProfile?.birthDate);
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

            // 7. Update UI with divider + AI message + RESET aggregatedData
            setState(prev => ({
                ...prev,
                messages: [dividerMsg, aiMsg],
                aggregatedData: {
                    dates: new Set<string>(),
                    locations: new Set<string>(),
                    characters: new Set<string>(),
                    tags: new Set<string>()
                }
            }));

            showToast("Nouvelle session démarrée ! Plume vous propose des pistes.", 'success');

        } catch (error) {
            logger.error("Error in handleNewSequence:", error);

            // Fallback: simple divider
            const dividerMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: '', timestamp: Date.now(), isDivider: true };
            await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: {}, is_divider: true });
            setState(prev => ({ ...prev, messages: [dividerMsg] }));

            showToast("Nouvelle session démarrée.", 'success');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoCatalystComplete = (result: PhotoCatalystResult) => {
        setShowPhotoCatalyst(false);
        // Automatically send the generated prompt to start the conversation
        // Display a clean message to the user, send the full prompt to AI
        const displayMessage = `Je souhaite explorer ce souvenir sous l'angle : ${result.selectedAngle === 'emotion' ? 'ÉMOTION' : result.selectedAngle === 'action' ? 'ACTION' : 'SENSORIEL'}.`;
        triggerSend(displayMessage, result.photo.url, result.generatedPrompt);
        setDraftPhotos(prev => [...prev, result.photo.url]);
        showToast("Photo analysée ! Création du souvenir en cours...", 'success');
    };

    const handleProfileComplete = (updatedUser: User) => { setUserProfile(updatedUser); setShowProfileModal(false); };
    const toggleLeftPanel = () => { setShowLeftPanel(!showLeftPanel); };

    const handleGapAction = (gap: any) => {
        setCurrentView('studio');
        setDraftPhotos([]); // Start fresh for this new exploration
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
        setDraftPhotos([]); // Start fresh for this new memory

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
                    logger.error("Error generating welcome:", err);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        generateWelcome();
    }, [currentView, hasWelcomedSession, session, userProfile, state.ideas]);

    const lastCompiledMessageIdRef = useRef<string | null>(null);

    const handleAutoCompile = async (msgs: ChatMessage[]) => {
        if (msgs.length === 0) return;

        const lastMsg = msgs[msgs.length - 1];

        // Only process assistant messages
        if (lastMsg.role !== 'assistant') return;

        // CRITICAL FIX: Ignore Welcome Messages or System Messages
        // We only compile if the assistant is responding to a USER message.
        // If the previous message is not from the user (e.g. it's a divider or null), skip it.
        const previousMsg = msgs.length > 1 ? msgs[msgs.length - 2] : null;
        if (!previousMsg || previousMsg.role !== 'user') return;

        // Avoid processing the same message twice
        if (lastMsg.id === lastCompiledMessageIdRef.current) return;

        // Skip dividers or messages without narrative
        if (lastMsg.isDivider) return;
        const content = lastMsg.content as PlumeResponse;
        if (!content || !content.narrative) return;

        setDraftContent(prev => {
            const normalizedDraft = prev.trim();
            const normalizedNarrative = content.narrative.trim();

            if (normalizedDraft.endsWith(normalizedNarrative)) {
                return prev;
            }

            const separator = normalizedDraft ? '\n\n' : '';
            return prev + separator + content.narrative;
        });

        // Mark as processed
        lastCompiledMessageIdRef.current = lastMsg.id;
    };

    // Trigger Auto-Compile when messages change
    useEffect(() => {
        if (currentView === 'studio' && state.messages.length > 0) {
            handleAutoCompile(state.messages);
        }
    }, [state.messages, currentView]);

    // FIX: Handle Guest Landing View specifically before session check
    if (currentView === 'guest_landing' && guestToken) {
        return (
            <GuestLandingPage
                token={guestToken}
                onComplete={() => {
                    setCurrentView('landing');
                    setGuestToken(null);
                    window.history.pushState({}, '', '/');
                }}
                onLogin={() => setCurrentView('landing')} // Fallback to normal login
            />
        );
    }

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

            {/* Entity Resolution Modal - Shows BEFORE ValidationModal */}
            {showEntityModal && (
                <EntityConfirmationModal
                    suggestions={entitySuggestions}
                    onConfirm={handleEntityConfirmation}
                    onSkip={handleEntitySkip}
                />
            )}

            {/* Souvenir Transition Modal - Shows when starting a new memory */}
            {showTransitionModal && (
                <SouvenirTransitionModal
                    isOpen={showTransitionModal}
                    onClose={() => setShowTransitionModal(false)}
                    onGraver={() => {
                        setShowTransitionModal(false);
                        setTransitionMode('graver');
                        setShowValidationModal(true);
                    }}
                    onLaisserGermer={() => {
                        setShowTransitionModal(false);
                        setTransitionMode('germer');
                        setShowValidationModal(true);
                    }}
                    onAbandonner={async () => {
                        setShowTransitionModal(false);
                        setIsLoading(true);

                        try {
                            // 1. Mark ALL existing active workspaces as archived in DB so none reload
                            // This prevents falling back to an older "draft_workspace" if we only archive the current ID
                            if (session?.user) {
                                const { error } = await supabase
                                    .from('chapters')
                                    .update({ status: 'archived', updated_at: new Date().toISOString() })
                                    .eq('user_id', session.user.id)
                                    .eq('status', 'draft_workspace'); // Target all active drafts

                                if (error) {
                                    logger.error('Error abandoning chapters:', error);
                                } else {
                                    logger.debug(`All active workspaces for user marked as archived`);
                                }
                            }

                            // 2. Archive without saving messages (except divider), then start new session
                            if (session?.user) {
                                const { error: dividerError } = await supabase.from('messages').insert({
                                    user_id: session.user.id,
                                    role: 'assistant',
                                    content: { isDivider: true } // Store divider flag in content
                                });
                                if (dividerError) {
                                    logger.error('Error inserting divider:', dividerError);
                                    showToast("Erreur lors de la création du séparateur", 'error');
                                }
                            }

                            // Generate contextual welcome message
                            const { data: freshIdeas } = await supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(5);
                            const gaps = await detectGaps(session?.user?.id || '', userProfile?.birthDate);

                            const kickstarterResponse = await generateKickstarter(
                                userProfile,
                                freshIdeas || [],
                                gaps
                            );

                            const welcomeMsg: ChatMessage = {
                                id: uuidv4(),
                                role: 'assistant',
                                timestamp: Date.now() + 1,
                                content: kickstarterResponse
                            };

                            // Save welcome message to DB
                            if (session?.user) {
                                const { error: msgError } = await supabase.from('messages').insert({
                                    user_id: session.user.id,
                                    role: 'assistant',
                                    content: welcomeMsg.content
                                });
                                if (msgError) {
                                    logger.error('Error inserting kickstarter message:', msgError);
                                    showToast("Erreur lors de la sauvegarde du message de bienvenue", 'error');
                                }
                            }

                            setState(prev => ({
                                ...prev,
                                messages: [welcomeMsg],
                                aggregatedData: {
                                    dates: new Set<string>(),
                                    locations: new Set<string>(),
                                    characters: new Set<string>(),
                                    tags: new Set<string>()
                                }
                            }));
                            setDraftContent('');
                            // CRITICAL: Clear workspace ID so we don't keep updating the abandoned one
                            setWorkspaceId(null);
                            setDraftPhotos([]);
                            // 🔒 CRITICAL: Prevent loadUserData from overwriting our fresh session
                            freshSessionStarted.current = true;
                            showToast("Nouveau souvenir commencé ✨", 'success');
                        } catch (error) {
                            console.error("Error starting new session:", error);
                            showToast("Erreur lors du démarrage", 'error');
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    hasContent={state.messages.filter(m => m.role === 'user' && !m.isDivider).length > 0}
                    suggestedTitle={suggestedTitle || "Souvenir en cours"}
                    contentPreview={draftContent.substring(0, 150)}
                />
            )}

            {showValidationModal && (
                <ValidationModal
                    isOpen={showValidationModal}
                    onClose={() => { setShowValidationModal(false); setSuggestedTitle(''); }}
                    onConfirm={handleValidationConfirm}
                    initialData={{
                        title: suggestedTitle, // Auto-generated title
                        content: draftContent,
                        maturityScore: (() => {
                            // Calcul du vrai score de maturité
                            const dates = state.aggregatedData.dates.size;
                            const characters = state.aggregatedData.characters.size;
                            const locations = state.aggregatedData.locations.size;
                            const userMessages = state.messages.filter(m => m.role === 'user' && !m.isDivider).length;
                            const wordCount = draftContent.trim().split(/\s+/).filter(w => w.length > 0).length;

                            let metadata = 0;
                            if (dates > 0) metadata += 20;
                            if (characters > 0) metadata += 20;
                            if (locations > 0) metadata += 20;

                            let volume = 0;
                            if (userMessages >= 5 || wordCount >= 300) volume = 20;
                            else if (userMessages >= 3 || wordCount >= 150) volume = 10;

                            const emotionKeywords = /joie|peur|nostalgie|odeur|couleur|souvenir|émotion|sentiment|ressent|heureux|triste|boulevers|touch|ému/i;
                            const emotion = emotionKeywords.test(draftContent) ? 20 : 0;

                            const total = metadata + volume + emotion;
                            return {
                                total,
                                status: (total >= 80 ? 'pret' : total >= 40 ? 'en_cours' : 'germination') as 'pret' | 'en_cours' | 'germination',
                                feedback: [],
                                breakdown: {
                                    metadata,
                                    volume,
                                    emotion
                                }
                            };
                        })(),
                        dates: Array.from(state.aggregatedData.dates).filter(d => draftContent.toLowerCase().includes(d.toLowerCase())),
                        locations: Array.from(state.aggregatedData.locations).filter(l => draftContent.toLowerCase().includes(l.toLowerCase())),
                        people: Array.from(state.aggregatedData.characters).filter(p => {
                            // Check if any significant part of the name appears in the text
                            // This handles "Maman" vs "Jeanne" if mapped, but at least removes "Neil Armstrong" from "Toscane"
                            const parts = p.toLowerCase().split(' ').filter(part => part.length > 2);
                            if (parts.length === 0) return draftContent.toLowerCase().includes(p.toLowerCase());
                            return parts.some(part => draftContent.toLowerCase().includes(part));
                        }),
                        tags: Array.from(state.aggregatedData.tags)
                    }}
                    isLoading={isLoading}
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
                    <button onClick={() => setCurrentView('studio')} className={`nav-btn ${currentView === 'studio' ? 'active' : ''}`}><IconLayout className="w-5 h-5" />L'Atelier des Souvenirs</button>
                    <button onClick={() => setCurrentView('dashboard')} className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}><IconTarget className="w-5 h-5" />Tableau de Bord</button>
                    <button onClick={() => setCurrentView('boutique')} className={`nav-btn ${currentView === 'boutique' ? 'active' : ''}`}><IconSearch className="w-5 h-5" />La Boutique des Souvenirs</button>
                    {IS_DEV_MODE && <button onClick={() => setCurrentView('digital-memory')} className={`nav-btn ${currentView === 'digital-memory' ? 'active' : ''}`}><IconCloud className="w-5 h-5" />Mémoire Digitale</button>}
                    <button onClick={() => setCurrentView('universe')} className={`nav-btn ${currentView === 'universe' ? 'active' : ''}`}><IconMap className="w-5 h-5" />Univers de Vie</button>
                    <button onClick={() => setCurrentView('address-book')} className={`nav-btn ${currentView === 'address-book' ? 'active' : ''}`}><IconUsers className="w-5 h-5" />Carnet d'Adresses</button>
                    <button onClick={() => setCurrentView('manuscript')} className={`nav-btn ${currentView === 'manuscript' ? 'active' : ''}`}><IconBookOpen className="w-5 h-5" />Livre</button>
                    <button onClick={() => setCurrentView('guest_view')} className={`nav-btn ${currentView === 'guest_view' ? 'active' : ''}`}><IconUsers className="w-5 h-5" />Appel à Témoins</button>
                </nav>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => { setSoundEnabled(!soundEnabled); soundManager.playNotification(); }}
                        className={`p-2 rounded-lg transition-all ${soundEnabled ? 'text-accent bg-accent/10' : 'text-ink-400 hover:text-ink-600 hover:bg-ink-100'}`}
                        title={soundEnabled ? 'Désactiver les sons' : 'Activer les sons'}
                    >
                        {soundEnabled ? <IconVolume2 className="w-5 h-5" /> : <IconVolumeX className="w-5 h-5" />}
                    </button>
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
                <button onClick={() => setCurrentView('address-book')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'address-book' ? 'text-accent' : ''}`}><IconUsers className="w-5 h-5" />Acteurs</button>
                <button onClick={() => setCurrentView('manuscript')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'manuscript' ? 'text-accent' : ''}`}><IconBookOpen className="w-5 h-5" />Livre</button>
                <button onClick={() => setCurrentView('guest_view')} className={`flex flex-col items-center gap-1 p-2 ${currentView === 'guest_view' ? 'text-accent' : ''}`}><IconUsers className="w-5 h-5" />Témoins</button>
            </div>
            <div className="flex flex-1 pt-20 h-full w-full overflow-y-auto">
                {currentView === 'studio' && (
                    <StudioView
                        user={session?.user}
                        userProfile={userProfile}
                        tone={tone}
                        length={length}
                        fidelity={fidelity}
                        setTone={setTone}
                        setLength={setLength}
                        setFidelity={setFidelity}
                        ideas={state.ideas}
                        onAddIdea={manualAddIdea}
                        onDeleteIdea={deleteIdea}
                        onConvertIdea={convertIdea}
                        draftContent={draftContent}
                        setDraftContent={setDraftContent}
                        onInsertDraft={handleInsertDraft}
                        compiledText={draftContent}
                        isCompiling={false}
                        onCompilationEdit={handleUpdateDraft}
                        onCompilationRefresh={handleSynthesis}
                        autoCompile={handleAutoCompile}
                        aggregatedData={state.aggregatedData}
                        // Photo props
                        draftPhotos={draftPhotos}
                        onRemovePhoto={(index) => setDraftPhotos(prev => prev.filter((_, i) => i !== index))}
                        sessionMessages={state.messages}
                        isSending={isLoading}
                        onSendMessage={async (text, isSacred) => { handleSendMessage(text, isSacred); return Promise.resolve(); }}
                        onUndo={handleUndo}
                        canUndo={undoStack.length > 0}
                        onQuestionClick={async (id, index) => { await handleQuestionClick(id, index); }}
                        onInsertDivider={async (label) => {
                            // If no label is provided, this is a "New Memory" request
                            if (!label) {
                                // Check if there's user content in the current session
                                const hasUserContent = state.messages.filter(m => m.role === 'user' && !m.isDivider).length > 0;

                                if (hasUserContent) {
                                    // Show transition modal to let user choose what to do
                                    setShowTransitionModal(true);
                                } else {
                                    // No content - start fresh session
                                    // 1. Insert divider to DB to mark end of previous session
                                    const { error: dividerError } = await supabase.from('messages').insert({
                                        user_id: session.user.id,
                                        role: 'assistant',
                                        content: { isDivider: true } // Store divider flag in content
                                    });
                                    if (dividerError) {
                                        logger.error('Error inserting divider (nouveau souvenir):', dividerError);
                                        showToast("Erreur lors de la création du séparateur", 'error');
                                        return; // Stop if divider insertion fails
                                    }

                                    // 2. Reset ALL session state - THIS IS CRITICAL
                                    setWorkspaceId(null);
                                    setDraftContent('');
                                    setDraftPhotos([]);
                                    setState(prev => ({
                                        ...prev,
                                        messages: [], // Clear messages completely
                                        aggregatedData: {
                                            dates: new Set<string>(),
                                            locations: new Set<string>(),
                                            characters: new Set<string>(),
                                            tags: new Set<string>()
                                        }
                                    }));

                                    // 3. Generate fresh kickstarter
                                    try {
                                        const { data: freshIdeas } = await supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(5);
                                        const gaps = await detectGaps(session?.user?.id || '', userProfile?.birthDate);
                                        const kickstarterResponse = await generateKickstarter(userProfile, freshIdeas || [], gaps);

                                        const welcomeMsg: ChatMessage = {
                                            id: uuidv4(),
                                            role: 'assistant',
                                            timestamp: Date.now(),
                                            content: kickstarterResponse
                                        };

                                        const { error: msgError } = await supabase.from('messages').insert({
                                            user_id: session.user.id,
                                            role: 'assistant',
                                            content: welcomeMsg.content
                                        });
                                        if (msgError) {
                                            logger.error('Error inserting kickstarter (nouveau souvenir):', msgError);
                                            showToast("Erreur lors de la sauvegarde du message", 'error');
                                        }

                                        setState(prev => ({ ...prev, messages: [welcomeMsg] }));
                                    } catch (error) {
                                        logger.error('Error generating kickstarter:', error);
                                        // Fallback welcome message
                                        setState(prev => ({
                                            ...prev,
                                            messages: [{
                                                id: uuidv4(),
                                                role: 'assistant',
                                                timestamp: Date.now(),
                                                content: {
                                                    narrative: "",
                                                    conversation: "Bienvenue dans une nouvelle session. De quoi souhaitez-vous vous souvenir ?",
                                                    data: null,
                                                    suggestion: null,
                                                    questions: []
                                                }
                                            }]
                                        }));
                                    }

                                    // 🔒 CRITICAL: Prevent loadUserData from overwriting our fresh session
                                    freshSessionStarted.current = true;
                                    showToast("Nouveau souvenir prêt !", 'success');
                                }
                            } else {
                                // With label, insert divider directly (used by idea chest)
                                const dividerMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: label || '', timestamp: Date.now(), isDivider: true };
                                await supabase.from('messages').insert({ user_id: session.user.id, role: 'assistant', content: { text: label || '' }, is_divider: true });
                                setState(prev => ({ ...prev, messages: [...prev.messages, dividerMsg] }));
                            }
                        }}
                        onSave={handleInsertDraft}
                        onSaveAsDraft={() => {
                            setTransitionMode('germer');
                            setShowValidationModal(true);
                        }}
                        onOpenPhotoCatalyst={() => setShowPhotoCatalyst(true)}
                        onStartRecording={handleStartRecording}
                        onStopRecording={handleStopRecording}
                        isRecording={isRecording}
                        voiceTranscript={input}
                        onRegenerate={handleRegenerate}
                        isRegenerating={isRegenerating}
                    />
                )}
                {currentView === 'dashboard' && session?.user && (<div className="w-full h-full pb-16 md:pb-0"><PlumeDashboard userId={session.user.id} userProfile={userProfile} messages={state.messages} onGapClick={handleGapAction} /></div>)}
                {currentView === 'boutique' && session?.user && (
                    <div className="w-full h-full pb-16 md:pb-0">
                        <BoutiqueSouvenirs
                            userId={session.user.id}
                            onSouvenirSelect={handleSouvenirSelect}
                            onShowContributions={() => setShowContributionsPanel(true)}
                            pendingContributionsCount={pendingContributionsCount}
                        />
                    </div>
                )}
                {currentView === 'universe' && session?.user && (<div className="w-full h-full pb-16 md:pb-0"><LifeUniverse userId={session.user.id} userProfile={userProfile} messages={state.messages} /></div>)}
                {currentView === 'address-book' && session?.user && (<div className="w-full h-full pb-16 md:pb-0"><AddressBook userId={session.user.id} /></div>)}
                {currentView === 'manuscript' && session?.user && (<div className="w-full h-full pb-16 md:pb-0"><BookView userId={session.user.id} /></div>)}
                {currentView === 'gallery' && (<div className="w-full h-full pb-16 md:pb-0"><SouvenirGallery characters={state.aggregatedData.characters} tags={state.aggregatedData.tags} photos={userProfile?.photos || []} /></div>)}
                {IS_DEV_MODE && currentView === 'digital-memory' && (
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
                {currentView === 'guest_view' && (<div className="w-full h-full overflow-y-auto"><GuestView /></div>)}
                {currentView === 'guest_landing' && guestToken && (
                    <div className="w-full h-full overflow-y-auto bg-slate-50">
                        {/* @ts-ignore - Prop 'token' will be added to GuestLandingPage */}
                        <GuestLandingPage token={guestToken} onComplete={() => { setCurrentView('landing'); setGuestToken(null); }} />
                    </div>
                )}
            </div>

            {/* Witness Contributions Review Panel */}
            {session?.user && (
                <ContributionReviewPanel
                    userId={session.user.id}
                    isOpen={showContributionsPanel}
                    onClose={() => setShowContributionsPanel(false)}
                    onContributionIntegrated={(chapterId, newContent) => {
                        // Decrement notification count
                        setPendingContributionsCount(prev => Math.max(0, prev - 1));
                        // Optionally refresh data or show toast
                        showToast('Témoignage intégré avec succès !', 'success');
                    }}
                />
            )}

            {/* Help Button & Onboarding Tour */}
            {session && !currentView.includes('guest') && (
                <>
                    <HelpButton
                        onStartTour={() => {
                            setTourSection('all');
                            setShowOnboardingTour(true);
                        }}
                        onOpenSection={(sectionId) => {
                            setTourSection(sectionId as any);
                            setShowOnboardingTour(true);
                        }}
                    />
                    <OnboardingTour
                        run={showOnboardingTour}
                        onFinish={() => setShowOnboardingTour(false)}
                        section={tourSection}
                    />
                </>
            )}

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

