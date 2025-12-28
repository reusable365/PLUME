import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User, Tone, Length, Fidelity, AppState, Idea, PlumeResponse } from '../types';
import { logger } from '../utils/logger';
import { LeftPanel } from './LeftPanel';
import { CompilationPanel } from './CompilationPanel';
import MessageBubble from './MessageBubble';
import { RegenerateModal, RegenerateSettings } from './RegenerateModal';
import { Menu } from 'lucide-react';
import { useMaturityScore } from '../hooks/useMaturityScore';

interface StudioViewProps {
    user: User | null;
    userProfile: any;
    tone: Tone;
    length: Length;
    fidelity: Fidelity;
    setTone: (t: Tone) => void;
    setLength: (l: Length) => void;
    setFidelity: (f: Fidelity) => void;
    ideas: Idea[];
    onAddIdea: (title: string, content: string, tag: string) => void;
    onDeleteIdea: (id: string) => void;
    onConvertIdea: (id: string) => void;
    draftContent: string;
    setDraftContent: (content: string) => void;
    onInsertDraft: () => void;
    compiledText: string;
    isCompiling: boolean;
    onCompilationEdit: (text: string) => void;
    onCompilationRefresh: () => void;
    autoCompile: (msgs?: ChatMessage[]) => void;
    aggregatedData: AppState['aggregatedData'];
    // Chat Session Props
    sessionMessages: ChatMessage[];
    isSending: boolean;
    onSendMessage: (text: string, isSacred?: boolean) => Promise<any>;
    onQuestionClick?: (messageId: string, questionIndex: number) => Promise<void>;
    onInsertDivider: (label?: string) => Promise<void>;
    onUndo?: () => void;
    canUndo?: boolean;
    onSave?: () => void;
    onSaveAsDraft?: () => void;
    onOpenPhotoCatalyst?: () => void;
    draftPhotos?: string[];
    onRemovePhoto?: (index: number) => void;
    // Voice Recording
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    isRecording?: boolean;
    voiceTranscript?: string; // Transcription from voice recording
    // Regeneration
    onRegenerate?: (messageId: string, settings: RegenerateSettings) => Promise<void>;
    isRegenerating?: boolean;
}

