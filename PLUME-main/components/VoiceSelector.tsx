
import React from 'react';
import { Voice } from '../services/ttsService';
import { Crown, Mic2, Star } from 'lucide-react';

interface VoiceSelectorProps {
    voices: Voice[];
    selectedVoiceId: string;
    onSelect: (voiceId: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedVoiceId, onSelect }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {voices.map((voice) => {
                const isSelected = selectedVoiceId === voice.id;
                const isPremium = voice.is_premium;

                return (
                    <button
                        key={voice.id}
                        onClick={() => onSelect(voice.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${isSelected
                                ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <div className={`p-2 rounded-lg ${isPremium ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isPremium ? <Star className="w-5 h-5" /> : <Mic2 className="w-5 h-5" />}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                                    {voice.name}
                                </h4>
                                {isPremium && (
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                        <Crown className="w-3 h-3" /> PREMIUM
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 capitalize">
                                {voice.provider} • {voice.gender === 'female' ? 'Femme' : 'Homme'}
                            </p>
                        </div>

                        {isSelected && (
                            <div className="absolute top-4 right-4 w-3 h-3 bg-indigo-600 rounded-full animate-pulse" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
