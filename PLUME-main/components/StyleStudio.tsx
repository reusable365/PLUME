import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, Heart, Zap, Eye, Wind, Mountain, Feather, Pen } from 'lucide-react';

export type WritingTone = 'Authentique' | 'Humour' | 'Poétique' | 'Direct' | 'Nostalgique' | 'Lyrique' | 'Contemplatif' | 'Épique' | 'Intimiste';

export interface StyleConfig {
    tone: WritingTone;
    intensity: number; // 0-100
    authorStyle?: string;
}

interface StyleOption {
    id: WritingTone;
    name: string;
    icon: React.ReactNode;
    description: string;
    example: string;
    color: string;
}

interface AuthorStyle {
    id: string;
    name: string;
    characteristics: string[];
    tone: WritingTone;
}

const STYLE_OPTIONS: StyleOption[] = [
    {
        id: 'Authentique',
        name: 'Authentique',
        icon: <BookOpen className="w-6 h-6" />,
        description: 'Sincère, factuel, proche du témoignage',
        example: 'Je me souviens de ce jour comme si c\'était hier.',
        color: 'from-amber-500 to-orange-600'
    },
    {
        id: 'Humour',
        name: 'Humour',
        icon: <Sparkles className="w-6 h-6" />,
        description: 'Léger, ironique, avec des pointes d\'esprit',
        example: 'Évidemment, tout ne s\'est pas passé comme prévu...',
        color: 'from-yellow-400 to-amber-500'
    },
    {
        id: 'Poétique',
        name: 'Poétique',
        icon: <Feather className="w-6 h-6" />,
        description: 'Littéraire, riche en métaphores',
        example: 'Le temps s\'écoulait comme un fleuve de souvenirs dorés.',
        color: 'from-purple-500 to-pink-600'
    },
    {
        id: 'Direct',
        name: 'Direct',
        icon: <Zap className="w-6 h-6" />,
        description: 'Concis, sobre, allant droit au but',
        example: 'C\'était en 1985. J\'avais dix ans.',
        color: 'from-blue-500 to-cyan-600'
    },
    {
        id: 'Nostalgique',
        name: 'Nostalgique',
        icon: <Heart className="w-6 h-6" />,
        description: 'Mélancolique, empreint de douceur',
        example: 'Ah, ces jours d\'autrefois où tout semblait plus simple...',
        color: 'from-rose-400 to-pink-500'
    },
    {
        id: 'Lyrique',
        name: 'Lyrique',
        icon: <Wind className="w-6 h-6" />,
        description: 'Expressif, musical, chargé d\'émotions',
        example: 'Mon cœur battait au rythme de ces instants précieux.',
        color: 'from-indigo-500 to-purple-600'
    },
    {
        id: 'Contemplatif',
        name: 'Contemplatif',
        icon: <Eye className="w-6 h-6" />,
        description: 'Réflexif, philosophique, introspectif',
        example: 'Je me demande aujourd\'hui ce que signifiait vraiment ce moment.',
        color: 'from-teal-500 to-emerald-600'
    },
    {
        id: 'Épique',
        name: 'Épique',
        icon: <Mountain className="w-6 h-6" />,
        description: 'Grandiose, dramatique, héroïque',
        example: 'Ce fut le jour qui changea le cours de ma vie à jamais.',
        color: 'from-red-500 to-orange-600'
    },
    {
        id: 'Intimiste',
        name: 'Intimiste',
        icon: <Pen className="w-6 h-6" />,
        description: 'Confidentiel, pudique, en demi-teinte',
        example: 'Je n\'en ai jamais parlé à personne, mais ce jour-là...',
        color: 'from-slate-500 to-gray-600'
    }
];

const AUTHOR_STYLES: AuthorStyle[] = [
    {
        id: 'proust',
        name: 'Marcel Proust',
        characteristics: ['Phrases longues', 'Introspection profonde', 'Mémoire involontaire'],
        tone: 'Contemplatif'
    },
    {
        id: 'duras',
        name: 'Marguerite Duras',
        characteristics: ['Épuré', 'Silences', 'Non-dits', 'Sensualité'],
        tone: 'Intimiste'
    },
    {
        id: 'camus',
        name: 'Albert Camus',
        characteristics: ['Sobre', 'Existentialiste', 'Lucide'],
        tone: 'Direct'
    },
    {
        id: 'colette',
        name: 'Colette',
        characteristics: ['Sensoriel', 'Gourmand', 'Descriptif'],
        tone: 'Poétique'
    },
    {
        id: 'ernaux',
        name: 'Annie Ernaux',
        characteristics: ['Factuel', 'Sociologique', 'Auto-analyse'],
        tone: 'Authentique'
    },
    {
        id: 'gary',
        name: 'Romain Gary',
        characteristics: ['Romanesque', 'Tendre', 'Universel'],
        tone: 'Lyrique'
    }
];

interface StyleStudioProps {
    currentConfig: StyleConfig;
    onConfigChange: (config: StyleConfig) => void;
    sampleText?: string;
}

