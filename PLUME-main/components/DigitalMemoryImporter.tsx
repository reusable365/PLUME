import React, { useState, useRef } from 'react';
import { digitalMemoryService } from '../services/digitalMemoryService';
import { ArchiveParser } from '../services/archiveParser';
import { PublicProfileAnalyzer } from '../services/publicProfileAnalyzer';
import { DigitalMemory } from '../types';
import { IconSparkles, IconImage, IconUsers, IconBriefcase, IconFeather, IconCheck, IconUpload } from './Icons';

interface DigitalMemoryImporterProps {
    onImportComplete: (memories: DigitalMemory[]) => void;
}

export const DigitalMemoryImporter: React.FC<DigitalMemoryImporterProps> = ({ onImportComplete }) => {
    const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [foundMemories, setFoundMemories] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [profileUrls, setProfileUrls] = useState<Record<string, string>>({
        instagram: '',
        linkedin: '',
        facebook: '',
        twitter: ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleConnect = async (platform: string) => {
        if (connectedPlatforms.includes(platform)) return;

        const success = await digitalMemoryService.connectPlatform(platform);
        if (success) {
            setConnectedPlatforms([...connectedPlatforms, platform]);
        }
    };

    const handleFileUpload = async (file: File) => {
        setIsScanning(true);
        setUploadError(null);
        setScanProgress(0);

        try {
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + Math.random() * 15;
                });
            }, 200);

            const memories = await ArchiveParser.parseArchive(file);
            const enrichedMemories = await ArchiveParser.enrichMemories(memories);

            clearInterval(interval);
            setScanProgress(100);
            setFoundMemories(enrichedMemories.length);

            setTimeout(() => {
                setIsScanning(false);
                onImportComplete(enrichedMemories);
            }, 800);
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse du fichier');
            setIsScanning(false);
            setScanProgress(0);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleProfileUrlChange = (platform: string, url: string) => {
        setProfileUrls(prev => ({ ...prev, [platform]: url }));
    };

    const handleAnalyzeProfiles = async () => {
        const filledUrls = Object.entries(profileUrls).filter(([_, url]) => (url as string).trim() !== '');

        if (filledUrls.length === 0) {
            setUploadError('Veuillez saisir au moins une URL de profil');
            return;
        }

        setIsScanning(true);
        setUploadError(null);
        setScanProgress(0);

        try {
            const allMemories: DigitalMemory[] = [];

            for (const [platform, url] of filledUrls) {
                setScanProgress(prev => Math.min(prev + (80 / filledUrls.length), 90));

                // Vraie analyse avec Gemini + Google Search
                const result = await PublicProfileAnalyzer.analyzePublicProfile({
                    platform: platform as any,
                    url: url as string
                });

                if (result.success && result.data) {
                    const memories = PublicProfileAnalyzer.convertToDigitalMemories(
                        result.data,
                        { platform: platform as any, url: url as string }
                    );
                    allMemories.push(...memories);
                } else {
                    // Fallback si l'analyse échoue
                    console.warn(`Analyse échouée pour ${platform}:`, result.error);
                    const fallbackMemory: DigitalMemory = {
                        id: `${platform}_profile_fallback`,
                        platform: platform as any,
                        externalId: 'profile',
                        date: new Date().toISOString(),
                        content: `Profil ${platform} détecté: ${url}. L'analyse automatique n'a pas pu extraire d'informations (profil privé ou erreur).`,
                        analysis: {
                            emotion: 'Neutre',
                            themes: ['Profil social'],
                            suggestedAngles: [
                                'Décrivez votre parcours sur ce réseau',
                                'Quels sont vos souvenirs marquants partagés ici ?',
                                'Comment ce réseau a-t-il influencé votre vie ?'
                            ]
                        }
                    };
                    allMemories.push(fallbackMemory);
                }
            }

            setScanProgress(100);
            setFoundMemories(allMemories.length);

            setTimeout(() => {
                setIsScanning(false);
                if (allMemories.length > 0) {
                    onImportComplete(allMemories);
                } else {
                    setUploadError('Aucun souvenir n\'a pu être extrait des profils');
                }
            }, 800);

        } catch (error) {
            console.error('Erreur analyse profils:', error);
            setUploadError(error instanceof Error ? error.message : 'Erreur lors de l\'analyse des profils');
            setIsScanning(false);
            setScanProgress(0);
        }
    };

    const startScan = async () => {
        setIsScanning(true);

        const interval = setInterval(() => {
            setScanProgress(prev => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 10;
            });
            setFoundMemories(prev => prev + Math.floor(Math.random() * 5));
        }, 200);

        const memories = await digitalMemoryService.scanMemories();

        clearInterval(interval);
        setScanProgress(100);
        setFoundMemories(memories.length);

        setTimeout(() => {
            setIsScanning(false);
            onImportComplete(memories);
        }, 800);
    };

    return (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 p-8 shadow-xl max-w-2xl mx-auto transition-all duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                    <IconSparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-serif text-slate-800 mb-2">Mémoire Digitale</h2>
                <p className="text-slate-600">
                    Analysez vos profils publics ou importez vos archives pour retrouver des souvenirs oubliés.
                </p>
            </div>

            {/* URL Input Section */}
            <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <IconSparkles className="w-5 h-5 text-indigo-600" />
                    Analyse de Profil Public (IA)
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                    Collez l'URL de vos profils publics et laissez l'IA extraire votre parcours narratif.
                </p>

                <div className="space-y-3">
                    {[
                        { platform: 'instagram', placeholder: 'https://instagram.com/votre_nom', icon: IconImage },
                        { platform: 'linkedin', placeholder: 'https://linkedin.com/in/votre-nom', icon: IconBriefcase },
                        { platform: 'facebook', placeholder: 'https://facebook.com/votre.nom', icon: IconUsers },
                        { platform: 'twitter', placeholder: 'https://x.com/votre_nom', icon: IconFeather },
                    ].map((item) => (
                        <div key={item.platform} className="flex gap-2">
                            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <item.icon className="w-5 h-5 text-slate-600" />
                            </div>
                            <input
                                type="url"
                                placeholder={item.placeholder}
                                value={profileUrls[item.platform as keyof typeof profileUrls]}
                                onChange={(e) => handleProfileUrlChange(item.platform, e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                        </div>
                    ))}
                </div>

                <button
                    className="mt-4 w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAnalyzeProfiles}
                    disabled={isScanning}
                >
                    <IconSparkles className="w-4 h-4" />
                    {isScanning ? 'Analyse en cours...' : 'Analyser mes profils publics'}
                </button>
            </div>

            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/50 text-slate-500">ou importez une archive</span>
                </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`mb-8 p-8 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${isDragging
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.json,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="text-center">
                    <IconUpload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="text-slate-700 font-medium mb-1">
                        Glissez votre archive ici ou cliquez pour parcourir
                    </p>
                    <p className="text-xs text-slate-500">
                        Formats supportés: Instagram (.zip), Facebook (.json), LinkedIn (.csv)
                    </p>
                </div>
            </div>

            {uploadError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {uploadError}
                </div>
            )}

            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/50 text-slate-500">ou connectez-vous (démo)</span>
                </div>
            </div>

            {/* Platform Connection Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                    { id: 'instagram', name: 'Instagram', icon: IconImage, color: 'from-pink-500 to-orange-500' },
                    { id: 'facebook', name: 'Facebook', icon: IconUsers, color: 'from-blue-600 to-blue-700' },
                    { id: 'linkedin', name: 'LinkedIn', icon: IconBriefcase, color: 'from-blue-700 to-blue-800' },
                    { id: 'twitter', name: 'X / Twitter', icon: IconFeather, color: 'from-slate-700 to-slate-900' },
                ].map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => handleConnect(platform.id)}
                        disabled={connectedPlatforms.includes(platform.id)}
                        className={`relative group overflow-hidden p-4 rounded-xl border transition-all duration-300 ${connectedPlatforms.includes(platform.id)
                                ? 'bg-green-50 border-green-200 cursor-default'
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${platform.color} flex items-center justify-center text-white shadow-sm`}>
                                <platform.icon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="font-medium text-slate-800">{platform.name}</div>
                                <div className="text-xs text-slate-500">
                                    {connectedPlatforms.includes(platform.id) ? 'Connecté' : 'Connecter'}
                                </div>
                            </div>
                            {connectedPlatforms.includes(platform.id) && (
                                <div className="ml-auto">
                                    <IconCheck className="w-5 h-5 text-green-500" />
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {connectedPlatforms.length > 0 && !isScanning && (
                <div className="text-center animate-fade-in">
                    <button
                        onClick={startScan}
                        className="px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Scanner ma mémoire digitale
                    </button>
                </div>
            )}

            {isScanning && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between text-sm text-slate-600 mb-1">
                        <span>Analyse en cours...</span>
                        <span>{Math.round(scanProgress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-200"
                            style={{ width: `${scanProgress}%` }}
                        />
                    </div>
                    <p className="text-center text-sm text-slate-500 animate-pulse">
                        {foundMemories} souvenirs potentiels détectés...
                    </p>
                </div>
            )}
        </div>
    );
};
