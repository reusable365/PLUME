
import React, { useState, useRef, useEffect } from 'react';
import { Photo, PhotoCatalystResult } from '../types';
import { analyzePhotoWithVision, generateNarrativePrompt, uploadPhotoToSupabase, savePhotoMetadata, getAvailableCharacters } from '../services/photoAnalysisService';
import { logger } from '../utils/logger';
import { IconCamera, IconSparkles, IconUserGroup, IconMapPin, IconX, IconCheck, IconArrowRight, IconMicrophone } from './Icons';

interface PhotoCatalystProps {
    userId: string;
    userContext?: { firstName?: string; birthDate?: string };
    onComplete: (result: PhotoCatalystResult) => void;
    onClose: () => void;
}

const PhotoCatalyst: React.FC<PhotoCatalystProps> = ({ userId, userContext, onComplete, onClose }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [analyzedPhoto, setAnalyzedPhoto] = useState<Photo | null>(null);
    const [selectedAngle, setSelectedAngle] = useState<'emotion' | 'action' | 'sensory' | null>(null);

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // People Tagging State
    const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
    const [peopleInput, setPeopleInput] = useState('');
    const [availableCharacters, setAvailableCharacters] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load available characters on mount
    useEffect(() => {
        const loadCharacters = async () => {
            const chars = await getAvailableCharacters(userId);
            setAvailableCharacters(chars);
        };
        loadCharacters();
    }, [userId]);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner une image');
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Reset states
        setAnalyzedPhoto(null);
        setAudioBlob(null);
        setRecordingTime(0);
        setTaggedPeople([]);
        setPeopleInput('');
    };

    // People tagging handlers
    const handleAddPerson = (name: string) => {
        const trimmedName = name.trim();
        if (trimmedName && !taggedPeople.includes(trimmedName)) {
            setTaggedPeople([...taggedPeople, trimmedName]);
            setPeopleInput('');
            setShowSuggestions(false);
        }
    };

    const handleRemovePerson = (name: string) => {
        setTaggedPeople(taggedPeople.filter(p => p !== name));
    };

    const handlePeopleInputChange = (value: string) => {
        setPeopleInput(value);
        setShowSuggestions(value.length > 0);
    };

    const handlePeopleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && peopleInput.trim()) {
            e.preventDefault();
            handleAddPerson(peopleInput);
        }
    };

    const filteredSuggestions = availableCharacters.filter(
        char => char.toLowerCase().includes(peopleInput.toLowerCase()) && !taggedPeople.includes(char)
    );

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Timer
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            logger.error("Error accessing microphone:", error);
            alert("Impossible d'accéder au microphone. Vérifiez vos permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const deleteRecording = () => {
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const analyzePhoto = async () => {
        if (!selectedFile) return;

        setIsAnalyzing(true);
        try {
            // Passer l'audio s'il existe
            const analysis = await analyzePhotoWithVision(selectedFile, userContext, audioBlob || undefined);

            const photo: Photo = {
                id: `photo_${Date.now()}`,
                period: 'adulte',
                url: previewUrl,
                caption: analysis.description,
                uploadedAt: Date.now(),
                analysis,
                isProfilePhoto: false // Not a profile photo, it's a memory photo
            };

            setAnalyzedPhoto(photo);
        } catch (error) {
            logger.error('Erreur lors de l\'analyse:', error);
            alert('Erreur lors de l\'analyse de la photo. Veuillez réessayer.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAngleSelect = (angle: 'emotion' | 'action' | 'sensory') => {
        setSelectedAngle(angle);
    };

    const handleConfirm = async () => {
        if (!analyzedPhoto || !selectedFile || !selectedAngle) return;

        setIsSubmitting(true);
        logger.info("Starting Photo Catalyst submission...");

        try {
            const photoUrl = await uploadPhotoToSupabase(selectedFile, userId, analyzedPhoto.id!);
            const updatedPhoto: Photo = {
                ...analyzedPhoto,
                url: photoUrl,
                linkedCharacters: taggedPeople.length > 0 ? taggedPeople : undefined
            };

            await savePhotoMetadata(userId, updatedPhoto);
            const prompt = generateNarrativePrompt(updatedPhoto, selectedAngle, !!audioBlob);

            const result: PhotoCatalystResult = {
                photo: updatedPhoto,
                selectedAngle: selectedAngle,
                generatedPrompt: prompt
            };

            onComplete(result);
        } catch (error: any) {
            logger.error('Erreur lors de la sauvegarde:', error);
            alert(`Erreur lors de la sauvegarde : ${error.message || error}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-accent to-amber-600 p-6 text-center relative z-10 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <IconX className="w-6 h-6" />
                    </button>
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <IconCamera className="w-8 h-8 text-white" />
                        <IconSparkles className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-white">Catalyseur Photo</h2>
                    <p className="text-white/90 text-sm mt-2">Transformez vos photos en récits vivants</p>
                </div>

                <div className="p-8 overflow-y-auto flex-grow">
                    {/* Upload Zone */}
                    {!selectedFile && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-3 border-dashed border-accent/30 rounded-2xl p-12 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                        >
                            <IconCamera className="w-16 h-16 text-accent mx-auto mb-4" />
                            <p className="text-lg font-bold text-ink-700 mb-2">Déposez vos photos, vidéos ou pages d'album</p>
                            <p className="text-sm text-ink-500">Capturez une page entière pour raconter son histoire</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFileSelect(e.target.files[0]);
                                    }
                                }}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Preview & Analysis */}
                    {selectedFile && (
                        <div className="space-y-6 animate-fade-in pb-20">
                            {/* Photo Preview */}
                            <div className="relative rounded-xl overflow-hidden shadow-lg">
                                <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
                                {isAnalyzing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="text-center">
                                            <IconSparkles className="w-12 h-12 text-white animate-pulse mx-auto mb-2" />
                                            <p className="text-white font-bold">Analyse en cours...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Audio Recording Section - Only show if not analyzed yet */}
                            {!analyzedPhoto && !isAnalyzing && (
                                <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                                    <h3 className="text-lg font-bold text-ink-700 mb-2 flex items-center gap-2">
                                        <span className="text-2xl">🎙️</span> Racontez ce souvenir
                                    </h3>
                                    <p className="text-sm text-ink-600 mb-4">
                                        Enregistrez-vous en train de décrire la photo. L'IA utilisera votre voix pour enrichir l'analyse.
                                    </p>

                                    <div className="flex items-center justify-center gap-4">
                                        {!isRecording && !audioBlob && (
                                            <button
                                                onClick={startRecording}
                                                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-accent text-accent rounded-full font-bold hover:bg-accent hover:text-white transition-all shadow-sm"
                                            >
                                                <IconMicrophone className="w-5 h-5" />
                                                Commencer l'enregistrement
                                            </button>
                                        )}

                                        {isRecording && (
                                            <div className="flex items-center gap-4">
                                                <div className="text-red-500 font-mono font-bold animate-pulse">
                                                    🔴 Enregistrement... {formatTime(recordingTime)}
                                                </div>
                                                <button
                                                    onClick={stopRecording}
                                                    className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-all shadow-sm"
                                                >
                                                    <div className="w-4 h-4 bg-white rounded-sm" />
                                                    Arrêter
                                                </button>
                                            </div>
                                        )}

                                        {audioBlob && (
                                            <div className="flex items-center gap-4 w-full justify-between bg-white p-3 rounded-lg border border-ink-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                                        <IconCheck className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-ink-700">Audio enregistré</div>
                                                        <div className="text-xs text-ink-500">{formatTime(recordingTime)}</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={deleteRecording}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Supprimer l'enregistrement"
                                                >
                                                    <IconX className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Analyze Button */}
                                    <div className="mt-6 flex justify-center">
                                        <button
                                            onClick={analyzePhoto}
                                            className="w-full py-3 bg-accent text-white rounded-xl font-bold text-lg shadow-lg hover:bg-accent-dark transition-all flex items-center justify-center gap-2"
                                        >
                                            <IconSparkles className="w-5 h-5" />
                                            Lancer l'analyse {audioBlob ? "🎙️ Multimodale" : ""}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Analysis Results */}
                            {analyzedPhoto && !isAnalyzing && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Description */}
                                    <div className="bg-gradient-to-br from-accent/10 to-amber-50 p-6 rounded-xl border border-accent/20">
                                        <div className="flex items-start gap-3">
                                            <IconSparkles className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                                            <div>
                                                <h3 className="font-bold text-ink-700 mb-2">Analyse IA {audioBlob && "🎙️"}</h3>
                                                <p className="text-ink-600 leading-relaxed">{analyzedPhoto.analysis?.description}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {analyzedPhoto.analysis?.detectedPeriod && (
                                            <div className="bg-white border border-ink-200 rounded-lg p-4">
                                                <div className="text-xs font-bold text-ink-500 uppercase mb-1">Époque</div>
                                                <div className="text-sm font-semibold text-ink-700">{analyzedPhoto.analysis.detectedPeriod}</div>
                                            </div>
                                        )}
                                        {analyzedPhoto.analysis?.detectedLocation && (
                                            <div className="bg-white border border-ink-200 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <IconMapPin className="w-4 h-4 text-accent" />
                                                    <div className="text-xs font-bold text-ink-500 uppercase">Lieu</div>
                                                </div>
                                                <div className="text-sm font-semibold text-ink-700">{analyzedPhoto.analysis.detectedLocation}</div>
                                            </div>
                                        )}
                                        {analyzedPhoto.analysis?.mood && (
                                            <div className="bg-white border border-ink-200 rounded-lg p-4">
                                                <div className="text-xs font-bold text-ink-500 uppercase mb-1">Ambiance</div>
                                                <div className="text-sm font-semibold text-ink-700">{analyzedPhoto.analysis.mood}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detected Elements */}
                                    {(analyzedPhoto.analysis?.detectedPeople && analyzedPhoto.analysis.detectedPeople.length > 0) && (
                                        <div className="bg-white border border-ink-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <IconUserGroup className="w-5 h-5 text-accent" />
                                                <div className="text-sm font-bold text-ink-700">Personnes détectées</div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {analyzedPhoto.analysis.detectedPeople.map((person, i) => (
                                                    <span key={i} className="px-3 py-1 bg-accent/10 text-accent text-xs font-semibold rounded-full">
                                                        {person}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Narrative Angles */}
                                    <div>
                                        <h3 className="text-lg font-bold text-ink-700 mb-4 text-center">
                                            Choisissez votre angle narratif
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Emotion */}
                                            <button
                                                onClick={() => handleAngleSelect('emotion')}
                                                className={`group relative p-6 rounded-xl border-2 transition-all ${selectedAngle === 'emotion'
                                                    ? 'border-accent bg-accent/10 shadow-lg'
                                                    : 'border-ink-200 hover:border-accent/50 hover:bg-accent/5'
                                                    }`}
                                            >
                                                <div className="text-4xl mb-3">💗</div>
                                                <div className="text-sm font-bold text-accent mb-2">Émotion</div>
                                                <p className="text-xs text-ink-600 leading-relaxed">
                                                    {analyzedPhoto.analysis?.narrativeAngles?.emotion}
                                                </p>
                                                {selectedAngle === 'emotion' && (
                                                    <div className="absolute top-3 right-3">
                                                        <IconCheck className="w-5 h-5 text-accent" />
                                                    </div>
                                                )}
                                            </button>

                                            {/* Action */}
                                            <button
                                                onClick={() => handleAngleSelect('action')}
                                                className={`group relative p-6 rounded-xl border-2 transition-all ${selectedAngle === 'action'
                                                    ? 'border-accent bg-accent/10 shadow-lg'
                                                    : 'border-ink-200 hover:border-accent/50 hover:bg-accent/5'
                                                    }`}
                                            >
                                                <div className="text-4xl mb-3">⚡</div>
                                                <div className="text-sm font-bold text-accent mb-2">Action</div>
                                                <p className="text-xs text-ink-600 leading-relaxed">
                                                    {analyzedPhoto.analysis?.narrativeAngles?.action}
                                                </p>
                                                {selectedAngle === 'action' && (
                                                    <div className="absolute top-3 right-3">
                                                        <IconCheck className="w-5 h-5 text-accent" />
                                                    </div>
                                                )}
                                            </button>

                                            {/* Sensory */}
                                            <button
                                                onClick={() => handleAngleSelect('sensory')}
                                                className={`group relative p-6 rounded-xl border-2 transition-all ${selectedAngle === 'sensory'
                                                    ? 'border-accent bg-accent/10 shadow-lg'
                                                    : 'border-ink-200 hover:border-accent/50 hover:bg-accent/5'
                                                    }`}
                                            >
                                                <div className="text-4xl mb-3">👁️</div>
                                                <div className="text-sm font-bold text-accent mb-2">Sensoriel</div>
                                                <p className="text-xs text-ink-600 leading-relaxed">
                                                    {analyzedPhoto.analysis?.narrativeAngles?.sensory}
                                                </p>
                                                {selectedAngle === 'sensory' && (
                                                    <div className="absolute top-3 right-3">
                                                        <IconCheck className="w-5 h-5 text-accent" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* People Tagging Section */}
                                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                                        <h3 className="text-lg font-bold text-ink-700 mb-2 flex items-center gap-2">
                                            <IconUserGroup className="w-5 h-5 text-accent" />
                                            Qui est sur cette photo ?
                                        </h3>
                                        <p className="text-sm text-ink-600 mb-4">
                                            Identifiez les personnes présentes pour retrouver facilement toutes leurs photos
                                        </p>

                                        {/* Tagged People Display */}
                                        {taggedPeople.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {taggedPeople.map((person, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-accent/30 text-accent rounded-full font-semibold text-sm"
                                                    >
                                                        <span>{person}</span>
                                                        <button
                                                            onClick={() => handleRemovePerson(person)}
                                                            className="hover:bg-accent/10 rounded-full p-0.5 transition-colors"
                                                        >
                                                            <IconX className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Input with Autocomplete */}
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={peopleInput}
                                                onChange={(e) => handlePeopleInputChange(e.target.value)}
                                                onKeyDown={handlePeopleInputKeyDown}
                                                placeholder="Tapez un nom et appuyez sur Entrée..."
                                                className="w-full px-4 py-3 bg-white border-2 border-ink-200 rounded-xl text-ink-800 placeholder-ink-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
                                            />

                                            {/* Autocomplete Suggestions */}
                                            {showSuggestions && filteredSuggestions.length > 0 && (
                                                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-ink-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                                    {filteredSuggestions.map((char, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleAddPerson(char)}
                                                            className="w-full px-4 py-2 text-left hover:bg-accent/10 transition-colors text-ink-700 font-medium"
                                                        >
                                                            {char}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-ink-500 mt-2 italic">
                                            💡 Astuce : Les noms suggérés proviennent de vos souvenirs précédents
                                        </p>
                                    </div>

                                    {/* Help Text */}
                                    <div className="text-center text-sm text-ink-500 italic">
                                        Sélectionnez un angle pour créer un souvenir à partir de cette photo
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with Action Button */}
                {selectedFile && analyzedPhoto && !isAnalyzing && (
                    <div className="p-6 border-t border-ink-100 bg-white rounded-b-2xl sticky bottom-0 z-10">
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedAngle || isSubmitting}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${selectedAngle && !isSubmitting
                                ? 'bg-accent text-white hover:bg-accent-dark shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                : 'bg-ink-100 text-ink-400 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <IconSparkles className="w-6 h-6 animate-pulse" />
                                    Création du souvenir en cours...
                                </>
                            ) : (
                                <>
                                    <IconSparkles className="w-6 h-6" />
                                    Créer le souvenir
                                    <IconArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoCatalyst;