export const StyleStudio: React.FC<StyleStudioProps> = ({
    currentConfig,
    onConfigChange,
    sampleText = "Je me souviens de cette journée d'été où tout a changé."
}) => {
    const [selectedTone, setSelectedTone] = useState<WritingTone>(currentConfig.tone);
    const [intensity, setIntensity] = useState(currentConfig.intensity);
    const [selectedAuthor, setSelectedAuthor] = useState<string | null>(currentConfig.authorStyle || null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        onConfigChange({
            tone: selectedTone,
            intensity,
            authorStyle: selectedAuthor || undefined
        });
    }, [selectedTone, intensity, selectedAuthor]);

    const handleAuthorSelect = (authorId: string) => {
        const author = AUTHOR_STYLES.find(a => a.id === authorId);
        if (author) {
            setSelectedAuthor(authorId);
            setSelectedTone(author.tone);
            setIntensity(70); // Default intensity for author styles
        }
    };

    const getIntensityLabel = () => {
        if (intensity < 30) return 'Subtil';
        if (intensity < 70) return 'Modéré';
        return 'Intense';
    };

    const selectedStyle = STYLE_OPTIONS.find(s => s.id === selectedTone);

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-ink-800 mb-2">🎨 Studio de Style</h2>
                <p className="text-ink-600">Personnalisez votre voix narrative</p>
            </div>

            {/* Style Cards Grid */}
            <div>
                <h3 className="text-sm font-semibold text-ink-700 mb-3 uppercase tracking-wide">Choisissez votre ton</h3>
                <div className="grid grid-cols-2 gap-3">
                    {STYLE_OPTIONS.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => {
                                setSelectedTone(style.id);
                                setSelectedAuthor(null);
                            }}
                            className={`
                                relative p-4 rounded-lg border-2 transition-all duration-300 text-left
                                ${selectedTone === style.id && !selectedAuthor
                                    ? 'border-accent shadow-lg scale-[1.02]'
                                    : 'border-ink-200 hover:border-accent/50 hover:shadow-md'
                                }
                            `}
                        >
                            <div className={`
                                absolute inset-0 rounded-lg opacity-10 bg-gradient-to-br ${style.color}
                                ${selectedTone === style.id && !selectedAuthor ? 'opacity-20' : ''}
                            `} />
                            <div className="relative flex items-start gap-3">
                                <div className="flex-shrink-0 text-accent mt-1">
                                    {style.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-ink-800 text-base mb-1">{style.name}</h4>
                                    <p className="text-sm text-ink-600 leading-snug">{style.description}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Author Styles */}
            <div>
                <h3 className="text-sm font-semibold text-ink-700 mb-3 uppercase tracking-wide">
                    💡 Ou inspirez-vous d'un maître
                </h3>
                <div className="flex flex-wrap gap-2">
                    {AUTHOR_STYLES.map((author) => (
                        <button
                            key={author.id}
                            onClick={() => handleAuthorSelect(author.id)}
                            className={`
                                px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                                ${selectedAuthor === author.id
                                    ? 'bg-gradient-to-r from-accent to-amber-600 text-white shadow-lg'
                                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                                }
                            `}
                            title={author.characteristics.join(', ')}
                        >
                            {author.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Intensity Slider */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">🎚️ Intensité du style</h3>
                    <span className="text-sm font-bold text-accent">{getIntensityLabel()} ({intensity}%)</span>
                </div>
                <div className="relative">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={intensity}
                        onChange={(e) => setIntensity(parseInt(e.target.value))}
                        className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-accent"
                        style={{
                            background: `linear-gradient(to right, #d97706 0%, #d97706 ${intensity}%, #e5e7eb ${intensity}%, #e5e7eb 100%)`
                        }}
                    />
                    <div className="flex justify-between text-xs text-ink-500 mt-1">
                        <span>Subtil</span>
                        <span>Modéré</span>
                        <span>Intense</span>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-accent/20">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-ink-700 uppercase tracking-wide">📝 Aperçu</h3>
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-xs text-accent hover:text-accent/80 font-medium"
                    >
                        {showPreview ? 'Masquer' : 'Voir l\'exemple'}
                    </button>
                </div>
                {showPreview && selectedStyle && (
                    <div className="space-y-2">
                        <p className="text-sm text-ink-600 italic">"{selectedStyle.example}"</p>
                        {selectedAuthor && (
                            <p className="text-xs text-accent font-medium">
                                Style inspiré de {AUTHOR_STYLES.find(a => a.id === selectedAuthor)?.name}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Current Selection Summary */}
            <div className="bg-ink-50 rounded-lg p-4 border border-ink-200">
                <h4 className="text-xs font-semibold text-ink-600 mb-2 uppercase">Configuration actuelle</h4>
                <div className="space-y-1 text-sm">
                    <p><span className="font-semibold text-ink-800">Ton:</span> {selectedTone}</p>
                    <p><span className="font-semibold text-ink-800">Intensité:</span> {getIntensityLabel()} ({intensity}%)</p>
                    {selectedAuthor && (
                        <p><span className="font-semibold text-ink-800">Inspiration:</span> {AUTHOR_STYLES.find(a => a.id === selectedAuthor)?.name}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StyleStudio;
