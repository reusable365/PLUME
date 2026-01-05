import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabaseClient';
import { ChatMessage, PlumeResponse, User, Tone, Length, Fidelity } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { soundManager } from '../services/soundManager';
import { sendMessageToPlume } from '../services/geminiService';

// Pagination constant
const MESSAGES_PER_PAGE = 50;

export const useChatSession = (
    user: User | null,
    tone: Tone,
    length: Length,
    fidelity: Fidelity,
    userProfile: any
) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch messages logic
    const fetchMessages = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data: msgs, error: msgError } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false }) // Most recent first
                .limit(MESSAGES_PER_PAGE);

            if (msgError) throw msgError;

            if (msgs) {
                const loadedMessages = msgs
                    .filter((m: any) => {
                        const content = m.content;
                        // Filter out archived messages
                        if (content && typeof content === 'object' && content.isArchived === true) return false;
                        return true;
                    })
                    .map((m: any) => {
                        // Handle divider (check both isDivider and is_divider for compatibility)
                        if (m.is_divider || m.isDivider) {
                            return {
                                id: m.id,
                                role: 'system',
                                content: '',
                                timestamp: new Date(m.created_at).getTime(),
                                isDivider: true
                            } as ChatMessage;
                        }

                        if (m.role === 'user') {
                            const userContent = typeof m.content === 'string' ? m.content : (m.content as any).text || '';
                            const userIsSynthesized = typeof m.content === 'object' && m.content !== null && (m.content as any).isSynthesized === true;
                            return {
                                id: m.id,
                                role: 'user',
                                content: userContent,
                                timestamp: new Date(m.created_at).getTime(),
                                isSynthesized: userIsSynthesized,
                                imageUrl: m.image_url // Ensure image_url is mapped
                            } as ChatMessage;
                        } else {
                            const plumeResponse: PlumeResponse = m.content as PlumeResponse;
                            if (!Array.isArray(plumeResponse.questions)) plumeResponse.questions = [];
                            plumeResponse.isSynthesized = plumeResponse.isSynthesized === true;
                            plumeResponse.isDrafted = plumeResponse.isDrafted === true;

                            return {
                                id: m.id,
                                role: 'assistant',
                                content: plumeResponse,
                                timestamp: new Date(m.created_at).getTime(),
                                isSynthesized: plumeResponse.isSynthesized
                            } as ChatMessage;
                        }
                    });

                // Add welcome message if empty
                if (loadedMessages.length === 0) {
                    const welcomeMsg: ChatMessage = {
                        id: 'welcome',
                        role: 'assistant',
                        timestamp: Date.now(),
                        content: {
                            narrative: "Bonjour. Je suis PLUME, votre assistant biographe. Confiez-moi un souvenir, une image, ou une sensation, et nous commencerons à tisser le fil de votre histoire.",
                            data: null,
                            suggestion: null,
                            questions: [{ type: 'emotion', label: '❤️ Émotion', text: "Quel sentiment prédomine quand vous y pensez ?" }, { type: 'action', label: '⚡ Action', text: "Par quel événement tout a commencé ?" }, { type: 'descriptif', label: '👁️ Sensoriel', text: "Quelle image ou odeur vous revient en premier ?" }]
                        } as PlumeResponse
                    };
                    loadedMessages.push(welcomeMsg);
                }
                // Reverse to show oldest first (since we fetched newest first)
                setMessages(loadedMessages.reverse());
            }
        } catch (err) {
            logger.error("Error loading messages:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial fetch
    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    // Session Messages (Isolation)
    const sessionMessages = useMemo(() => {
        const lastDividerIndex = messages.map(m => m.isDivider).lastIndexOf(true);
        return lastDividerIndex !== -1 ? messages.slice(lastDividerIndex + 1) : messages;
    }, [messages]);

    // Send Message Logic
    const sendMessage = useCallback(async (text: string, imageUrl?: string) => {
        if (!text.trim() || isLoading || !user) return;

        soundManager.playKeystroke();
        const userMsg: ChatMessage = { id: uuidv4(), role: 'user', content: text, timestamp: Date.now(), imageUrl };

        // Optimistic update
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            await supabase.from('messages').insert({
                user_id: user.id,
                role: 'user',
                content: { text: text, isSynthesized: false },
                image_url: imageUrl
            });

            // Prepare history for AI (using sessionMessages logic)
            // We use the NEW messages list which includes the userMsg we just added
            const currentMessages = [...messages, userMsg];
            const lastDividerIndex = currentMessages.map(m => m.isDivider).lastIndexOf(true);
            const relevantMessages = lastDividerIndex > -1 ? currentMessages.slice(lastDividerIndex + 1) : currentMessages;

            // OPTIMIZATION: Sliding Window to reduce token usage
            // We only send the last 20 messages to the AI.
            // This prevents quadratic cost growth in long sessions.
            const WINDOW_SIZE = 20;
            const contextMessages = relevantMessages.slice(-WINDOW_SIZE);

            const apiHistory = contextMessages
                .filter(m => m.id !== 'welcome' && !m.isDivider)
                .map(m => {
                    if (m.role === 'user') return { role: 'user', parts: [{ text: typeof m.content === 'string' ? m.content : (m.content as any).text || '' }] };
                    const c = m.content as PlumeResponse;
                    const questionsContext = Array.isArray(c.questions) ? c.questions.map(q => q.text).join(' | ') : '';
                    return { role: 'model', parts: [{ text: `[TEXTE_PLUME]${c.narrative} [/TEXTE_PLUME][CONTEXTE_QUESTIONS]${questionsContext} [/CONTEXTE_QUESTIONS]` }] };
                }) as { role: 'user' | 'model', parts: [{ text: string }] }[];

            const lastDraftedMsg = [...messages].reverse().find(m => m.role === 'assistant' && (m.content as PlumeResponse).isDrafted === true);
            let lastValidNarrative = '';
            if (lastDraftedMsg) lastValidNarrative = (lastDraftedMsg.content as PlumeResponse).narrative;

            const response = await sendMessageToPlume(text, tone, length, fidelity, apiHistory, lastValidNarrative, userProfile);

            const aiMsg: ChatMessage = { id: uuidv4(), role: 'assistant', content: response, timestamp: Date.now() };

            setMessages(prev => [...prev, aiMsg]);
            await supabase.from('messages').insert({ user_id: user.id, role: 'assistant', content: response });

            return { userMsg, aiMsg }; // Return for autoCompile or other side effects

        } catch (error) {
            logger.error("Error sending message:", error);
            // Revert optimistic update? Or show error toast
        } finally {
            setIsLoading(false);
        }
    }, [user, messages, tone, length, fidelity, userProfile]);

    // Insert Divider Logic
    const insertDivider = useCallback(async (label: string = '--- Nouveau Souvenir ---') => {
        if (!user) return;
        const dividerMsg: ChatMessage = {
            id: uuidv4(),
            role: 'system',
            content: label,
            timestamp: Date.now(),
            isDivider: true
        };
        setMessages(prev => [...prev, dividerMsg]);
        await supabase.from('messages').insert({
            user_id: user.id,
            role: 'system',
            content: label,
            is_divider: true // Correct column name
        });
    }, [user]);

    return {
        messages,
        sessionMessages,
        isLoading,
        sendMessage,
        insertDivider,
        setMessages,
        refreshMessages: fetchMessages
    };
};
