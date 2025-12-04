import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import { ChatMessage, PlumeResponse } from '../types';

export interface UserStats {
    completion: number;
    pages: number;
    estimatedTotal: number;
    chapters: number;
    photos: number;
    weeklyProgress: number;
    totalMessages: number;
    draftedMessages: number;
}

export interface ThemeData {
    name: string;
    percentage: number;
    pages: number;
    color: string;
}

export interface Gap {
    id: number;
    icon: string;
    color: 'red' | 'amber' | 'yellow';
    title: string;
    severity: 'Critique' | 'Important' | 'Mineur';
    description: string;
    impact: string;
    suggestion: string;
    actionLabel: string;
}

/**
 * Calculate comprehensive user statistics from Supabase data
 */
export const calculateUserStats = async (userId: string): Promise<UserStats> => {
    try {
        // Get all messages
        const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('user_id', userId);

        if (msgError) throw msgError;

        // Get all chapters
        const { data: chapters, error: chapError } = await supabase
            .from('chapters')
            .select('*')
            .eq('user_id', userId);

        if (chapError) throw chapError;

        // Get photos from profile
        const { data: profile, error: profError } = await supabase
            .from('profiles')
            .select('photos')
            .eq('id', userId)
            .single();

        if (profError) throw profError;

        // Calculate stats
        const totalMessages = messages?.filter(m => m.role === 'user').length || 0;
        const draftedMessages = messages?.filter(m => {
            if (m.role === 'assistant' && m.content) {
                const content = m.content as PlumeResponse;
                return content.isDrafted === true;
            }
            return false;
        }).length || 0;

        const finalChapters = chapters?.filter(c => c.status === 'published') || [];
        const draftWorkspace = chapters?.find(c => c.status === 'draft_workspace');
        const totalChapters = finalChapters.length;

        // Estimate pages
        // 1. Drafted messages: 0.5 pages each
        // 2. Published chapters: 3 pages each (or based on length if available)
        // 3. Current workspace draft: ~3000 chars per page

        let draftPages = 0;
        if (draftWorkspace && draftWorkspace.content) {
            draftPages = Math.ceil(draftWorkspace.content.length / 3000);
        }

        const estimatedPages = Math.round((draftedMessages * 0.5) + (finalChapters.length * 3) + draftPages);
        const estimatedTotal = Math.max(200, estimatedPages * 1.5); // Dynamic estimate

        const completion = Math.min(100, Math.round((estimatedPages / estimatedTotal) * 100));

        const photoCount = profile?.photos?.length || 0;

        // Calculate weekly progress
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentMessages = messages?.filter(m => {
            if (m.role === 'assistant' && m.content) {
                const content = m.content as PlumeResponse;
                const createdAt = new Date(m.created_at);
                return content.isDrafted === true && createdAt >= oneWeekAgo;
            }
            return false;
        }) || [];

        const weeklyProgress = Math.round(recentMessages.length * 0.5) + (draftWorkspace && new Date(draftWorkspace.updated_at) >= oneWeekAgo ? draftPages : 0);

        return {
            completion,
            pages: estimatedPages,
            estimatedTotal: Math.round(estimatedTotal),
            chapters: totalChapters,
            photos: photoCount,
            weeklyProgress,
            totalMessages,
            draftedMessages
        };
    } catch (error) {
        logger.error('Error calculating user stats:', error);
        // Return default stats on error
        return {
            completion: 0,
            pages: 0,
            estimatedTotal: 200,
            chapters: 0,
            photos: 0,
            weeklyProgress: 0,
            totalMessages: 0,
            draftedMessages: 0
        };
    }
};

// Theme mapping with keywords
export const themeKeywords: Record<string, string[]> = {
    'Famille': ['famille', 'parent', 'mère', 'père', 'enfant', 'frère', 'sœur', 'mariage', 'familial'],
    'Enfance': ['enfance', 'école', 'jeunesse', 'adolescence', 'jeune', 'petit', 'grandir', 'souvenir'],
    'Voyages': ['voyage', 'vacances', 'découverte', 'pays', 'ville', 'aventure', 'exploration', 'monde'],
    'Travail': ['travail', 'carrière', 'profession', 'métier', 'emploi', 'collègue', 'entreprise', 'boss', 'patron'],
    'Passions': ['passion', 'hobby', 'loisir', 'sport', 'art', 'musique', 'lecture', 'créativité', 'jeu'],
    'Amour': ['amour', 'relation', 'rencontre', 'couple', 'romance', 'sentiment', 'mariage'],
    'Épreuves': ['difficulté', 'épreuve', 'défi', 'obstacle', 'perte', 'deuil', 'maladie', 'accident']
};

/**
 * Analyze thematic balance from messages and entities
 */
export const analyzeThematicBalance = async (userId: string): Promise<ThemeData[]> => {
    try {
        // Get all themes from entities
        const { data: entities, error } = await supabase
            .from('entities')
            .select('type, value')
            .eq('user_id', userId)
            .eq('type', 'theme');

        if (error) throw error;

        const tags = entities?.map(e => e.value.toLowerCase()) || [];

        // Count occurrences
        const themeCounts: Record<string, number> = {};
        Object.keys(themeKeywords).forEach(theme => {
            themeCounts[theme] = 0;
            themeKeywords[theme].forEach(keyword => {
                themeCounts[theme] += tags.filter(tag => tag.includes(keyword)).length;
            });
        });

        // Calculate total and percentages
        const total = Object.values(themeCounts).reduce((sum, count) => sum + count, 0);

        if (total === 0) {
            return [];
        }

        // Get user stats for page estimation
        const stats = await calculateUserStats(userId);

        const colors = ['bg-rose-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500'];

        return Object.entries(themeCounts)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([theme, count], index) => {
                const percentage = Math.round((count / total) * 100);
                const pages = Math.round((percentage / 100) * stats.pages);
                return {
                    name: theme,
                    percentage,
                    pages,
                    color: colors[index % colors.length]
                };
            });
    } catch (error) {
        logger.error('Error analyzing thematic balance:', error);
        return [];
    }
};