export const StudioView: React.FC<StudioViewProps> = ({
    user,
    userProfile,
    tone,
    length,
    fidelity,
    setTone,
    setLength,
    setFidelity,
    ideas,
    onAddIdea,
    onDeleteIdea,
    onConvertIdea,
    draftContent,
    setDraftContent,
    onInsertDraft,
    compiledText,
    isCompiling,
    onCompilationEdit,
    onCompilationRefresh,
    autoCompile,
    aggregatedData,
    sessionMessages,
    isSending,
    onSendMessage,
    onQuestionClick,
    onInsertDivider,
    onUndo,
    canUndo,
    onSave,
    onSaveAsDraft,
    onOpenPhotoCatalyst,
    draftPhotos,
    onRemovePhoto,
    onStartRecording,
    onStopRecording,
    isRecording,
    voiceTranscript,
    onRegenerate,
    isRegenerating = false
}) => {
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
    const [regenerateTargetMessageId, setRegenerateTargetMessageId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isSacred, setIsSacred] = useState(false);


    // Note: voiceTranscript is now used as dynamic placeholder instead of syncing to input
    // This provides a subtle hint without pre-filling the textarea
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // SESSION ISOLATION is now handled in App.tsx (line ~390)
    // sessionMessages already contains only the current session's messages
    // We just use them directly here
    const currentSessionMessages = sessionMessages;

    // Maturity Score - use session messages for accurate calculation
    const maturityScore = useMaturityScore(currentSessionMessages, draftContent, aggregatedData);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sessionMessages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isSending) return;
        const text = input;
        setInput('');

        // Pass isSacred flag
        // Pass isSacred flag
        await onSendMessage(text, isSacred);

        // Note: isSacred intentionally NOT reset here to keep mode active
    };

    const handleIdeaClick = async (idea: Idea) => {
        await onInsertDivider();
        // Consuming the idea: convert it (mark as used) so it disappears from chest but stays in history
        onConvertIdea(idea.id);

        const autoPrompt = `Je sélectionne cette idée de mon coffre: "${idea.title || 'Note'}".Contenu : "${idea.content}".Analyse et guide-moi.`;
        await onSendMessage(autoPrompt);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-paper-50 relative">
            {/* LEFT PANEL */}
            <LeftPanel
                isCollapsed={!showLeftPanel}
                onToggle={() => setShowLeftPanel(!showLeftPanel)}
                ideas={ideas}
                onAddIdea={onAddIdea}
                onDeleteIdea={onDeleteIdea}
                onIdeaClick={handleIdeaClick}
                tone={tone}
                length={length}
                fidelity={fidelity}
                onToneChange={setTone}
                onLengthChange={setLength}
                onFidelityChange={setFidelity}
                // Mode Verbatim Toggle
                onDataChange={(key, value) => {
                    if (key === 'verbatim' && value === true) {
                        setFidelity(Fidelity.HAUTE);
                    }
                }}
            />

            {/* CENTER PANEL - Chat */}
            <div className="center-panel flex-1 flex flex-col h-full relative transition-all duration-300">
                <div className="md:hidden h-12 bg-white border-b border-ink-100 flex items-center justify-between px-4 shrink-0">
                    <button onClick={() => setShowLeftPanel(!showLeftPanel)} className="p-2 text-ink-500 hover:text-ink-800">
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-serif font-bold text-ink-800">Chapitre en cours</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
                    {currentSessionMessages.map((msg, index) => (
                        <div key={msg.id}>
                            <MessageBubble
                                message={msg}
                                onSaveIdea={(title, content, tag) => onAddIdea(title, content, tag)}
                                onQuestionClick={async (messageId, questionIndex) => {
                                    if (onQuestionClick) {
                                        await onQuestionClick(messageId, questionIndex);
                                    }
                                }}
                                onAddToDraft={(text) => {
                                    const newContent = draftContent ? `${draftContent}\n\n${text}` : text;
                                    setDraftContent(newContent);
                                }}
                                onDeleteMessage={() => { }}
                                onInitiateRegenerate={(messageId) => {
                                    setRegenerateTargetMessageId(messageId);
                                    setRegenerateModalOpen(true);
                                }}
                                isLastAssistantMessage={msg.role === 'assistant' && index === currentSessionMessages.length - 1}
                                existingIdeas={ideas.map(i => ({ title: i.title || '', content: i.content }))}
                            />
                        </div>
                    ))}
                    {isSending && (
                        <div className="flex justify-start mb-8">
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-ink-100 flex items-center gap-3">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-ink-500 text-sm font-serif italic">Plume réfléchit...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="w-full bg-white border-t border-ink-100 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-20 mb-16 md:mb-0">
                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className="max-w-5xl mx-auto mb-3 px-4 py-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-3 animate-fade-in">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-red-700">
                                🎤 Enregistrement en cours... Parlez librement, cliquez à nouveau pour arrêter.
                            </span>
                        </div>
                    )}

                    <div className="max-w-5xl mx-auto relative group bg-white border-2 border-ink-100 rounded-2xl focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 transition-all shadow-sm hover:shadow-md">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder={voiceTranscript || "Racontez-moi un souvenir..."}
                            className="w-full bg-transparent border-none px-4 md:px-6 py-4 text-base md:text-lg text-ink-800 placeholder-ink-300 placeholder:italic focus:outline-none focus:ring-0 resize-none min-h-[100px] max-h-[400px] font-sans rounded-t-2xl"
                            rows={3}
                            disabled={isSending}
                        />

                        {/* Toolbar Area */}
                        <div className="px-2 pb-2 md:px-4 md:pb-3 flex justify-between items-center bg-transparent rounded-b-2xl border-t border-ink-50">
                            {/* Left Actions */}
                            <div className="flex gap-1 md:gap-2">
                                <button
                                    onClick={() => onOpenPhotoCatalyst?.()}
                                    disabled={isSending}
                                    className="p-2 md:p-2.5 rounded-lg bg-ink-50 text-ink-600 hover:bg-accent/10 hover:text-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Ajouter une photo"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>

                                {/* Voice Recording Button */}
                                <button
                                    onClick={() => isRecording ? onStopRecording?.() : onStartRecording?.()}
                                    disabled={isSending}
                                    className={`p-2 md:p-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-ink-50 text-ink-600 hover:bg-accent/10 hover:text-accent'
                                        }`}
                                    title={isRecording ? "Arrêter l'enregistrement" : "Enregistrement vocal"}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </button>

                                {/* Sacred Mode Button (Verbatim) */}
                                <button
                                    onClick={() => setIsSacred(!isSacred)}
                                    className={`p-2 md:p-2.5 rounded-lg transition-all ${isSacred ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-sm' : 'bg-ink-50 text-ink-600 hover:bg-accent/10 hover:text-accent'}`}
                                    title="Mode Import (Texte Sacré) : Votre texte sera conservé tel quel"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.571-4.187m9-3.957A12.21 12.21 0 0012 3a12.21 12.21 0 00-6.666 1.98" />
                                    </svg>
                                </button>
                            </div>

                            {/* Right Actions */}
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => onInsertDivider()}
                                    disabled={isSending}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    title="Commencer un nouveau souvenir"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                    <span className="hidden md:inline">Nouveau souvenir</span>
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!input.trim() || isSending}
                                    className={`p-2 md:p-3 rounded-xl transition-all ${input.trim() && !isSending ? 'bg-accent text-white shadow-lg hover:bg-accent hover:shadow-xl transform hover:-translate-y-0.5' : 'bg-ink-100 text-ink-300 cursor-not-allowed'}`}
                                    title="Envoyer"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - Compilation */}
            <div className="w-1/3 bg-white border-l border-ink-100 hidden lg:block overflow-hidden relative">
                <CompilationPanel
                    content={compiledText}
                    isLoading={isCompiling}
                    onRefresh={onCompilationRefresh}
                    onEdit={onCompilationEdit}
                    maturityScore={maturityScore}
                    onSave={onSave}
                    onSaveAsDraft={onSaveAsDraft}
                    onUndo={onUndo}
                    canUndo={canUndo}
                    photos={draftPhotos}
                    onRemovePhoto={onRemovePhoto}
                />
            </div>

            {/* Regenerate Modal */}
            <RegenerateModal
                isOpen={regenerateModalOpen}
                onClose={() => {
                    setRegenerateModalOpen(false);
                    setRegenerateTargetMessageId(null);
                }}
                onRegenerate={async (settings) => {
                    if (regenerateTargetMessageId && onRegenerate) {
                        await onRegenerate(regenerateTargetMessageId, settings);
                        // If user checked "apply as default", update global settings
                        if (settings.applyAsDefault) {
                            setTone(settings.tone);
                            setLength(settings.length);
                            if (settings.authenticity >= 90) {
                                setFidelity(Fidelity.HAUTE);
                            } else {
                                setFidelity(Fidelity.BASSE);
                            }
                        }
                        setRegenerateModalOpen(false);
                        setRegenerateTargetMessageId(null);
                    }
                }}
                currentTone={tone}
                currentLength={length}
                currentFidelity={fidelity}
                isLoading={isRegenerating}
            />
        </div>
    );
};
