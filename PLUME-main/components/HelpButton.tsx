/**
 * HelpButton.tsx
 * Bouton d'aide global flottant avec menu d'options
 */

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, BookOpen, Play, MessageCircle, X, ChevronRight, Search } from 'lucide-react';
import { GUIDE_SECTIONS, GLOSSARY, FAQ, searchHelp } from '../data/helpContent';

interface HelpButtonProps {
    /** Callback pour lancer le tour */
    onStartTour: () => void;
    /** Callback pour ouvrir le guide complet */
    onOpenGuide?: () => void;
    /** Callback pour ouvrir une section spécifique */
    onOpenSection?: (sectionId: string) => void;
    /** Position du bouton */
    position?: 'bottom-right' | 'bottom-left';
}

export const HelpButton: React.FC<HelpButtonProps> = ({
    onStartTour,
    onOpenGuide,
    onOpenSection,
    position = 'bottom-right',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'menu' | 'guide' | 'glossary' | 'faq'>('menu');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fermer si clic en dehors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Fermer avec Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const positionClasses = {
        'bottom-right': 'right-6 bottom-6',
        'bottom-left': 'left-6 bottom-6',
    };

    const handleStartTour = () => {
        setIsOpen(false);
        onStartTour();
    };

    const handleSectionClick = (sectionId: string) => {
        if (onOpenSection) {
            onOpenSection(sectionId);
            setIsOpen(false);
        } else {
            setExpandedSection(expandedSection === sectionId ? null : sectionId);
        }
    };

    const searchResults = searchQuery.length > 1 ? searchHelp(searchQuery) : null;

    return (
        <div className={`fixed ${positionClasses[position]} z-50`} ref={menuRef}>
            {/* Menu Panel */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-ink-100 overflow-hidden animate-fade-in">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookOpen size={20} />
                                <h3 className="font-bold text-lg">Centre d'Aide</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="mt-3 relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-200" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher..."
                                className="w-full pl-9 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-amber-200 text-sm focus:outline-none focus:bg-white/30"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-ink-100">
                        {[
                            { id: 'menu', label: 'Menu' },
                            { id: 'guide', label: 'Guide' },
                            { id: 'glossary', label: 'Glossaire' },
                            { id: 'faq', label: 'FAQ' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-2 text-xs font-semibold transition-colors ${activeTab === tab.id
                                        ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                                        : 'text-ink-500 hover:text-ink-700 hover:bg-ink-50'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto">
                        {/* Search Results */}
                        {searchQuery.length > 1 && searchResults && (
                            <div className="p-4">
                                <h4 className="text-xs font-bold text-ink-500 uppercase mb-2">
                                    Résultats pour "{searchQuery}"
                                </h4>
                                {searchResults.glossary.length === 0 && searchResults.faq.length === 0 ? (
                                    <p className="text-sm text-ink-500 italic">Aucun résultat trouvé</p>
                                ) : (
                                    <div className="space-y-2">
                                        {searchResults.glossary.map((item, i) => (
                                            <div key={i} className="p-2 bg-amber-50 rounded-lg">
                                                <span className="font-bold text-amber-800">{item.icon} {item.term}</span>
                                                <p className="text-xs text-ink-600">{item.definition}</p>
                                            </div>
                                        ))}
                                        {searchResults.faq.map((item, i) => (
                                            <div key={i} className="p-2 bg-blue-50 rounded-lg">
                                                <span className="font-bold text-blue-800">{item.question}</span>
                                                <p className="text-xs text-ink-600">{item.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Menu Tab */}
                        {!searchQuery && activeTab === 'menu' && (
                            <div className="p-4 space-y-3">
                                {/* Lancer le tour */}
                                <button
                                    onClick={handleStartTour}
                                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Play size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className="font-bold block">Lancer le tutoriel</span>
                                        <span className="text-xs text-white/80">Visite guidée de PLUME</span>
                                    </div>
                                </button>

                                {/* Guide rapide */}
                                <button
                                    onClick={() => setActiveTab('guide')}
                                    className="w-full flex items-center gap-3 p-3 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors"
                                >
                                    <div className="bg-ink-200 p-2 rounded-lg">
                                        <BookOpen size={18} className="text-ink-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <span className="font-bold block text-ink-800">Guide rapide</span>
                                        <span className="text-xs text-ink-500">Parcourir les sections</span>
                                    </div>
                                    <ChevronRight size={16} className="text-ink-400" />
                                </button>

                                {/* FAQ */}
                                <button
                                    onClick={() => setActiveTab('faq')}
                                    className="w-full flex items-center gap-3 p-3 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors"
                                >
                                    <div className="bg-ink-200 p-2 rounded-lg">
                                        <MessageCircle size={18} className="text-ink-600" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <span className="font-bold block text-ink-800">Questions fréquentes</span>
                                        <span className="text-xs text-ink-500">Réponses rapides</span>
                                    </div>
                                    <ChevronRight size={16} className="text-ink-400" />
                                </button>
                            </div>
                        )}

                        {/* Guide Tab */}
                        {!searchQuery && activeTab === 'guide' && (
                            <div className="p-4 space-y-2">
                                {GUIDE_SECTIONS.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => handleSectionClick(section.id)}
                                        className="w-full flex items-center gap-3 p-3 bg-ink-50 rounded-xl hover:bg-ink-100 transition-colors text-left"
                                    >
                                        <span className="text-2xl">{section.icon}</span>
                                        <div className="flex-1">
                                            <span className="font-bold block text-ink-800">{section.title}</span>
                                            <span className="text-xs text-ink-500">{section.description}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-ink-400" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Glossary Tab */}
                        {!searchQuery && activeTab === 'glossary' && (
                            <div className="p-4 space-y-2">
                                {GLOSSARY.map((item, i) => (
                                    <div key={i} className="p-3 bg-ink-50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="font-bold text-ink-800">{item.term}</span>
                                        </div>
                                        <p className="text-xs text-ink-600 leading-relaxed">{item.definition}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* FAQ Tab */}
                        {!searchQuery && activeTab === 'faq' && (
                            <div className="p-4 space-y-2">
                                {FAQ.map((item, i) => (
                                    <details key={i} className="group bg-ink-50 rounded-xl overflow-hidden">
                                        <summary className="p-3 cursor-pointer font-bold text-ink-800 text-sm list-none flex items-center justify-between hover:bg-ink-100 transition-colors">
                                            {item.question}
                                            <ChevronRight size={16} className="text-ink-400 group-open:rotate-90 transition-transform" />
                                        </summary>
                                        <div className="px-3 pb-3 text-xs text-ink-600 leading-relaxed">
                                            {item.answer}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 bg-ink-50 border-t border-ink-100 text-center">
                        <p className="text-xs text-ink-500">
                            Besoin d'aide ? <a href="mailto:support@plume-app.com" className="text-amber-600 hover:underline">support@plume-app.com</a>
                        </p>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all transform hover:scale-110 ${isOpen
                        ? 'bg-ink-800 text-white rotate-45'
                        : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'
                    }`}
                aria-label="Ouvrir l'aide"
            >
                {isOpen ? <X size={24} /> : <HelpCircle size={24} />}
            </button>
        </div>
    );
};

export default HelpButton;
