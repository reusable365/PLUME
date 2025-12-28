import React, { useState, useEffect } from 'react';
import { IconAlertCircle, IconTrendingUp, IconUsers, IconBriefcase, IconHeart, IconClock, IconChevronRight, IconCheck, IconX, IconTarget, IconStar, IconZap, IconBook, IconRefresh, IconDownload, IconFeather } from './Icons';
import { User, ChatMessage } from '../types';
import { calculateUserStats, analyzeThematicBalance, detectGaps, getWritingTimeline, UserStats, ThemeData, Gap } from '../services/analyticsService';
import { analyzeWritingPatterns, generatePersonalizedRecommendations, detectNarrativeGapsAI, WritingAnalysis, AIInsight } from '../services/dashboardAIService';
import { generatePDFReport, ExportData } from '../services/exportService';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';
import DashboardCharts from './DashboardCharts';
import GoalSettingModal, { WritingGoal } from './GoalSettingModal';

interface PlumeDashboardProps {
    userId: string;
    userProfile: User | null;
    messages: ChatMessage[];
    onGapClick?: (gap: Gap) => void;
}

const PlumeDashboard: React.FC<PlumeDashboardProps> = ({ userId, userProfile, messages, onGapClick }) => {
    const [selectedGap, setSelectedGap] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Real data state
    const [stats, setStats] = useState<UserStats | null>(null);
    const [themes, setThemes] = useState<ThemeData[]>([]);
    const [gaps, setGaps] = useState<Gap[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<WritingAnalysis | null>(null);
    const [timeline, setTimeline] = useState<{ date: string; pages: number }[]>([]);
    const [goals, setGoals] = useState<WritingGoal[]>([]);
    const [showGoalModal, setShowGoalModal] = useState(false);

    // Character data for charts
    const [characterData, setCharacterData] = useState<{ name: string; mentions: number }[]>([]);

    // Load all data on mount
    useEffect(() => {
        if (userId) {
            loadDashboardData();
        }
    }, [userId, userProfile]);

    const loadDashboardData = async () => {
        // 1. Try to load from cache first to show data immediately
        const cachedStats = localStorage.getItem(`dashboard_stats_${userId}`);
        const cachedThemes = localStorage.getItem(`dashboard_themes_${userId}`);
        const cachedGaps = localStorage.getItem(`dashboard_gaps_${userId}`);
        const cachedTimeline = localStorage.getItem(`dashboard_timeline_${userId}`);
        const cachedGoals = localStorage.getItem(`dashboard_goals_${userId}`);

        if (cachedStats) {
            setStats(JSON.parse(cachedStats));
            if (cachedThemes) setThemes(JSON.parse(cachedThemes));
            if (cachedGaps) setGaps(JSON.parse(cachedGaps));
            if (cachedTimeline) setTimeline(JSON.parse(cachedTimeline));
            if (cachedGoals) setGoals(JSON.parse(cachedGoals));

            // If we have at least stats, we can show the dashboard
            setIsLoading(false);
        } else {
            setIsLoading(true);
        }

        try {
            // Load basic stats
            const userStats = await calculateUserStats(userId);
            setStats(userStats);
            localStorage.setItem(`dashboard_stats_${userId}`, JSON.stringify(userStats));

            // Load thematic balance
            const themeData = await analyzeThematicBalance(userId);
            setThemes(themeData);
            localStorage.setItem(`dashboard_themes_${userId}`, JSON.stringify(themeData));

            // Load gaps
            const gapData = await detectGaps(userId, userProfile?.birthDate);
            setGaps(gapData);
            localStorage.setItem(`dashboard_gaps_${userId}`, JSON.stringify(gapData));

            // Load timeline
            const timelineData = await getWritingTimeline(userId);
            setTimeline(timelineData);
            localStorage.setItem(`dashboard_timeline_${userId}`, JSON.stringify(timelineData));


            // Load character mentions from person_entities (updated by merges)
            const { data: personEntities } = await supabase
                .from('person_entities')
                .select('canonical_name, mention_count')
                .eq('user_id', userId)
                .order('mention_count', { ascending: false })
                .limit(15);

            if (personEntities) {
                const charData = personEntities.map(e => ({
                    name: e.canonical_name,
                    mentions: e.mention_count || 1
                }));
                setCharacterData(charData);
            }

            // Load goals
            const { data: goalsData } = await supabase
                .from('writing_goals')
                .select('*')
                .eq('user_id', userId)
                .eq('completed', false);

            if (goalsData) {
                setGoals(goalsData);
                localStorage.setItem(`dashboard_goals_${userId}`, JSON.stringify(goalsData));
            }

            // Load AI analysis (if available in cache)
            const cachedAnalysis = localStorage.getItem(`ai_analysis_${userId}`);
            if (cachedAnalysis) {
                setAiAnalysis(JSON.parse(cachedAnalysis));
            }

            // Always trigger fresh analysis in background to ensure up-to-date info
            handleRefreshAIInsights(userStats);

        } catch (error) {
            logger.error('Error loading dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefreshAIInsights = async (currentStats?: UserStats) => {
        const statsToUse = currentStats || stats;
        // If we still don't have any stats (e.g., initial load), attempt a minimal analysis using empty stats
        if (!statsToUse) {
            // Show loading indicator
            setIsAnalyzing(true);
            try {
                const analysis = await analyzeWritingPatterns(messages, userProfile, {} as UserStats);
                setAiAnalysis(analysis);
                localStorage.setItem(`ai_analysis_${userId}`, JSON.stringify(analysis));
                const aiGaps = await detectNarrativeGapsAI(messages, userProfile);
                if (aiGaps.length > 0) {
                    setGaps(prev => {
                        const existingTitles = new Set(prev.map(g => g.title));
                        const newUniqueGaps = aiGaps.filter(g => !existingTitles.has(g.title));
                        return [...newUniqueGaps, ...prev].slice(0, 5);
                    });
                }
            } catch (error) {
                logger.error('Error during fallback AI analysis:', error);
            } finally {
                setIsAnalyzing(false);
            }
            return;
        }

        // Show loading if manual refresh OR if we don't have data yet
        const isManualRefresh = !currentStats;
        const shouldShowLoading = isManualRefresh || !aiAnalysis;

        if (shouldShowLoading) setIsAnalyzing(true);

        try {
            const analysis = await analyzeWritingPatterns(messages, userProfile, statsToUse);
            setAiAnalysis(analysis);

            // Cache the analysis
            localStorage.setItem(`ai_analysis_${userId}`, JSON.stringify(analysis));

            // Also get AI-powered gap detection
            const aiGaps = await detectNarrativeGapsAI(messages, userProfile);
            if (aiGaps.length > 0) {
                setGaps(prev => {
                    // Avoid duplicates based on title
                    const existingTitles = new Set(prev.map(g => g.title));
                    const newUniqueGaps = aiGaps.filter(g => !existingTitles.has(g.title));
                    return [...newUniqueGaps, ...prev].slice(0, 5); // Merge and limit to 5
                });
            }
        } catch (error) {
            logger.error('Error analyzing writing patterns:', error);
        } finally {
            if (shouldShowLoading) setIsAnalyzing(false);
        }
    };

    const handleExportReport = async () => {
        if (!stats || !userProfile) return;
        setIsExporting(true);
        try {
            const exportData: ExportData = {
                userName: userProfile.name || userProfile.email,
                stats,
                themes,
                gaps,
                aiAnalysis: aiAnalysis || undefined,
                goals: goals.length > 0 ? goals : undefined
            };
            await generatePDFReport(exportData);
        } catch (error) {
            logger.error('Error exporting report:', error);
            alert('Erreur lors de l\'export du rapport');
        } finally {
            setIsExporting(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        const colors = {
            'Critique': 'bg-red-100 border-red-300 text-red-700',
            'Important': 'bg-amber-100 border-amber-300 text-amber-700',
            'Mineur': 'bg-yellow-100 border-yellow-300 text-yellow-700'
        };
        return colors[severity as keyof typeof colors] || 'bg-slate-100';
    };

    const getIconBgColor = (color: string) => {
        const colors = {
            'red': 'bg-red-100',
            'amber': 'bg-amber-100',
            'yellow': 'bg-yellow-100'
        };
        return colors[color as keyof typeof colors];
    };

    const getIconColor = (color: string) => {
        const colors = {
            'red': 'text-red-600',
            'amber': 'text-amber-600',
            'yellow': 'text-yellow-600'
        };
        return colors[color as keyof typeof colors];
    };

    const getIconComponent = (iconName: string) => {
        const icons: Record<string, any> = {
            'IconClock': IconClock,
            'IconUsers': IconUsers,
            'IconBriefcase': IconBriefcase,
            'IconStar': IconStar,
            'IconTrendingUp': IconTrendingUp,
            'IconTarget': IconTarget
        };
        return icons[iconName] || IconTarget;
    };

    if (isLoading || !stats) {
        return <DashboardLoading />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-rose-50/20 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header with Export Button */}
                <div className="mb-8 md:mb-12 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-accent to-amber-600 p-3 rounded-2xl shadow-lg">
                            <IconTarget className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-4xl font-serif font-bold text-ink-900 leading-tight">
                                Tableau de Bord Éditorial
                            </h1>
                            <p className="text-ink-600 text-sm md:text-base mt-1 font-medium">
                                Pilotez votre récit avec intelligence
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportReport}
                        disabled={isExporting}
                        className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <IconDownload className="w-5 h-5" />
                        <span className="hidden md:inline">{isExporting ? 'Export...' : 'Export PDF'}</span>
                    </button>
                </div>

                {/* Hero Progress Section */}
                <div className="mb-8 md:mb-12 bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-xl border border-ink-100">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Circular Progress */}
                        <div className="relative w-32 h-32 md:w-48 md:h-48 flex-shrink-0">
                            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 200 200">
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="90"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-ink-100"
                                />
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="90"
                                    stroke="url(#gradient)"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={`${2 * Math.PI * 90}`}
                                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - stats.completion / 100)}`}
                                    className="transition-all duration-1000 ease-out"
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#b45309" />
                                        <stop offset="100%" stopColor="#ea580c" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl md:text-5xl font-bold text-accent">{stats.completion}%</span>
                                <span className="text-xs md:text-sm text-ink-500 font-medium mt-1">Complétude</span>
                            </div>
                        </div>

                        {/* Stats and Quote */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-gradient-to-r from-accent/10 to-amber-100/50 rounded-2xl p-6 border-l-4 border-accent">
                                <p className="text-ink-700 text-lg md:text-xl font-serif italic leading-relaxed">
                                    "Chaque souvenir est une pierre précieuse. Vous en avez déjà collecté <strong className="text-accent">{stats.pages}</strong>.
                                    Continuez à bâtir votre cathédrale de mémoire."
                                </p>
                                <p className="text-ink-500 text-sm mt-3 font-medium">— PLUME, votre biographe</p>
                            </div>

                            <div className="flex items-center gap-3 text-sm flex-wrap">
                                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold">
                                    <IconTrendingUp className="w-4 h-4" />
                                    <span>+{stats.weeklyProgress} pages cette semaine</span>
                                </div>
                                <div className="text-ink-500">
                                    Objectif : <strong className="text-ink-700">{stats.estimatedTotal} pages</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 md:p-6 shadow-lg border border-ink-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-blue-100 p-2 rounded-xl">
                                <IconBook className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-sm text-ink-600 font-medium">Pages</div>
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-blue-600">{stats.pages}</div>
                        <div className="text-xs text-ink-500 mt-2">sur ~{stats.estimatedTotal} estimées</div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 md:p-6 shadow-lg border border-ink-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-purple-100 p-2 rounded-xl">
                                <IconBook className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-sm text-ink-600 font-medium">Chapitres</div>
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-purple-600">{stats.chapters}</div>
                        <div className="text-xs text-ink-500 mt-2">{stats.draftedMessages} brouillons</div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 md:p-6 shadow-lg border border-ink-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-amber-100 p-2 rounded-xl">
                                <IconStar className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="text-sm text-ink-600 font-medium">Photos</div>
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-amber-600">{stats.photos}</div>
                        <div className="text-xs text-ink-500 mt-2">Intégrées</div>
                    </div>

                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 md:p-6 shadow-lg border border-ink-100 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-emerald-100 p-2 rounded-xl">
                                <IconZap className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="text-sm text-ink-600 font-medium">Rythme d'écriture</div>
                        </div>
                        <div className="text-3xl md:text-4xl font-bold text-emerald-600">
                            {stats.weeklyProgress > 5 ? 'Élevé' : stats.weeklyProgress > 2 ? 'Moyen' : 'Faible'}
                        </div>
                        <div className="text-xs text-ink-500 mt-2">Continuez !</div>
                    </div>
                </div>

                {/* AI Insights Section */}
                {aiAnalysis && (
                    <div className="mb-8 md:mb-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-indigo-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-2xl">
                                    <IconFeather className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-ink-900">Insights IA</h2>
                                    <p className="text-ink-600 text-sm">Analyse personnalisée de votre écriture</p>
                                </div>
                            </div>
                            <button
                                onClick={handleRefreshAIInsights}
                                disabled={isAnalyzing}
                                className="px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 rounded-xl font-semibold transition-colors flex items-center gap-2 border border-indigo-200"
                            >
                                <IconRefresh className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                Actualiser
                            </button>
                        </div>

                        {/* Writing Style & Tone */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/80 rounded-xl p-4">
                                <p className="text-xs text-ink-500 font-semibold uppercase mb-1">Style d'écriture</p>
                                <p className="text-lg font-bold text-indigo-700">{aiAnalysis.writingStyle}</p>
                            </div>
                            <div className="bg-white/80 rounded-xl p-4">
                                <p className="text-xs text-ink-500 font-semibold uppercase mb-1">Ton émotionnel</p>
                                <p className="text-lg font-bold text-purple-700">{aiAnalysis.emotionalTone}</p>
                            </div>
                            <div className="bg-white/80 rounded-xl p-4">
                                <p className="text-xs text-ink-500 font-semibold uppercase mb-1">Cohérence</p>
                                <p className="text-lg font-bold text-emerald-700">{aiAnalysis.coherenceScore}/100</p>
                            </div>
                        </div>

                        {/* AI Insights Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {aiAnalysis.insights.slice(0, 4).map((insight) => {
                                const Icon = getIconComponent(insight.icon);
                                return (
                                    <div key={insight.id} className="bg-white/80 rounded-xl p-5 border-l-4 border-indigo-400">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg bg-${insight.color}-100`}>
                                                <Icon className={`w-5 h-5 text-${insight.color}-600`} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-ink-900 mb-1">{insight.title}</h4>
                                                <p className="text-sm text-ink-600">{insight.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {!aiAnalysis && (
                    <div className="mb-8 md:mb-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 shadow-xl border-2 border-indigo-200 text-center">
                        {isAnalyzing ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-12 w-12 bg-indigo-200 rounded-full mx-auto"></div>
                                <div className="h-6 w-48 bg-indigo-200 rounded mx-auto"></div>
                                <div className="h-4 w-64 bg-indigo-100 rounded mx-auto"></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                                    <div className="h-32 bg-white/50 rounded-xl"></div>
                                    <div className="h-32 bg-white/50 rounded-xl"></div>
                                </div>
                                <p className="text-indigo-600 font-bold tracking-widest mt-4 animate-pulse uppercase">ANALYSE EN COURS...</p>
                            </div>
                        ) : (
                            <>
                                <IconFeather className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-ink-900 mb-2">Débloquez les Insights IA</h3>
                                <p className="text-ink-600 mb-4">Obtenez une analyse personnalisée de votre style d'écriture</p>
                                <button
                                    onClick={() => handleRefreshAIInsights()}
                                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                                >
                                    Lancer l'analyse
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Zones d'Ombre */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-ink-100 mb-8 md:mb-12 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 p-5 md:p-6 flex items-center gap-3">
                        <IconAlertCircle className="w-7 h-7 text-white flex-shrink-0" />
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-white">Zones d'ombre</h2>
                            <p className="text-white/90 text-sm mt-1">Analyse de la couverture de votre récit</p>
                        </div>
                    </div>

                    <div className="p-4 md:p-8 space-y-4">
                        {gaps.length > 0 ? (
                            gaps.map((gap) => {
                                const Icon = getIconComponent(gap.icon);
                                return (
                                    <div
                                        key={gap.id}
                                        className={`border-2 rounded-2xl p-5 md:p-6 cursor-pointer transition-all ${selectedGap === gap.id
                                            ? 'border-accent bg-accent/5 shadow-lg scale-[1.02]'
                                            : 'border-ink-200 hover:border-ink-300 hover:shadow-md'
                                            }`}
                                        onClick={() => setSelectedGap(selectedGap === gap.id ? null : gap.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${getIconBgColor(gap.color)}`}>
                                                    <Icon className={`w-7 h-7 ${getIconColor(gap.color)}`} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-ink-900 text-lg">{gap.title}</h3>
                                                        <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${getSeverityColor(gap.severity)}`}>
                                                            {gap.severity}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-ink-600 mb-2 font-medium">{gap.description}</p>

                                                    {selectedGap === gap.id && (
                                                        <div className="mt-4 pt-4 border-t border-ink-200 animate-fade-in">
                                                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4">
                                                                <p className="text-sm text-red-800 font-medium">
                                                                    <strong>Impact :</strong> {gap.impact}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (onGapClick) onGapClick(gap);
                                                                    }}
                                                                    className="px-5 py-3 bg-gradient-to-r from-accent to-amber-600 hover:from-accent-light hover:to-amber-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                                                                >
                                                                    <IconZap className="w-4 h-4" />
                                                                    {gap.actionLabel}
                                                                </button>
                                                                <button className="px-5 py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl text-sm font-semibold transition-colors">
                                                                    Plus tard
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <IconChevronRight
                                                className={`w-6 h-6 text-ink-400 transition-transform flex-shrink-0 ${selectedGap === gap.id ? 'rotate-90' : ''
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                <IconCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-ink-900 mb-2">Aucune zone d'ombre majeure détectée</h3>
                                <p className="text-ink-600">Votre récit semble bien équilibré pour le moment. Continuez ainsi !</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Répartition Thématique (Simple Bars) */}
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-ink-100 overflow-hidden mb-8 md:mb-12">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 md:p-6">
                        <h2 className="text-xl md:text-2xl font-bold text-white">Répartition thématique</h2>
                        <p className="text-white/90 text-sm mt-1">L'équilibre de votre récit</p>
                    </div>

                    <div className="p-6 md:p-8">
                        {themes.length > 0 ? (
                            <div className="space-y-5">
                                {themes.map((theme, idx) => (
                                    <div key={idx} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-ink-800">{theme.name}</span>
                                            <span className="text-sm text-ink-600 font-semibold">
                                                {theme.pages} pages ({theme.percentage}%)
                                            </span>
                                        </div>
                                        <div className="w-full h-4 bg-ink-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full ${theme.color} transition-all duration-700 ease-out group-hover:opacity-90`}
                                                style={{ width: `${theme.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-indigo-50/30 rounded-2xl border border-indigo-100 border-dashed">
                                <IconBook className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-ink-900 mb-2">Vos thèmes se dessinent</h3>
                                <p className="text-ink-600 max-w-md mx-auto">
                                    Commencez à raconter vos souvenirs pour voir apparaître ici la répartition thématique de votre récit.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Interactive Charts */}
                {(themes.length > 0 || timeline.length > 0) && (
                    <DashboardCharts
                        themeData={themes}
                        timelineData={timeline}
                        characterData={characterData}
                    />
                )}

                {/* Goals Section */}
                {goals.length > 0 && (
                    <div className="mb-8 md:mb-12 bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-ink-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
                                <IconTarget className="w-6 h-6 text-accent" />
                                Mes Objectifs
                            </h2>
                            <button
                                onClick={() => setShowGoalModal(true)}
                                className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-xl font-semibold transition-colors"
                            >
                                + Nouvel objectif
                            </button>
                        </div>
                        <div className="space-y-4">
                            {goals.map(goal => {
                                let currentValue = goal.current_value;
                                let targetLabel = '';
                                let icon = null;

                                if (goal.goal_type === 'theme' && goal.theme) {
                                    // Find current value from themes analysis
                                    const themeData = themes.find(t => t.name === goal.theme);
                                    currentValue = themeData ? themeData.pages : 0;
                                    targetLabel = goal.theme;
                                    icon = <IconBook className="w-5 h-5 text-accent" />;
                                } else if (goal.goal_type === 'pages') {
                                    targetLabel = 'Pages';
                                    icon = <IconBook className="w-5 h-5 text-blue-600" />;
                                } else if (goal.goal_type === 'chapters') {
                                    targetLabel = 'Chapitres';
                                    icon = <IconBook className="w-5 h-5 text-purple-600" />;
                                } else {
                                    targetLabel = 'Date limite';
                                    icon = <IconClock className="w-5 h-5 text-amber-600" />;
                                }

                                const progress = goal.target_value
                                    ? Math.min(100, (currentValue / goal.target_value) * 100)
                                    : 0;

                                return (
                                    <div key={goal.id} className="bg-ink-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {icon}
                                                <span className="font-bold text-ink-900">
                                                    {targetLabel}
                                                </span>
                                            </div>
                                            <span className="text-sm text-ink-600">
                                                {goal.goal_type === 'completion_date'
                                                    ? `${goal.target_date}`
                                                    : `${currentValue} / ${goal.target_value}`
                                                }
                                            </span>
                                        </div>
                                        {goal.target_value && (
                                            <div className="w-full h-3 bg-ink-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-accent to-amber-600 transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {goals.length === 0 && (
                    <div className="mb-8 md:mb-12 bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-ink-100 text-center">
                        <IconTarget className="w-12 h-12 text-accent mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-ink-900 mb-2">Définissez vos Objectifs</h3>
                        <p className="text-ink-600 mb-4">Fixez-vous des objectifs pour rester motivé</p>
                        <button
                            onClick={() => setShowGoalModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-accent to-amber-600 hover:from-accent-light hover:to-amber-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                            Créer mon premier objectif
                        </button>
                    </div>
                )}
            </div>

            {/* Goal Setting Modal */}
            <GoalSettingModal
                isOpen={showGoalModal}
                onClose={() => setShowGoalModal(false)}
                userId={userId}
                currentStats={{ pages: stats.pages, chapters: stats.chapters, completion: stats.completion }}
                onGoalCreated={(goal) => {
                    setGoals(prev => [...prev, goal]);
                    setShowGoalModal(false);
                }}
            />

            <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default PlumeDashboard;

const DashboardLoading = () => {
    const [step, setStep] = useState(0);
    const steps = [
        "Analyse de vos écrits...",
        "Détection des thèmes...",
        "Calcul des statistiques...",
        "Génération du rapport..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(s => (s + 1) % steps.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-rose-50/20 flex flex-col items-center justify-center p-4">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl border-2 border-accent/20 z-10">
                    <IconFeather className="w-12 h-12 text-accent animate-pulse" />
                </div>
            </div>

            <h2 className="text-2xl font-serif font-bold text-ink-900 mb-4">
                Construction de votre rapport
            </h2>

            <div className="w-64 h-2 bg-ink-100 rounded-full overflow-hidden mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-amber-600 animate-loading-bar w-1/2"></div>
            </div>

            <div className="h-6 overflow-hidden relative w-full text-center">
                <p key={step} className="text-ink-500 font-medium animate-fade-in">
                    {steps[step]}
                </p>
            </div>

            <style>{`
                @keyframes loading-bar {
                    0% { left: -50%; }
                    100% { left: 100%; }
                }
                .animate-loading-bar {
                    animation: loading-bar 1.5s infinite linear;
                }
            `}</style>
        </div>
    );
};
