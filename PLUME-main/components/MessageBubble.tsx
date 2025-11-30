

import React from 'react';
import { ChatMessage, PlumeResponse } from '../types';
import { IconFeather, IconUser, IconArrowRight, IconCheck, IconFileText, IconLink, IconMagic, IconTrash, IconRefresh, IconScissors, IconSparkles } from './Icons';

interface MessageBubbleProps {
    message: ChatMessage;
    onSaveIdea: (title: string, content: string, tag: string) => void;
    onQuestionClick?: (messageId: string, index: number) => void;
    onAddToDraft?: (text: string, messageId: string) => void;
    onDeleteMessage: (messageId: string) => void;
    onInitiateRegenerate: (messageId: string) => void; // Changed from onRegenerate
    isLastAssistantMessage: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSaveIdea, onQuestionClick, onAddToDraft, onDeleteMessage, onInitiateRegenerate, isLastAssistantMessage }) => {
    const isUser = message.role === 'user';

    if (message.isDivider) {
        return (
            <div className="flex items-center text-center my-8 animate-fade-in">
                <div className="flex-1 border-t border-dashed border-ink-200"></div>
                <div className="flex items-center gap-2 mx-4 text-xs font-bold text-ink-400 uppercase tracking-widest">
                    <IconScissors className="w-4 h-4" />
                    <span>Nouveau Souvenir</span>
                </div>
                <div className="flex-1 border-t border-dashed border-ink-200"></div>
            </div>
        );
    }

    // Gestion du contenu: string simple (User) ou PlumeResponse (Assistant)
    let contentText = "";
    let plumeContent: PlumeResponse | null = null;

    if (isUser) {
        // Si le contenu utilisateur est un objet (après synthèse), on prend le texte
        contentText = typeof message.content === 'string' ? message.content : (message.content as any).text || '';
    } else {
        // Pour l'assistant, le contenu est toujours un objet PlumeResponse
        plumeContent = message.content as PlumeResponse;
        contentText = plumeContent.narrative;
    }

    // États spéciaux
    const isDrafted = plumeContent?.isDrafted === true;
    const isSynthesized = message.isSynthesized === true || plumeContent?.isSynthesized === true;
    const isSynthesisResult = plumeContent?.isSynthesisResult === true;

    // Parsing spécial pour les souvenirs digitaux
    const digitalMemoryMatch = isUser && typeof contentText === 'string' ? contentText.match(/\[CONTEXTE_MEMOIRE_DIGITALE\]([\s\S]*?)\[\/CONTEXTE_MEMOIRE_DIGITALE\]/) : null;

    let digitalMemoryData = null;
    if (digitalMemoryMatch) {
        const rawData = digitalMemoryMatch[1];
        digitalMemoryData = {
            platform: rawData.match(/Plateforme: (.*)/)?.[1] || 'Inconnu',
            date: rawData.match(/Date: (.*)/)?.[1] || '',
            content: rawData.match(/Contenu original: "(.*)"/)?.[1] || '',
            analysis: rawData.match(/Analyse IA: (.*)/)?.[1] || '',
            suggestions: rawData.match(/Suggestions: (.*)/)?.[1] || '',
            userPrompt: contentText.replace(digitalMemoryMatch[0], '').trim()
        };
    }

    if (isUser) {
        if (digitalMemoryData) {
            return (
                <div className={`flex justify-end mb-6 animate-fade-in transition-opacity duration-500 ${isSynthesized ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                    <div className="max-w-[85%] md:max-w-[70%] group relative">
                        <div className="flex items-center justify-end gap-2 mb-1 opacity-60">
                            <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">Souvenir Digital</span>
                            <IconSparkles className="w-4 h-4 text-indigo-500" />
                        </div>

                        {/* Carte Souvenir Digital */}
                        <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden mb-2">
                            {/* En-tête avec Plateforme */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                                <span className="font-bold text-indigo-800 text-xs uppercase tracking-wider">{digitalMemoryData.platform}</span>
                                <span className="text-xs text-indigo-400">{new Date(digitalMemoryData.date).toLocaleDateString()}</span>
                            </div>

                            {/* Image (si présente) */}
                            {message.imageUrl && (
                                <div className="w-full h-48 overflow-hidden bg-slate-100 relative group-hover:opacity-95 transition-opacity">
                                    <img src={message.imageUrl} alt="Souvenir" className="w-full h-full object-cover" />
                                </div>
                            )}

                            {/* Contenu */}
                            <div className="p-4">
                                <div className="text-sm text-slate-700 italic mb-3 border-l-2 border-indigo-200 pl-3">
                                    "{digitalMemoryData.content}"
                                </div>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {digitalMemoryData.analysis.split(',').map((tag, i) => (
                                        <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-md">
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Prompt utilisateur (si présent) */}
                        {digitalMemoryData.userPrompt && (
                            <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none p-4 shadow-sm text-sm md:text-base">
                                {digitalMemoryData.userPrompt}
                            </div>
                        )}

                        {/* Action Buttons on hover */}
                        <div className="absolute top-1/2 -left-12 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                                onClick={() => onDeleteMessage(message.id)}
                                title="Supprimer ce message"
                                className="p-1.5 rounded-full bg-white text-ink-400 hover:text-red-500 hover:bg-red-50 shadow-md border border-ink-100">
                                <IconTrash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`flex justify-end mb-6 animate-fade-in transition-opacity duration-500 ${isSynthesized ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                <div className="max-w-[85%] md:max-w-[70%] group relative">
                    <div className="flex items-center justify-end gap-2 mb-1 opacity-60">
                        {isSynthesized && <IconLink className="w-3 h-3 text-ink-400" />}
                        <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">Vous</span>
                        <IconUser className="w-4 h-4" />
                    </div>
                    <div className={`border rounded-2xl rounded-tr-none p-4 shadow-sm whitespace-pre-wrap font-sans text-sm md:text-base ${isSynthesized
                        ? 'bg-ink-50 border-ink-100 text-ink-500 italic'
                        : 'bg-white border-ink-200 text-ink-800'
                        }`}>
                        {message.imageUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden border border-ink-100">
                                <img src={message.imageUrl} alt="Souvenir" className="w-full h-auto object-cover max-h-64" />
                            </div>
                        )}
                        {contentText}
                        {isSynthesized && (
                            <div className="mt-2 pt-2 border-t border-ink-200/50 text-[10px] uppercase font-bold text-ink-400 flex items-center gap-1">
                                <IconLink className="w-3 h-3" /> Source compilée
                            </div>
                        )}
                    </div>
                    {/* Action Buttons on hover */}
                    <div className="absolute top-1/2 -left-12 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                            onClick={() => onDeleteMessage(message.id)}
                            title="Supprimer ce message"
                            className="p-1.5 rounded-full bg-white text-ink-400 hover:text-red-500 hover:bg-red-50 shadow-md border border-ink-100">
                            <IconTrash className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- ASSISTANT MESSAGE ---
    if (!plumeContent) return null;

    const hasSelectedQuestion = plumeContent.selectedQuestionIndex !== undefined && plumeContent.selectedQuestionIndex !== null;
    const selectedQuestion = hasSelectedQuestion && plumeContent.questions ? plumeContent.questions[plumeContent.selectedQuestionIndex!] : null;

    return (
        <div className={`flex justify-start mb-10 animate-fade-in transition-all duration-500 ${isDrafted ? 'opacity-90' : ''} ${isSynthesized ? 'opacity-50 grayscale' : ''}`}>
            <div className="max-w-[95%] md:max-w-[85%] w-full group relative">

                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1 rounded-full ${isDrafted ? 'bg-emerald-500' :
                        isSynthesisResult ? 'bg-indigo-500' :
                            isSynthesized ? 'bg-ink-400' : 'bg-accent'
                        } text-white transition-colors`}>
                        {isDrafted ? <IconCheck className="w-4 h-4" /> : (
                            isSynthesisResult ? <IconMagic className="w-4 h-4" /> : <IconFeather className="w-4 h-4" />
                        )}
                    </div>
                    <span className="text-xs font-medium text-ink-500 uppercase tracking-wider">
                        {isSynthesisResult ? 'PLUME (Synthèse Magique)' : 'PLUME'}
                    </span>
                    {isDrafted && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-emerald-200">
                            Validé & Versé
                        </span>
                    )}
                    {isSynthesized && !isDrafted && (
                        <span className="text-[10px] bg-ink-100 text-ink-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-ink-200 flex items-center gap-1">
                            <IconLink className="w-3 h-3" /> Archivé
                        </span>
                    )}
                    {isSynthesisResult && !isDrafted && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-indigo-200 animate-pulse">
                            Nouveau Récit Consolidé
                        </span>
                    )}
                </div>

                {/* Action Buttons on hover (for assistant) */}
                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-30">
                    {isLastAssistantMessage && !isDrafted && (
                        <button
                            onClick={() => onInitiateRegenerate(message.id)}
                            title="Régénérer cette proposition"
                            className="p-1.5 rounded-full bg-white text-ink-400 hover:text-accent hover:bg-amber-50 shadow-md border border-ink-100">
                            <IconRefresh className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => onDeleteMessage(message.id)}
                        title="Supprimer ce bloc"
                        className="p-1.5 rounded-full bg-white text-ink-400 hover:text-red-500 hover:bg-red-50 shadow-md border border-ink-100">
                        <IconTrash className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Narrative Section - The Star */}
                <div className={`bg-paper border-l-4 p-6 md:p-8 shadow-sm mb-4 rounded-r-lg relative transition-all duration-500 ${isDrafted
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : isSynthesisResult
                        ? 'border-indigo-500 bg-indigo-50/20 shadow-md ring-1 ring-indigo-100'
                        : isSynthesized
                            ? 'border-ink-300 bg-ink-50 border-dashed'
                            : 'border-accent'
                    }`}>
                    {/* Filigrane visuel si versé */}
                    {isDrafted && (
                        <div className="absolute top-4 right-4 opacity-10 pointer-events-none rotate-[-15deg]">
                            <IconFileText className="w-24 h-24 text-emerald-800" />
                        </div>
                    )}

                    <div className={`font-serif text-lg md:text-xl text-ink-900 leading-relaxed text-justify relative z-10 ${isDrafted || isSynthesized ? 'text-ink-600' : ''}`}>
                        {plumeContent.narrative}
                    </div>

                    {/* Action Bar */}
                    {!isSynthesized && (
                        <div className="mt-4 flex justify-end opacity-100 transition-opacity relative z-20">
                            {isDrafted ? (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded text-xs font-bold uppercase tracking-wide cursor-default">
                                    <IconCheck className="w-3.5 h-3.5" />
                                    <span>Versé dans l'ébauche</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onAddToDraft && onAddToDraft(plumeContent!.narrative, message.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-xs font-medium transition-all shadow-sm group-hover:shadow-md ${isSynthesisResult
                                        ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700'
                                        : 'bg-white border-ink-200 text-ink-600 hover:text-accent hover:border-accent'
                                        }`}
                                    title="Copier ce texte dans votre ébauche de travail"
                                >
                                    <span>Verser dans l'ébauche</span>
                                    <IconArrowRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Suggestion Intégrée */}
                    {plumeContent.suggestion && !isDrafted && !isSynthesized && (
                        <div className="mt-6 pt-4 border-t border-ink-200/50 flex flex-col sm:flex-row items-start gap-3 relative z-10">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-accent uppercase tracking-wider block mb-1">
                                    Idée Suggérée : {plumeContent.suggestion.tag}
                                </span>
                                <div className="text-sm font-semibold text-ink-800">{plumeContent.suggestion.title}</div>
                                <div className="text-xs text-ink-500 italic mt-0.5">{plumeContent.suggestion.content}</div>
                            </div>
                            <button
                                onClick={() => onSaveIdea(plumeContent!.suggestion!.title, plumeContent!.suggestion!.content, plumeContent!.suggestion!.tag)}
                                className="shrink-0 px-3 py-1.5 bg-white border border-ink-200 hover:border-accent text-ink-600 hover:text-accent rounded text-xs font-medium transition-all shadow-sm whitespace-nowrap"
                            >
                                + Ajouter au coffre
                            </button>
                        </div>
                    )}
                </div>

                {/* Maieutic 3-Angle Choices (Hidden if synthesized or drafted) */}
                {plumeContent.questions && plumeContent.questions.length > 0 && !isDrafted && !isSynthesized && (
                    <div className="mt-4">
                        {!hasSelectedQuestion ? (
                            // CAS 1 : AUCUN CHOIX FAIT -> ON AFFICHE LES 3 OPTIONS
                            <>
                                <div className="text-ink-400 text-[10px] font-bold uppercase tracking-widest mb-3 ml-1">
                                    Choisissez votre angle pour continuer
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {plumeContent.questions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => onQuestionClick && onQuestionClick(message.id, idx)}
                                            className="group flex flex-col items-start p-3 bg-white border border-ink-200 rounded-lg hover:border-accent hover:shadow-md transition-all text-left relative overflow-hidden"
                                        >
                                            <div className={`absolute top-0 left-0 w-1 h-full ${q.type === 'emotion' ? 'bg-rose-400' :
                                                q.type === 'action' ? 'bg-amber-400' : 'bg-emerald-400'
                                                } opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                                            <span className={`text-[10px] font-bold uppercase mb-1 ${q.type === 'emotion' ? 'text-rose-600' :
                                                q.type === 'action' ? 'text-amber-600' : 'text-emerald-600'
                                                }`}>
                                                {q.label}
                                            </span>
                                            <span className="text-sm text-ink-700 group-hover:text-ink-900 leading-snug">
                                                {q.text}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : selectedQuestion ? (
                            // CAS 2 : CHOIX FAIT -> ON AFFICHE UNIQUEMENT LA QUESTION CHOISIE (Mode "Verrouillé")
                            <div className="animate-fade-in">
                                <div className="flex items-center gap-2 mb-2 ml-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Angle choisi :</span>
                                    <span className={`text-[10px] font-bold uppercase ${selectedQuestion.type === 'emotion' ? 'text-rose-600' :
                                        selectedQuestion.type === 'action' ? 'text-amber-600' : 'text-emerald-600'
                                        }`}>
                                        {selectedQuestion.label}
                                    </span>
                                </div>
                                <div className={`p-4 bg-white border-l-4 rounded-r-lg shadow-sm ${selectedQuestion.type === 'emotion' ? 'border-rose-400' :
                                    selectedQuestion.type === 'action' ? 'border-amber-400' : 'border-emerald-400'
                                    }`}>
                                    <p className="text-ink-800 font-medium text-base italic">
                                        "{selectedQuestion.text}"
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}

            </div>
        </div>
    );
};

export default MessageBubble;
