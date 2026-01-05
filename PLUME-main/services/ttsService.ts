
import { supabase } from './supabaseClient';
import { logger } from '../utils/logger';
import CryptoJS from 'crypto-js';

// Interfaces
export interface Voice {
    id: string;
    provider: 'google' | 'elevenlabs';
    name: string;
    gender: 'male' | 'female';
    is_premium: boolean;
    preview_url?: string;
}

export interface TTSOptions {
    voiceId: string;
    provider: 'google' | 'elevenlabs';
    emotion?: 'neutral' | 'joyful' | 'nostalgic'; // For future ElevenLabs expansion
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_TTS_API_KEY; // Ensure this is in env
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY; // Ensure this is in env

export const ttsService = {
    /**
     * Get available voices
     */
    async getVoices(): Promise<Voice[]> {
        const { data, error } = await supabase
            .from('voices')
            .select('*')
            .order('provider'); // Google first, then Eleven

        if (error) {
            logger.error('Error fetching voices:', error);
            // Fallback hardcoded voices if DB empty/fails
            return [
                { id: 'fr-FR-Neural2-A', provider: 'google', name: 'Standard (Femme)', gender: 'female', is_premium: false },
                { id: 'fr-FR-Neural2-B', provider: 'google', name: 'Standard (Homme)', gender: 'male', is_premium: false }
            ];
        }
        return data || [];
    },

    /**
     * Generate or Retrieve Audio URL
     */
    async generateAudio(text: string, options: TTSOptions): Promise<string | null> {
        try {
            // 1. Check Cache
            const contentHash = CryptoJS.SHA256(text + options.voiceId).toString();

            const { data: cached } = await supabase
                .from('audio_cache')
                .select('audio_url')
                .eq('content_hash', contentHash)
                .single();

            if (cached?.audio_url) {
                console.log('TTS Cache Hit! 🎯');
                return cached.audio_url;
            }

            console.log('TTS Cache Miss. Generating... ⏳');

            // 2. Generate Audio
            let audioBuffer: ArrayBuffer;

            if (options.provider === 'google') {
                audioBuffer = await this.synthesizeGoogle(text, options.voiceId);
            } else if (options.provider === 'elevenlabs') {
                audioBuffer = await this.synthesizeElevenLabs(text, options.voiceId, options.emotion);
            } else {
                throw new Error('Unknown provider');
            }

            // 3. Upload to Storage
            if (!audioBuffer) throw new Error('Audio generation failed');

            const fileName = `${contentHash}.mp3`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('audio')
                .upload(fileName, audioBuffer, {
                    contentType: 'audio/mpeg',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('audio').getPublicUrl(uploadData.path);

            // 4. Save to Cache
            const { data: { session } } = await supabase.auth.getSession(); // Get current user for owner
            await supabase.from('audio_cache').insert({
                user_id: session?.user.id,
                content_hash: contentHash,
                voice_id: options.voiceId,
                provider: options.provider,
                audio_url: publicUrl,
                // duration_seconds: ... (requires metadata parsing)
            });

            return publicUrl;

        } catch (error) {
            logger.error('TTS Generation Error:', error);
            return null;
        }
    },

    /**
     * Google Cloud TTS Implementation
     */
    async synthesizeGoogle(text: string, voiceId: string): Promise<ArrayBuffer> {
        if (!GOOGLE_API_KEY) throw new Error('Missing Google TTS API Key');

        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: { languageCode: 'fr-FR', name: voiceId },
                    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 }
                })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Google TTS Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const audioContent = data.audioContent; // Base64 string

        // Convert Base64 to ArrayBuffer
        const binaryString = window.atob(audioContent);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    },

    /**
     * ElevenLabs Implementation
     */
    async synthesizeElevenLabs(text: string, voiceId: string, emotion: string = 'neutral'): Promise<ArrayBuffer> {
        if (!ELEVENLABS_API_KEY) throw new Error('Missing ElevenLabs API Key');

        // Note: 'emotion' mapping to stability/similarity logic can be refined
        const stability = emotion === 'joyful' ? 0.3 : 0.5;
        const similarity = 0.75;

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: stability,
                        similarity_boost: similarity
                    }
                })
            }
        );

        if (!response.ok) {
            try {
                const err = await response.json();
                throw new Error(`ElevenLabs Error: ${err.detail?.message || response.statusText}`);
            } catch {
                throw new Error(`ElevenLabs Error: ${response.statusText}`);
            }
        }

        return await response.arrayBuffer();
    }
};
