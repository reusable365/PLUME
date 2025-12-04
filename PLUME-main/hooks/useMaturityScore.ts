import { useState, useEffect } from 'react';
import { ChatMessage, AppState } from '../types';

export interface MaturityScore {
    total: number; // 0-100
    breakdown: {
        metadata: number; // 0-60
        volume: number;   // 0-20
        emotion: number;  // 0-20
    };
    status: 'germination' | 'en_cours' | 'pret';
}

export const useMaturityScore = (
    messages: ChatMessage[],
    draftContent: string,
    aggregatedData: AppState['aggregatedData']
): MaturityScore => {
    const [score, setScore] = useState<MaturityScore>({
        total: 0,
        breakdown: { metadata: 0, volume: 0, emotion: 0 },
        status: 'germination'
    });

    useEffect(() => {
        let newScore = { metadata: 0, volume: 0, emotion: 0 };

        // 1. MÉTADONNÉES (60% total)
        // Dates détectées (+20%)
        if (aggregatedData.dates.size > 0) {
            newScore.metadata += 20;
        }

        // Personnages détectés (+20%)
        if (aggregatedData.characters.size > 0) {
            newScore.metadata += 20;
        }

        // Lieux détectés via tags (+20%)
        const locationKeywords = /lieu|ville|pays|endroit|région|quartier|maison|rue/i;
        const hasLocation = Array.from(aggregatedData.tags).some(tag =>
            locationKeywords.test(tag)
        );
        if (hasLocation) {
            newScore.metadata += 20;
        }

        // 2. VOLUME (20% total)
        const userMessages = messages.filter(m => m.role === 'user' && !m.isDivider).length;
        const wordCount = draftContent.trim().split(/\s+/).filter(w => w.length > 0).length;

        if (userMessages >= 5 || wordCount >= 300) {
            newScore.volume = 20;
        } else if (userMessages >= 3 || wordCount >= 150) {
            newScore.volume = 10; // Progression partielle
        }

        // 3. ÉMOTION (20% total)
        const emotionKeywords = /joie|peur|nostalgie|odeur|couleur|souvenir|émotion|sentiment|ressent|heureux|triste|boulevers|touch|ému/i;

        // Chercher dans les messages utilisateur
        const hasEmotionInMessages = messages.some(m =>
            m.role === 'user' &&
            typeof m.content === 'string' &&
            emotionKeywords.test(m.content)
        );

        // Chercher dans le draft
        const hasEmotionInDraft = emotionKeywords.test(draftContent);

        if (hasEmotionInMessages || hasEmotionInDraft) {
            newScore.emotion = 20;
        }

        // Calcul du total
        const total = newScore.metadata + newScore.volume + newScore.emotion;

        // Détermination du statut
        let status: 'germination' | 'en_cours' | 'pret' = 'germination';
        if (total >= 80) {
            status = 'pret';
        } else if (total >= 40) {
            status = 'en_cours';
        }

        setScore({
            total,
            breakdown: newScore,
            status
        });

    }, [messages, draftContent, aggregatedData]);

    return score;
};
