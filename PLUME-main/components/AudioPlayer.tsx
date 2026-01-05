
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2, Volume2, Download } from 'lucide-react';

interface AudioPlayerProps {
    src: string | null;
    isLoading?: boolean;
    onPlay?: () => void;
    title?: string; // For download filename
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isLoading = false, onPlay, title = 'audio' }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (src && audioRef.current) {
            audioRef.current.src = src;
            // Reset state on new source
            setIsPlaying(false);
            setProgress(0);
        }
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current || !src) return;

        if (onPlay && !src) {
            onPlay();
            return;
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setDuration(total);
            if (total > 0) {
                setProgress((current / total) * 100);
            }
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (audioRef.current && duration > 0) {
            const newTime = (val / 100) * duration;
            audioRef.current.currentTime = newTime;
            setProgress(val);
        }
    };

    const formatTime = (secs: number) => {
        if (!secs || isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 w-full max-w-md">
            <button
                onClick={togglePlay}
                disabled={isLoading && !src}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLoading
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg scale-100 active:scale-95'
                    }`}
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                    <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
                />
            </div>

            {src && (
                <a
                    href={src}
                    download={`${title}.mp3`}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Télécharger"
                >
                    <Download className="w-4 h-4" />
                </a>
            )}

            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onLoadedMetadata={handleTimeUpdate}
                onError={() => setIsPlaying(false)}
                className="hidden"
            />
        </div>
    );
};
