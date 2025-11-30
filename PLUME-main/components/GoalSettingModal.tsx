import React, { useState } from 'react';
import { IconX, IconTarget, IconCheck, IconCalendar, IconBook } from './Icons';
import { supabase } from '../services/supabaseClient';
import { themeKeywords } from '../services/analyticsService';

export interface WritingGoal {
    id?: string;
    user_id: string;
    goal_type: 'pages' | 'chapters' | 'completion_date' | 'theme';
    target_value?: number;
    target_date?: string;
    theme?: string;
    current_value: number;
    status: 'active' | 'completed' | 'abandoned';
    created_at?: string;
    completed_at?: string;
}

interface GoalSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    currentStats: { pages: number; chapters: number; completion: number };
    onGoalCreated: (goal: WritingGoal) => void;
}

const GoalSettingModal: React.FC<GoalSettingModalProps> = ({
    isOpen,
    onClose,
    userId,
    currentStats,
    onGoalCreated
}) => {
    const [goalType, setGoalType] = useState<'pages' | 'chapters' | 'completion_date' | 'theme'>('pages');
    const [targetValue, setTargetValue] = useState<number>(200);
    const [targetDate, setTargetDate] = useState<string>('');
    const [selectedTheme, setSelectedTheme] = useState<string>('Enfance');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const goal: WritingGoal = {
                user_id: userId,
                goal_type: goalType,
                target_value: goalType !== 'completion_date' ? targetValue : undefined,
                target_date: goalType === 'completion_date' ? targetDate : undefined,
                theme: goalType === 'theme' ? selectedTheme : undefined,
                current_value: goalType === 'pages' ? currentStats.pages :
                    goalType === 'chapters' ? currentStats.chapters :
                        goalType === 'theme' ? 0 : // Will be calculated in Dashboard
                            currentStats.completion,
                status: 'active'
            };

            const { data, error } = await supabase
                .from('writing_goals')
                .insert(goal)
                .select()
                .single();

            if (error) throw error;

            onGoalCreated(data);
            onClose();
        } catch (error) {
            console.error('Error creating goal:', error);
            alert('Erreur lors de la création de l\'objectif');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-ink-400 hover:text-ink-700 hover:bg-ink-100 rounded-xl transition-colors"
                >
                    <IconX className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-br from-accent to-amber-600 p-3 rounded-2xl">
                        <IconTarget className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-ink-900">Définir un Objectif</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Goal Type Selection */}
                    <div>
                        <label className="block text-sm font-bold text-ink-700 mb-3">Type d'objectif</label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => setGoalType('pages')}
                                className={`p-3 rounded-xl border-2 transition-all ${goalType === 'pages'
                                    ? 'border-accent bg-accent/10 text-accent font-bold'
                                    : 'border-ink-200 text-ink-600 hover:border-ink-300'
                                    }`}
                            >
                                Pages
                            </button>
                            <button
                                type="button"
                                onClick={() => setGoalType('chapters')}
                                className={`p-3 rounded-xl border-2 transition-all ${goalType === 'chapters'
                                    ? 'border-accent bg-accent/10 text-accent font-bold'
                                    : 'border-ink-200 text-ink-600 hover:border-ink-300'
                                    }`}
                            >
                                Chapitres
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setGoalType('completion_date')}
                                className={`p-3 rounded-xl border-2 transition-all ${goalType === 'completion_date'
                                    ? 'border-accent bg-accent/10 text-accent font-bold'
                                    : 'border-ink-200 text-ink-600 hover:border-ink-300'
                                    }`}
                            >
                                Date
                            </button>
                            <button
                                type="button"
                                onClick={() => setGoalType('theme')}
                                className={`p-3 rounded-xl border-2 transition-all ${goalType === 'theme'
                                    ? 'border-accent bg-accent/10 text-accent font-bold'
                                    : 'border-ink-200 text-ink-600 hover:border-ink-300'
                                    }`}
                            >
                                Période / Thème
                            </button>
                        </div>
                    </div>

                    {/* Theme Selection */}
                    {goalType === 'theme' && (
                        <div>
                            <label className="block text-sm font-bold text-ink-700 mb-2">
                                Choisir une période ou un thème
                            </label>
                            <select
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-ink-200 rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-lg font-medium bg-white"
                            >
                                {Object.keys(themeKeywords).map(theme => (
                                    <option key={theme} value={theme}>{theme}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Target Value or Date */}
                    {goalType === 'completion_date' ? (
                        <div>
                            <label className="block text-sm font-bold text-ink-700 mb-2">
                                Date cible
                            </label>
                            <input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 border-2 border-ink-200 rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all"
                                required
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-bold text-ink-700 mb-2">
                                {goalType === 'theme'
                                    ? `Objectif de pages sur "${selectedTheme}"`
                                    : `Objectif de ${goalType === 'pages' ? 'pages' : 'chapitres'}`
                                }
                            </label>
                            <input
                                type="number"
                                value={targetValue}
                                onChange={(e) => setTargetValue(parseInt(e.target.value))}
                                min={1}
                                className="w-full px-4 py-3 border-2 border-ink-200 rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all text-lg font-semibold"
                                required
                            />
                            {goalType !== 'theme' && (
                                <p className="text-xs text-ink-500 mt-2">
                                    Actuel : {goalType === 'pages' ? currentStats.pages : currentStats.chapters} {goalType === 'pages' ? 'pages' : 'chapitres'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-ink-100 hover:bg-ink-200 text-ink-700 rounded-xl font-semibold transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-accent to-amber-600 hover:from-accent-light hover:to-amber-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span>Création...</span>
                            ) : (
                                <>
                                    <IconCheck className="w-5 h-5" />
                                    Créer l'objectif
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalSettingModal;
