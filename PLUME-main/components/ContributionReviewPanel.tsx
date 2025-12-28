import React, { useState, useEffect } from 'react';
import { X, Check, Edit3, Trash2, Users, Merge, MessageSquare, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { IconFeather } from './Icons';
import { WitnessContribution, getPendingContributions, updateContributionStatus, mergeWitnessContribution, detectWitnessContradictions, arbitrateWitnessContribution, ContradictionDetection } from '../services/witnessService';
import { supabase } from '../services/supabaseClient';
import { logger } from '../utils/logger';

interface ContributionReviewPanelProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onContributionIntegrated?: (chapterId: string, newContent: string) => void;
}

type IntegrationMode = 'fusion' | 'annotation' | 'section' | 'manual' | 'diplomatic' | 'author' | 'witness';

const ContributionReviewPanel: React.FC<ContributionReviewPanelProps> = ({
    userId,
    isOpen,
    onClose,
    onContributionIntegrated
}) => {
    const [contributions, setContributions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedContribution, setSelectedContribution] = useState<any | null>(null);
    const [integrationMode, setIntegrationMode] = useState<IntegrationMode>('fusion');
    const [isIntegrating, setIsIntegrating] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [contradiction, setContradiction] = useState<ContradictionDetection | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadContributions();
        }
    }, [isOpen, userId]);

    const loadContributions = async () => {
        setIsLoading(true);
        try {
            // FIX: Use guest_invites instead of non-existent guest_contributions
            const { data, error } = await supabase
                .from('guest_invites')
                .select(`
                    *,
                    chapters:chapter_id (id, title, content, user_id)
                `)
                .eq('status', 'answered')
                .order('updated_at', { ascending: false });

            if (error) throw error;

            console.log('[DEBUG] Loaded contributions:', data);

            // Map guest_invites structure to what component expects
            const mappedContributions = (data || [])
                // Show all answered invites, even if chapter link is missing (fallback to title)
                .map((c: any) => ({
                    ...c,
                    content: c.answer, // Map answer to content
                    contribution_type: 'text',
                    chapters: c.chapters || { title: c.title || 'Souvenir (Lien manquant)', content: '' }
                }));

            setContributions(mappedContributions);
        } catch (error) {
            logger.error('Error loading contributions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectContribution = async (contribution: any) => {
        setSelectedContribution(contribution);
        setIntegrationMode('fusion');
        setContradiction(null);

        // Analyze for contradictions
        if (contribution.chapters?.content) {
            setIsAnalyzing(true);
            try {
                const detection = await detectWitnessContradictions(
                    contribution.chapters.content,
                    contribution.content,
                    contribution.guest_name
                );
                setContradiction(detection);

                // If contradiction found, default to diplomatic arbitration
                if (detection.hasContradiction) {
                    setIntegrationMode('diplomatic');
                    const preview = await arbitrateWitnessContribution(
                        contribution.chapters.content,
                        contribution.content,
                        contribution.guest_name,
                        'diplomatic'
                    );
                    setPreviewContent(preview);
                } else {
                    // Normal fusion
                    const preview = await mergeWitnessContribution(
                        contribution.chapters.content,
                        contribution.content,
                        contribution.guest_name,
                        'fusion'
                    );
                    setPreviewContent(preview);
                }
            } catch (error) {
                logger.error('Error in analysis:', error);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleModeChange = async (mode: IntegrationMode) => {
        setIntegrationMode(mode);

        if (selectedContribution && selectedContribution.chapters?.content) {
            if (mode === 'manual') {
                setPreviewContent(selectedContribution.chapters.content);
            } else if (['diplomatic', 'author', 'witness'].includes(mode)) {
                setIsIntegrating(true);
                try {
                    const preview = await arbitrateWitnessContribution(
                        selectedContribution.chapters.content,
                        selectedContribution.content,
                        selectedContribution.guest_name,
                        mode as 'diplomatic' | 'author' | 'witness'
                    );
                    setPreviewContent(preview);
                } finally {
                    setIsIntegrating(false);
                }
            } else {
                try {
                    const preview = await mergeWitnessContribution(
                        selectedContribution.chapters.content,
                        selectedContribution.content,
                        selectedContribution.guest_name,
                        mode as 'fusion' | 'annotation' | 'section'
                    );
                    setPreviewContent(preview);
                } catch (error) {
                    logger.error('Error generating preview:', error);
                }
            }
        }
    };

    const handleIntegrate = async () => {
        if (!selectedContribution) return;

        setIsIntegrating(true);
        try {
            // Update chapter with merged content
            const { error: updateError } = await supabase
                .from('chapters')
                .update({
                    content: previewContent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedContribution.chapters.id);

            if (updateError) throw updateError;

            // Mark contribution as integrated
            await updateContributionStatus(selectedContribution.id, 'integrated');

            // Notify parent
            if (onContributionIntegrated) {
                onContributionIntegrated(selectedContribution.chapters.id, previewContent);
            }

            // Refresh list
            setContributions(contributions.filter(c => c.id !== selectedContribution.id));
            setSelectedContribution(null);
            setPreviewContent('');

        } catch (error) {
            logger.error('Error integrating contribution:', error);
        } finally {
            setIsIntegrating(false);
        }
    };

    const handleReject = async (contributionId: string) => {
        try {
            await updateContributionStatus(contributionId, 'rejected');
            setContributions(contributions.filter(c => c.id !== contributionId));
            if (selectedContribution?.id === contributionId) {
                setSelectedContribution(null);
            }
        } catch (error) {
            logger.error('Error rejecting contribution:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-xl">
                                <Users size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Contributions des témoins</h2>
                                <p className="text-white/80 text-sm">
                                    {contributions.length} contribution{contributions.length !== 1 ? 's' : ''} en attente
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Contributions List */}
                    <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                            </div>
                        ) : contributions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                                <Users className="w-12 h-12 text-slate-300 mb-3" />
                                <p className="text-slate-500">Aucune contribution en attente</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {contributions.map((contribution) => (
                                    <div
                                        key={contribution.id}
                                        onClick={() => handleSelectContribution(contribution)}
                                        className={`p-4 cursor-pointer transition-all ${selectedContribution?.id === contribution.id
                                            ? 'bg-purple-50 border-l-4 border-purple-500'
                                            : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-slate-900">
                                                {contribution.guest_name}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReject(contribution.id);
                                                }}
                                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Ignorer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                                            {contribution.content}
                                        </p>
                                        <div className="text-xs text-slate-400">
                                            Pour : {contribution.chapters?.title || 'Souvenir'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {selectedContribution ? (
                            <div className="space-y-6">
                                {/* Contribution Info */}
                                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">
                                            {selectedContribution.guest_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <span className="font-bold text-purple-900">
                                                {selectedContribution.guest_name}
                                            </span>
                                            <span className="text-purple-600 text-sm ml-2">
                                                a contribué à "{selectedContribution.chapters?.title}"
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-purple-800 leading-relaxed">
                                        {selectedContribution.content}
                                    </p>
                                </div>

                                {/* Contradiction Alert */}
                                {isAnalyzing ? (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                                        <Sparkles className="text-blue-500" size={20} />
                                        <span className="text-blue-700 text-sm font-medium">Analyse des divergences en cours...</span>
                                    </div>
                                ) : contradiction?.hasContradiction && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-amber-800 font-bold">
                                            <AlertTriangle size={20} />
                                            <span>Mode Arbitre : Contradiction détectée</span>
                                        </div>
                                        <div className="space-y-2">
                                            {contradiction.findings.map((finding, idx) => (
                                                <div key={idx} className="bg-white/50 p-2 rounded-lg text-xs">
                                                    <p className="font-bold text-amber-900 mb-1">Divergence : {finding.topic}</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="border-r border-amber-100 pr-2">
                                                            <span className="text-slate-400">Vous :</span> {finding.authorVersion}
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400">{selectedContribution.guest_name} :</span> {finding.witnessVersion}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Integration Mode Selection */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3">
                                        Comment intégrer ce témoignage ?
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {contradiction?.hasContradiction ? (
                                            <>
                                                <button
                                                    onClick={() => handleModeChange('diplomatic')}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${integrationMode === 'diplomatic'
                                                        ? 'border-amber-500 bg-amber-50'
                                                        : 'border-slate-200 hover:border-amber-300'
                                                        }`}
                                                >
                                                    <Merge className={`w-5 h-5 mb-2 ${integrationMode === 'diplomatic' ? 'text-amber-600' : 'text-slate-400'
                                                        }`} />
                                                    <span className="block font-bold text-slate-900">Diplomatique</span>
                                                    <span className="text-xs text-slate-500">
                                                        Fusionne les deux versions (Doute)
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={() => handleModeChange('author')}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${integrationMode === 'author'
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-slate-200 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    <Check className={`w-5 h-5 mb-2 ${integrationMode === 'author' ? 'text-indigo-600' : 'text-slate-400'
                                                        }`} />
                                                    <span className="block font-bold text-slate-900">Ma parole d'abord</span>
                                                    <span className="text-xs text-slate-500">
                                                        Note le doute du témoin
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={() => handleModeChange('witness')}
                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${integrationMode === 'witness'
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-slate-200 hover:border-emerald-300'
                                                        }`}
                                                >
                                                    <Users className={`w-5 h-5 mb-2 ${integrationMode === 'witness' ? 'text-emerald-600' : 'text-slate-400'
                                                        }`} />
                                                    <span className="block font-bold text-slate-900">Parole au témoin</span>
                                                    <span className="text-xs text-slate-500">
                                                        Adopte sa version
                                                    </span>
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleModeChange('fusion')}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${integrationMode === 'fusion'
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-slate-200 hover:border-purple-300'
                                                    }`}
                                            >
                                                <Sparkles className={`w-5 h-5 mb-2 ${integrationMode === 'fusion' ? 'text-purple-600' : 'text-slate-400'
                                                    }`} />
                                                <span className="block font-bold text-slate-900">Fusion IA</span>
                                                <span className="text-xs text-slate-500">
                                                    PLUME enrichit votre texte
                                                </span>
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleModeChange('annotation')}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${integrationMode === 'annotation'
                                                ? 'border-purple-500 bg-purple-50'
                                                : 'border-slate-200 hover:border-purple-300'
                                                }`}
                                        >
                                            <MessageSquare className={`w-5 h-5 mb-2 ${integrationMode === 'annotation' ? 'text-purple-600' : 'text-slate-400'
                                                }`} />
                                            <span className="block font-bold text-slate-900">Note marginale</span>
                                            <span className="text-xs text-slate-500">
                                                Témoignage en annexe
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-500" />
                                        Aperçu du résultat
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 max-h-60 overflow-y-auto">
                                        {integrationMode === 'manual' ? (
                                            <textarea
                                                value={previewContent}
                                                onChange={(e) => setPreviewContent(e.target.value)}
                                                className="w-full min-h-[200px] bg-transparent text-slate-800 leading-relaxed resize-none outline-none font-serif"
                                            />
                                        ) : (
                                            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-serif">
                                                {previewContent}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedContribution(null)}
                                        className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleIntegrate}
                                        disabled={isIntegrating}
                                        className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isIntegrating ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                        ) : (
                                            <>
                                                <Check size={18} />
                                                Intégrer au souvenir
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                                <p className="text-slate-500">
                                    Sélectionnez une contribution pour l'examiner
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContributionReviewPanel;
