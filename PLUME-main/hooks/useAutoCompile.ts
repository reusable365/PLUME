import { useState, useCallback } from 'react';
import { ChatMessage, Tone, Length, Fidelity, PlumeResponse } from '../types';
import { synthesizeNarrative } from '../services/geminiService';
import { logger } from '../utils/logger';

export const useAutoCompile = (
    tone: Tone,
    length: Length,
    fidelity: Fidelity,
    userId?: string
) => {
    const [compiledText, setCompiledText] = useState('');
    const [isCompiling, setIsCompiling] = useState(false);

    const autoCompile = useCallback(async (messages: ChatMessage[]) => {
        setIsCompiling(true);
        try {
            // Logic from App.tsx:
            // 1. Find last drafted message timestamp (cutoff).
            // 2. Filter messages after cutoff.
            // 3. Filter out drafted messages.

            let cutoffTimestamp = 0;
            const lastDraftedMsg = [...messages].reverse().find(m => m.role === 'assistant' && (m.content as PlumeResponse).isDrafted === true);
            if (lastDraftedMsg) cutoffTimestamp = lastDraftedMsg.timestamp;

            const messagesToCompile = messages.filter(m => {
                if (m.id === 'welcome' || m.timestamp <= cutoffTimestamp) return false;
                let isDrafted = false;
                if (m.role === 'assistant') {
                    const c = m.content as PlumeResponse;
                    isDrafted = c.isDrafted === true;
                }
                return !isDrafted;
            });

            if (messagesToCompile.length === 0) {
                setCompiledText('');
                return;
            }

            const historySegment = messagesToCompile.map(m => ({
                role: m.role,
                content: m.role === 'user' ? (m.content as string) : (m.content as PlumeResponse).narrative
            }));

            const response = await synthesizeNarrative(historySegment, tone, length, fidelity, userId);
            setCompiledText(response.narrative);
        } catch (error) {
            logger.error("Auto-compilation failed", error);
        } finally {
            setIsCompiling(false);
        }
    }, [tone, length, fidelity]);

    return {
        compiledText,
        setCompiledText,
        isCompiling,
        autoCompile
    };
};
