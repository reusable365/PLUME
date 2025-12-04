import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User, Tone, Length, Fidelity, AppState, Idea, PlumeResponse } from '../types';
import { LeftPanel } from './LeftPanel';
import { CompilationPanel } from './CompilationPanel';
import MessageBubble from './MessageBubble';
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
    onSendMessage: (text: string) => Promise<any>;
    onQuestionClick?: (messageId: string, questionIndex: number) => Promise<void>;
    onInsertDivider: (label?: string) => Promise<void>;
    onSave?: () => void;
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
    onSave
}) => {
    const [showLeftPanel, setShowLeftPanel] = useState(true);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Maturity Score
    const maturityScore = useMaturityScore(sessionMessages, draftContent, aggregatedData);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sessionMessages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isSending) return;
        const text = input;
        setInput('');

        const result = await onSendMessage(text);
        if (result) {
            // Trigger auto-compile with the updated history
            autoCompile([...sessionMessages, result.userMsg, result.aiMsg]);
        }
    };

    const handleIdeaClick = async (idea: Idea) => {
        await onInsertDivider();
        const autoPrompt = `Je sélectionne cette idée de mon coffre: "${idea.title || 'Note'}".Contenu : "${idea.content}".Analyse et guide-moi.`;
        const result = await onSendMessage(autoPrompt);
        if (result) {
            autoCompile([result.userMsg, result.aiMsg]);
        }
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
                    {sessionMessages.map((msg, index) => (
                        <div key={msg.id}>
                            <MessageBubble
                                message={msg}
                                onSaveIdea={(title, content, tag) => onAddIdea(title, content, tag)}
                                onQuestionClick={async (messageId, questionIndex) => {
                                    // Use the parent's handleQuestionClick if provided
                                    if (onQuestionClick) {
                                        await onQuestionClick(messageId, questionIndex);
                                    }
                                }}
                                onAddToDraft={(text) => {
                                    const newContent = draftContent ? `${draftContent}\n\n${text}` : text;
                                    setDraftContent(newContent);
                                }}
                                onDeleteMessage={() => {/* TODO: implement delete */ }}
                                onInitiateRegenerate={() => {/* TODO: implement regenerate */ }}
                                isLastAssistantMessage={msg.role === 'assistant' && index === sessionMessages.length - 1}
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
                    <div className="max-w-5xl mx-auto relative group bg-white border-2 border-ink-100 rounded-2xl focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10 transition-all shadow-sm hover:shadow-md">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Racontez-moi un souvenir..."
                            className="w-full bg-transparent border-none px-4 md:px-6 py-4 text-base md:text-lg text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-0 resize-none min-h-[100px] max-h-[400px] font-sans rounded-t-2xl"
                            rows={3}
                            disabled={isSending}
                        />

                        {/* Toolbar Area */}
                        <div className="px-2 pb-2 md:px-4 md:pb-3 flex justify-between items-center bg-transparent rounded-b-2xl border-t border-ink-50">
                            {/* Left Actions */}
                            <div className="flex gap-1 md:gap-2">
                                <button
                                    onClick={() => {/* TODO: Open photo catalyst */ }}
                                    disabled={isSending}
                                    className="p-2 md:p-2.5 rounded-lg bg-ink-50 text-ink-600 hover:bg-accent/10 hover:text-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Ajouter une photo"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Right Actions */}
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => onInsertDivider()}
                                    disabled={isSending}
                                    className="p-2 md:p-2.5 rounded-lg bg-ink-50 text-ink-600 hover:bg-accent/10 hover:text-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Nouveau sujet"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                                    </svg>
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
            <CompilationPanel
                content={compiledText}
                isLoading={isCompiling}
                onEdit={onCompilationEdit}
                onRefresh={onCompilationRefresh}
                maturityScore={maturityScore}
                onSave={onSave}
            />
        </div>
    );
};