/**
 * Detect narrative gaps based on user data
 */
export const detectGaps = async (userId: string, userBirthDate?: string): Promise<Gap[]> => {
    try {
        const gaps: Gap[] = [];

        // Get entities
        const { data: entities } = await supabase
            .from('entities')
            .select('type, value')
            .eq('user_id', userId);

        const dates = entities?.filter(e => e.type === 'date').map(e => e.value) || [];
        const characters = entities?.filter(e => e.type === 'person').map(e => e.value) || [];
        const tags = entities?.filter(e => e.type === 'theme').map(e => e.value) || [];

        // Gap 1: Missing time periods
        if (userBirthDate && dates.length > 0) {
            const years = dates
                .map(d => {
                    const match = d.match(/\d{4}/);
                    return match ? parseInt(match[0]) : null;
                })
                .filter(y => y !== null) as number[];

            if (years.length > 0) {
                const minYear = Math.min(...years);
                const maxYear = Math.max(...years);
                const yearRange = maxYear - minYear;

                // Check for 10+ year gaps
                const sortedYears = [...new Set(years)].sort((a, b) => a - b);
                for (let i = 0; i < sortedYears.length - 1; i++) {
                    const gap = sortedYears[i + 1] - sortedYears[i];
                    if (gap >= 10) {
                        gaps.push({
                            id: gaps.length + 1,
                            icon: 'IconClock',
                            color: 'red',
                            title: `Années ${sortedYears[i]}-${sortedYears[i + 1]}`,
                            severity: 'Critique',
                            description: `Période de ${gap} ans peu documentée`,
                            impact: 'Une décennie entière de votre vie reste dans l\'ombre',
                            suggestion: `Raconter des souvenirs de cette période`,
                            actionLabel: 'Explorer cette période'
                        });
                    }
                }
            }
        }

        // Gap 2: Character imbalance
        if (characters.length > 0) {
            const characterCounts: Record<string, number> = {};
            characters.forEach(char => {
                characterCounts[char] = (characterCounts[char] || 0) + 1;
            });

            const sortedChars = Object.entries(characterCounts).sort((a, b) => b[1] - a[1]);

            // Check for family member imbalance
            const motherMentions = sortedChars.filter(([name]) =>
                name.toLowerCase().includes('mère') || name.toLowerCase().includes('maman')
            ).reduce((sum, [_, count]) => sum + count, 0);

            const fatherMentions = sortedChars.filter(([name]) =>
                name.toLowerCase().includes('père') || name.toLowerCase().includes('papa')
            ).reduce((sum, [_, count]) => sum + count, 0);

            if (fatherMentions > motherMentions * 3 && motherMentions < 5) {
                gaps.push({
                    id: gaps.length + 1,
                    icon: 'IconUsers',
                    color: 'amber',
                    title: 'Votre mère',
                    severity: 'Important',
                    description: `Mentionnée ${motherMentions} fois (vs père ${fatherMentions} fois)`,
                    impact: 'Déséquilibre familial dans la narration',
                    suggestion: 'Créer un chapitre dédié à votre mère',
                    actionLabel: 'Écrire sur Maman'
                });
            }
        }

        // Gap 3: Thematic gaps
        const workTags = tags.filter(t =>
            t.toLowerCase().includes('travail') ||
            t.toLowerCase().includes('carrière') ||
            t.toLowerCase().includes('profession')
        ).length;

        const familyTags = tags.filter(t =>
            t.toLowerCase().includes('famille') ||
            t.toLowerCase().includes('parent')
        ).length;

        if (familyTags > workTags * 4 && workTags < 3) {
            gaps.push({
                id: gaps.length + 1,
                icon: 'IconBriefcase',
                color: 'yellow',
                title: 'Vie professionnelle',
                severity: 'Mineur',
                description: `Peu évoquée (${workTags} mentions vs ${familyTags} pour la famille)`,
                impact: 'Votre carrière mérite plus de place dans votre récit',
                suggestion: 'Raconter 2-3 projets ou moments marquants',
                actionLabel: 'Explorer ma carrière'
            });
        }

        return gaps;
    } catch (error) {
        logger.error('Error detecting gaps:', error);
        return [];
    }
};

/**
 * Get writing activity timeline (for charts)
 */
export const getWritingTimeline = async (userId: string): Promise<{ date: string; pages: number }[]> => {
    try {
        const { data: messages } = await supabase
            .from('messages')
            .select('created_at, content')
            .eq('user_id', userId)
            .eq('role', 'assistant')
            .order('created_at', { ascending: true });

        if (!messages) return [];

        // Group by week
        const weeklyData: Record<string, number> = {};

        messages.forEach(msg => {
            if (msg.content && (msg.content as PlumeResponse).isDrafted) {
                const date = new Date(msg.created_at);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay()); // Start of week
                const weekKey = weekStart.toISOString().split('T')[0];

                weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 0.5; // 0.5 pages per drafted message
            }
        });

        return Object.entries(weeklyData)
            .map(([date, pages]) => ({ date, pages: Math.round(pages) }))
            .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
        logger.error('Error getting writing timeline:', error);
        return [];
    }
};
