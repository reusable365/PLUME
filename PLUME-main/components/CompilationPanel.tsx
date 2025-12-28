import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, Save, Edit3, Calendar, MapPin, Users, BookOpen, Heart, X, Leaf } from 'lucide-react';
import { MaturityScore } from '../hooks/useMaturityScore';

interface CompilationPanelProps {
    content: string;
    isLoading: boolean;
    onEdit: (newContent: string) => void;
    onRefresh: () => void;
    onSave?: () => void;
    onSaveAsDraft?: () => void;
    onUndo?: () => void;
    canUndo?: boolean;
    maturityScore?: MaturityScore;
    photos?: string[];
    onRemovePhoto?: (index: number) => void;
}

export const CompilationPanel: React.FC<CompilationPanelProps> = ({
    content,
    isLoading,
    onEdit,
    onRefresh,
    onSave,
    onSaveAsDraft,
    onUndo,
    canUndo,
    maturityScore,
    photos = [],
    onRemovePhoto
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(content);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const previousContentRef = useRef<string>(content);

    // Update edited content when prop changes
    useEffect(() => {
        if (content !== previousContentRef.current) {
            setEditedContent(content);
            previousContentRef.current = content;

            // Auto-scroll to bottom when new content arrives
            if (contentRef.current) {
                setTimeout(() => {
                    contentRef.current?.scrollTo({
                        top: contentRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    }, [content]);

    // Auto-save after 2 seconds of inactivity
    useEffect(() => {
        if (hasUnsavedChanges) {
            const timer = setTimeout(() => {
                handleSave();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [editedContent, hasUnsavedChanges]);

    const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
        const newContent = e.currentTarget.textContent || '';
        setEditedContent(newContent);
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        if (editedContent !== content) {
            onEdit(editedContent);
        }
        setHasUnsavedChanges(false);
    };

    const toggleEdit = () => {
        if (isEditing) {
            handleSave();
        }
        setIsEditing(!isEditing);
    };

    return (
        <div className="compilation-panel w-full md:w-96 lg:w-[28rem]">
            {/* Header */}
            <div className="compilation-panel-header">
                <div className="compilation-panel-title">
                    <Sparkles className="icon-sparkles" size={20} />
                    <div>
                        <h3 className="text-sm font-bold text-ink-800">Brouillon en Direct</h3>
                        <p className="text-[10px] text-ink-400 font-normal">Mise à jour temps réel</p>
                    </div>
                </div>
                <div className="compilation-panel-actions">
                    {hasUnsavedChanges && (
                        <span className="unsaved-indicator">
                            <Save size={14} />
                            Sauvegarde auto...
                        </span>
                    )}
                    {onSaveAsDraft && (
                        <button
                            onClick={onSaveAsDraft}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
                            title="Sauvegarder en brouillon pour y revenir plus tard"
                        >
                            <Leaf size={14} />
                            <span className="hidden sm:inline">Germer</span>
                        </button>
                    )}
                    {onSave && (
                        <button
                            onClick={onSave}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-accent hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                            title="Graver ce souvenir dans le Livre"
                        >
                            <Save size={14} />
                            <span className="hidden sm:inline">GRAVER</span>
                        </button>
                    )}
                    {canUndo && onUndo && (
                        <button
                            onClick={onUndo}
                            className="btn-icon"
                            title="Annuler (Revenir à la version précédente)"
                        >
                            <RefreshCw size={18} className="transform -scale-x-100" />
                        </button>
                    )}
                    <button
                        onClick={toggleEdit}
                        className={`btn-icon ${isEditing ? 'active' : ''}`}
                        title={isEditing ? 'Terminer l\'édition' : 'Éditer le texte'}
                    >
                        <Edit3 size={18} />
                    </button>
                    <button
                        onClick={onRefresh}
                        className="btn-icon"
                        title="Rafraîchir la compilation"
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
                    </button>
                </div>
            </div>

            {/* Maturity Visualization */}
            {maturityScore && (
                <div className="px-4 py-2 border-b border-ink-100 bg-white/50">
                    <div className="flex items-center justify-between gap-4">
                        {/* Progress Ring */}
                        <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="16" cy="16" r="14" stroke="#e2e8f0" strokeWidth="3" fill="none" />
                                    <circle cx="16" cy="16" r="14" stroke="#d97706" strokeWidth="3" fill="none" strokeDasharray={88} strokeDashoffset={88 - (88 * (maturityScore?.total || 0)) / 100} className="transition-all duration-1000 ease-out" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-ink-600">{maturityScore.total}%</span>
                            </div>
                            <span className="text-xs font-medium text-ink-500 hidden sm:inline">Maturité</span>
                        </div>

                        {/* Breakdown Icons */}
                        <div className="flex items-center gap-3">
                            <div className={`flex flex-col items-center transition-colors ${maturityScore.breakdown.metadata >= 20 ? 'text-green-600' : 'text-ink-300'}`} title="Date détectée">
                                <Calendar size={14} />
                            </div>
                            <div className={`flex flex-col items-center transition-colors ${maturityScore.breakdown.metadata >= 40 ? 'text-green-600' : 'text-ink-300'}`} title="Lieu détecté">
                                <MapPin size={14} />
                            </div>
                            <div className={`flex flex-col items-center transition-colors ${maturityScore.breakdown.metadata >= 60 ? 'text-green-600' : 'text-ink-300'}`} title="Personnage détecté">
                                <Users size={14} />
                            </div>
                            <div className="w-px h-4 bg-ink-200 mx-1" />
                            <div className={`flex flex-col items-center transition-colors ${maturityScore.breakdown.volume >= 20 ? 'text-blue-600' : 'text-ink-300'}`} title="Volume suffisant">
                                <BookOpen size={14} />
                            </div>
                            <div className={`flex flex-col items-center transition-colors ${maturityScore.breakdown.emotion >= 20 ? 'text-rose-500' : 'text-ink-300'}`} title="Émotion détectée">
                                <Heart size={14} className={maturityScore.breakdown.emotion >= 20 ? 'fill-current' : ''} />
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Photos Section */}
            {photos && photos.length > 0 && (
                <div className="px-4 py-3 bg-white/30 border-b border-ink-100 flex gap-2 overflow-x-auto">
                    {photos.map((url, index) => (
                        <div key={index} className="relative group shrink-0">
                            <img src={url} alt="Souvenir" className="h-20 w-auto rounded-lg shadow-sm border border-ink-100 object-cover" />
                            {onRemovePhoto && (
                                <button
                                    onClick={() => onRemovePhoto(index)}
                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-ink-500 hover:text-red-500"
                                    title="Supprimer la photo"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}


            {/* Content */}
            <div className="compilation-panel-content-wrapper">
                {isLoading && (
                    <div className="compilation-loading">
                        <Sparkles className="sparkles-animation" size={32} />
                        <p>Compilation en cours...</p>
                    </div>
                )}

                {!content && !isLoading && (
                    <div className="compilation-empty">
                        <Sparkles size={48} opacity={0.3} />
                        <p>Le texte compilé apparaîtra ici au fur et à mesure de votre conversation avec PLUME.</p>
                    </div>
                )}

                {content && (
                    <div
                        ref={contentRef}
                        className={`compilation-content ${isEditing ? 'editable' : ''}`}
                        contentEditable={isEditing}
                        onInput={handleContentChange}
                        onBlur={handleSave}
                        suppressContentEditableWarning
                    >
                        {editedContent}
                    </div>
                )}
            </div>
        </div>
    );
};
