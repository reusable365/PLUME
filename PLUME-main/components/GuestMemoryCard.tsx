import React, { useState, useEffect } from 'react';
import { Mic, Image as ImageIcon, Send, Sparkles, MapPin, Calendar, Info, X, Check, ChevronRight, ArrowLeft, Feather } from 'lucide-react';
import { IconFeather } from './Icons';
import { supabase } from '../services/supabaseClient';
import { generateWitnessQuestions, reformulateWitnessNarrative, saveWitnessContribution, WitnessResponse } from '../services/witnessService';
import { logger } from '../utils/logger';

interface GuestMemoryCardProps {
    souvenirId?: string;
    authorName?: string;
    memoryTitle?: string;
    memoryContext?: {
        location: string;
        date: string;
        tags: string[];
        excerpt?: string;
    };
    authorQuestion?: string;
    isModal?: boolean;
    onComplete?: (text?: string) => void;
    inviteToken?: string;
}

const GuestMemoryCard: React.FC<GuestMemoryCardProps> = ({
    souvenirId,
    authorName = "Stéphane",
    memoryTitle = "L'été en Bretagne",
    memoryContext = {
        location: "Saint-Malo, France",
        date: "Août 1998",
        tags: ["Plage", "Cerf-volant", "Orage"],
        excerpt: ""
    },
    authorQuestion = "Je me souviens qu'on a perdu les clés de la voiture... mais qui est allé chercher de l'aide au village ?",
    isModal = false,
    onComplete,
    inviteToken
}) => {
    // Flow states
    const [step, setStep] = useState<'welcome' | 'interview' | 'recap' | 'revealed'>('welcome');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Interview data
    const [questions, setQuestions] = useState<string[]>([]);
    const [responses, setResponses] = useState<WitnessResponse[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [guestName, setGuestName] = useState('');

    // UI states
    const [isLoading, setIsLoading] = useState(false);
    const [reformulatedText, setReformulatedText] = useState('');
    const [showInfo, setShowInfo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load questions when starting interview
    useEffect(() => {
        if (step === 'interview' && questions.length === 0) {
            loadQuestions();
        }
    }, [step]);

    const loadQuestions = async () => {
        setIsLoading(true);
        try {
            const generatedQuestions = await generateWitnessQuestions({
                title: memoryTitle,
                excerpt: memoryContext.excerpt || '',
                location: memoryContext.location,
                date: memoryContext.date,
                tags: memoryContext.tags,
                authorQuestion
            });
            setQuestions(generatedQuestions);
        } catch (error) {
            logger.error('Error loading questions:', error);
            // Fallback questions
            setQuestions([
                "Fermez les yeux un instant... Que voyez-vous de ce moment ? Quel temps faisait-il ?",
                "Que s'est-il passé exactement selon vos souvenirs ?",
                authorQuestion
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartInterview = () => {
        if (!guestName.trim()) return;
        setStep('interview');
    };

    const handleNextQuestion = () => {
        if (!currentAnswer.trim()) return;

        // Save current response
        const newResponse: WitnessResponse = {
            question: questions[currentQuestionIndex],
            answer: currentAnswer,
            step: currentQuestionIndex + 1
        };
        setResponses([...responses, newResponse]);
        setCurrentAnswer('');

        // Move to next question or recap
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            generateRecap([...responses, newResponse]);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setCurrentAnswer(responses[currentQuestionIndex - 1]?.answer || '');
            setResponses(responses.slice(0, -1));
        }
    };

    const generateRecap = async (allResponses: WitnessResponse[]) => {
        setIsLoading(true);
        try {
            const narrative = await reformulateWitnessNarrative(
                allResponses,
                guestName,
                { title: memoryTitle, authorName }
            );
            setReformulatedText(narrative);
            setStep('recap');
        } catch (error) {
            logger.error('Error generating recap:', error);
            setReformulatedText(allResponses.map(r => r.answer).join('\n\n'));
            setStep('recap');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (inviteToken) {
                // Determine user_id from token logic or pass it?
                // GuestLandingPage fetched the invite. We actually need the INVITE row to link or just update it?
                // Use RPC function to bypass RLS for public guest submission
                const { error } = await supabase.rpc('submit_guest_answer', {
                    _token: inviteToken,
                    _answer: reformulatedText
                });

                if (error) {
                    console.error('[DEBUG] RPC submit_guest_answer failed:', error);
                    throw error;
                }
            } else if (souvenirId) {
                await saveWitnessContribution(
                    souvenirId,
                    guestName,
                    '', // relation not captured in this flow
                    reformulatedText,
                    responses
                );
            }
            setStep('revealed');
            if (onComplete) {
                setTimeout(() => onComplete(reformulatedText), 3000);
            }
        } catch (error) {
            logger.error('Error saving contribution:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditRecap = () => {
        // Allow editing the reformulated text
    };

    // PLUME avatar animation
    const PlumeAvatar = ({ speaking = false }: { speaking?: boolean }) => (
        <div className={`relative ${speaking ? 'animate-pulse' : ''}`}>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <IconFeather className="w-6 h-6 text-white" />
            </div>
            {speaking && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping" />
            )}
        </div>
    );

    return (
        <div className={`${isModal ? 'h-full bg-[#fcfbf9] rounded-3xl' : 'min-h-screen bg-[#fcfbf9]'} font-sans text-slate-800 flex flex-col relative overflow-hidden transition-all`}>
            {/* Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-amber-50/80 to-transparent pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-amber-600 p-1.5 rounded-lg shadow-sm">
                        <IconFeather className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-serif font-bold text-xl tracking-tight text-slate-900">PLUME</span>
                </div>
                <button
                    onClick={() => setShowInfo(true)}
                    className="text-slate-400 hover:text-amber-600 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                    <Info size={16} />
                    <span className="hidden sm:inline">C'est quoi Plume ?</span>
                </button>
            </header>

            <main className="flex-1 relative z-10 flex flex-col items-center px-4 pb-8 max-w-2xl mx-auto w-full">

                {/* Progress indicator for interview */}
                {step === 'interview' && questions.length > 0 && (
                    <div className="w-full mb-6">
                        <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                            <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
                            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* WELCOME STEP */}
                {step === 'welcome' && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {/* Author profile */}
                        <div className="text-center mb-6">
                            <div className="relative inline-block mb-3">
                                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-tr from-amber-100 to-orange-100 flex items-center justify-center text-2xl font-serif text-amber-700">
                                    {authorName.charAt(0)}
                                </div>
                                <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
                            </div>
                            <h1 className="text-2xl font-serif font-bold text-slate-900 mb-1">
                                Aidez <span className="text-amber-600">{authorName}</span> à écrire sa vie
                            </h1>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                Il manque une pièce au puzzle. Votre mémoire est précieuse.
                            </p>
                        </div>

                        {/* Memory context card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1">
                                    <MapPin size={12} /> {memoryContext.location}
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1">
                                    <Calendar size={12} /> {memoryContext.date}
                                </span>
                            </div>

                            <h2 className="text-xl font-serif font-bold text-slate-800 mb-3">
                                "{memoryTitle}"
                            </h2>

                            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                                <p className="text-slate-700 italic leading-relaxed">
                                    {authorQuestion}
                                </p>
                            </div>
                        </div>

                        {/* Guest name input */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Comment vous appelez-vous ?
                            </label>
                            <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Votre prénom"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-lg"
                            />
                        </div>

                        {/* Start button */}
                        <button
                            onClick={handleStartInterview}
                            disabled={!guestName.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${guestName.trim()
                                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Commencer <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {/* INTERVIEW STEP */}
                {step === 'interview' && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <PlumeAvatar speaking />
                                <p className="mt-4 text-slate-600">PLUME prépare vos questions...</p>
                            </div>
                        ) : (
                            <>
                                {/* PLUME question bubble */}
                                <div className="flex gap-4">
                                    <PlumeAvatar speaking />
                                    <div className="flex-1 bg-white rounded-2xl rounded-tl-none shadow-sm border border-slate-200 p-5">
                                        <p className="text-slate-800 text-lg leading-relaxed">
                                            {questions[currentQuestionIndex]}
                                        </p>
                                    </div>
                                </div>

                                {/* Answer input */}
                                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                                    <textarea
                                        value={currentAnswer}
                                        onChange={(e) => setCurrentAnswer(e.target.value)}
                                        placeholder="Je me souviens que..."
                                        rows={4}
                                        className="w-full p-5 text-lg text-slate-800 placeholder-slate-300 resize-none outline-none font-sans"
                                        autoFocus
                                    />

                                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                        <button
                                            onClick={handlePreviousQuestion}
                                            disabled={currentQuestionIndex === 0}
                                            className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all ${currentQuestionIndex === 0
                                                ? 'text-slate-300 cursor-not-allowed'
                                                : 'text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            <ArrowLeft size={16} /> Précédent
                                        </button>

                                        <button
                                            onClick={handleNextQuestion}
                                            disabled={!currentAnswer.trim()}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${currentAnswer.trim()
                                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {currentQuestionIndex < questions.length - 1 ? 'Suivant' : 'Terminer'}
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* RECAP STEP */}
                {step === 'recap' && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <PlumeAvatar speaking />
                                <p className="mt-4 text-slate-600">PLUME reformule votre témoignage...</p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-4">
                                    <h2 className="text-2xl font-serif font-bold text-slate-900">
                                        Votre témoignage
                                    </h2>
                                    <p className="text-slate-500 text-sm">Vérifiez et confirmez avant envoi</p>
                                </div>

                                {/* Reformulated contribution */}
                                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 relative">
                                    <div className="absolute top-4 right-4 flex items-center gap-1 text-amber-600">
                                        <Sparkles size={14} />
                                        <span className="text-xs font-medium">Reformulé par PLUME</span>
                                    </div>

                                    <textarea
                                        value={reformulatedText}
                                        onChange={(e) => setReformulatedText(e.target.value)}
                                        rows={8}
                                        className="w-full text-slate-800 leading-relaxed resize-none outline-none font-serif text-lg"
                                    />

                                    <div className="mt-4 pt-4 border-t border-slate-100 text-right text-sm text-slate-500 italic">
                                        — {guestName}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setStep('interview');
                                            setCurrentQuestionIndex(0);
                                            setResponses([]);
                                            setCurrentAnswer('');
                                        }}
                                        className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Recommencer
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                        ) : (
                                            <>
                                                <Send size={18} />
                                                Envoyer à {authorName}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* REVEALED STEP - Thank you & teaser */}
                {step === 'revealed' && (
                    <div className="w-full space-y-6 animate-fadeIn">
                        {/* Success message */}
                        <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check size={32} className="text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-green-800 mb-1">Merci {guestName} !</h3>
                            <p className="text-green-700/80">
                                {authorName} sera ravi de redécouvrir ce moment grâce à vous.
                            </p>
                        </div>

                        {/* Book excerpt teaser */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 relative overflow-hidden group cursor-pointer">
                            <div className="absolute top-0 right-0 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                                Extrait du livre
                            </div>

                            <div className="flex items-center gap-2 mb-4 opacity-50">
                                <IconFeather className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-serif text-slate-400">Écrit par {authorName} avec PLUME</span>
                            </div>

                            <p className="font-serif text-lg text-slate-800 leading-relaxed blur-sm group-hover:blur-none transition-all duration-700">
                                "Ce jour-là, le vent soufflait si fort que le sable nous fouettait les jambes. Je tenais la main de mon père, et malgré l'orage qui grondait au loin, je me sentais invulnérable..."
                            </p>

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-500">
                                <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium text-slate-600 shadow-sm border border-slate-200">
                                    Survolez pour lire l'extrait
                                </span>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
                            <h3 className="font-serif text-xl font-bold mb-2 relative z-10">Et vous ?</h3>
                            <p className="text-slate-300 text-sm mb-6 relative z-10">
                                Vous avez aussi des souvenirs qui méritent d'être gravés ?
                            </p>
                            <button className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-amber-50 transition-colors relative z-10">
                                Commencer mon livre gratuitement
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Info Modal */}
            {showInfo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowInfo(false)}>
                    <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-amber-600 p-1.5 rounded-lg">
                                <IconFeather className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-serif font-bold text-xl text-slate-900">PLUME</span>
                        </div>

                        <h3 className="font-bold text-lg text-slate-900 mb-2">Le gardien de vos souvenirs</h3>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            PLUME est une application qui aide chacun à écrire le livre de sa vie. Grâce à une IA bienveillante, vos souvenirs oraux ou écrits sont transformés en un récit littéraire magnifique.
                        </p>

                        <div className="bg-amber-50 rounded-xl p-4 mb-4">
                            <h4 className="font-bold text-amber-800 text-sm mb-1">Pourquoi votre aide compte ?</h4>
                            <p className="text-amber-700/80 text-xs">
                                La mémoire est collective. En partageant votre point de vue, vous enrichissez l'histoire de {authorName} avec des détails qu'il a peut-être oubliés.
                            </p>
                        </div>

                        <button onClick={() => setShowInfo(false)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors">
                            J'ai compris
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestMemoryCard;
