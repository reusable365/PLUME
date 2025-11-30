import { GoogleGenAI } from "@google/genai";
import { Photo, PhotoAnalysis } from "../types";
import { supabase } from "./supabaseClient";

/**
 * Service d'analyse de photos avec Gemini Vision API
 * Transforme les photos en catalyseurs narratifs intelligents
 */

/**
 * Analyse une photo avec Gemini Vision pour extraire le contexte narratif
 */
export const analyzePhotoWithVision = async (
    imageFile: File | string,
    userContext?: { firstName?: string; birthDate?: string },
    audioFile?: Blob | File
): Promise<PhotoAnalysis> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing from environment variables.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        // Préparer l'image pour l'API
        let imageData: string;

        if (typeof imageFile === 'string') {
            // Si c'est déjà une URL ou base64
            imageData = imageFile;
        } else {
            // Convertir le File en base64
            imageData = await fileToBase64(imageFile instanceof File ? imageFile : new File([imageFile], "image.jpg"));
        }

        // Préparer l'audio si présent
        let audioData: string | null = null;
        if (audioFile) {
            audioData = await fileToBase64(audioFile instanceof File ? audioFile : new File([audioFile], "audio.webm"));
        }

        // Construction du contexte utilisateur
        let contextPrompt = "";
        if (userContext?.firstName) {
            contextPrompt += `Cette photo appartient à ${userContext.firstName}. `;
        }
        if (userContext?.birthDate) {
            const birthYear = new Date(userContext.birthDate).getFullYear();
            contextPrompt += `Né(e) en ${birthYear}. `;
        }

        // Prompt d'analyse pour Gemini Vision

        const analysisPrompt = `
${contextPrompt}

Analyse cette image qui peut être une photo unique OU une page entière d'album photo.
${audioData ? "IMPORTANT : Un enregistrement audio de l'utilisateur est fourni. Il raconte ce qu'il voit. Utilise cet audio pour identifier précisément les personnes, les lieux et les émotions." : ""}

SI C'EST UNE PAGE D'ALBUM (plusieurs photos, mise en page, notes manuscrites) :
- Considère la page comme un "chapitre de vie".
- Essaie de lire les notes manuscrites ou légendes pour le contexte.
- Décris le lien entre les différentes photos (ex: déroulement d'une journée, évolution).

SI C'EST UNE PHOTO UNIQUE :
- Analyse la scène en profondeur.

Tu dois retourner un JSON avec cette structure EXACTE :
{
  "description": "Description détaillée (si album : 'Page d'album montrant...', si photo : 'Photo de...')",
  "detectedPeriod": "Époque estimée (ex: 'années 1980', 'été 1995')",
  "detectedLocation": "Lieu si identifiable (ex: 'Plage', 'Maison familiale', 'Parc')",
  "detectedPeople": ["Description des personnes visibles"],
  "detectedObjects": ["Objets significatifs (ou 'Album', 'Notes manuscrites')"],
  "mood": "Ambiance générale (ex: 'Joyeux', 'Nostalgique', 'Familial')",
  "narrativeAngles": {
    "emotion": "Question émotionnelle pour déclencher un souvenir (tutoiement, 15-20 mots)",
    "action": "Question sur l'action/événement (tutoiement, 15-20 mots)",
    "sensory": "Question sensorielle/descriptive (tutoiement, 15-20 mots)"
  }
}

IMPORTANT pour les narrativeAngles :
- Utilise le tutoiement (tu, te, ton)
- Formule des questions ouvertes qui invitent au récit
- Sois spécifique à ce que tu vois (si album : parle de la collection de moments)
- Angle EMOTION : Focus sur les sentiments, la nostalgie de l'époque
- Angle ACTION : Focus sur les événements reliés
- Angle SENSORY : Focus sur les détails visuels, les textures (papier, couleurs)

Retourne UNIQUEMENT le JSON, sans texte avant ou après.
`;

        // Construction des parts pour Gemini
        const parts: any[] = [
            { text: analysisPrompt },
            {
                inlineData: {
                    mimeType: imageFile instanceof File ? imageFile.type : 'image/jpeg',
                    data: imageData.split(',')[1] || imageData
                }
            }
        ];

        // Ajouter l'audio si présent
        if (audioData) {
            parts.push({
                inlineData: {
                    mimeType: audioFile?.type || 'audio/webm', // Fallback type, usually webm from MediaRecorder
                    data: audioData.split(',')[1] || audioData
                }
            });
        }

        // Appel à Gemini Vision
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{
                parts: parts
            }],
            config: {
                temperature: 0.7,
                topP: 0.9,
            }
        });

        const responseText = result.text;

        // Parser la réponse JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse JSON from Gemini Vision response");
        }

        const analysis: PhotoAnalysis = JSON.parse(jsonMatch[0]);

        // Validation et valeurs par défaut
        return {
            description: analysis.description || "Photo de souvenir",
            detectedPeriod: analysis.detectedPeriod,
            detectedLocation: analysis.detectedLocation,
            detectedPeople: Array.isArray(analysis.detectedPeople) ? analysis.detectedPeople : [],
            detectedObjects: Array.isArray(analysis.detectedObjects) ? analysis.detectedObjects : [],
            mood: analysis.mood,
            narrativeAngles: analysis.narrativeAngles || {
                emotion: "Quel sentiment prédomine quand tu repenses à ce moment ?",
                action: "Que s'est-il passé juste avant ou après cette photo ?",
                sensory: "Quelles sensations te reviennent en regardant cette image ?"
            }
        };

    } catch (error) {
        console.error("Photo Analysis Error:", error);

        // Retourner une analyse par défaut en cas d'erreur
        return {
            description: "Photo de souvenir à explorer",
            narrativeAngles: {
                emotion: "Quel sentiment prédomine quand tu repenses à ce moment ?",
                action: "Que s'est-il passé lors de cette journée ?",
                sensory: "Quelles sensations te reviennent en regardant cette image ?"
            }
        };
    }
};

/**
 * Génère un prompt narratif basé sur l'analyse et l'angle choisi
 */
export const generateNarrativePrompt = (
    photo: Photo,
    selectedAngle: 'emotion' | 'action' | 'sensory'
): string => {
    const analysis = photo.analysis;
    if (!analysis) {
        return "Raconte-moi le souvenir lié à cette photo.";
    }

    const angleQuestion = analysis.narrativeAngles?.[selectedAngle] || "";

    // Construction du prompt enrichi pour initier le dialogue
    let prompt = `J'ai ajouté une photo à mon album et je souhaite raconter le souvenir associé.\n\n`;

    prompt += `[ANALYSE VISUELLE]\n`;
    prompt += `Description : ${analysis.description}\n`;
    if (analysis.detectedPeriod) prompt += `Époque : ${analysis.detectedPeriod}\n`;
    if (analysis.detectedLocation) prompt += `Lieu : ${analysis.detectedLocation}\n`;
    if (analysis.mood) prompt += `Ambiance : ${analysis.mood}\n`;

    prompt += `\n[CONSIGNE POUR PLUME]\n`;
    prompt += `Je souhaite explorer ce souvenir sous l'angle : ${selectedAngle.toUpperCase()}.\n`;
    prompt += `Ne rédige pas le récit tout de suite. Pour m'aider à retrouver la mémoire, pose-moi simplement cette question :\n`;
    prompt += `"${angleQuestion}"\n\n`;
    prompt += `Attends ma réponse pour commencer à écrire le récit.`;

    return prompt;
};

/**
 * Upload une photo vers Supabase Storage
 */
export const uploadPhotoToSupabase = async (
    file: File,
    userId: string,
    photoId: string
): Promise<string> => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${photoId}.${fileExt}`;

        console.log(`Attempting to upload file: ${fileName} to bucket 'photos'`);

        const { data, error } = await supabase.storage
            .from('photos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error("Supabase Storage Upload Error:", error);
            throw error;
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);

        console.log("File uploaded, public URL:", publicUrl);
        return publicUrl;
    } catch (error) {
        console.error("Upload Error Details:", error);
        throw error;
    }
};

/**
 * Sauvegarde les métadonnées de photo enrichies dans le profil utilisateur
 */
export const savePhotoMetadata = async (
    userId: string,
    photo: Photo
): Promise<void> => {
    try {
        console.log(`Fetching profile for user: ${userId}`);
        // Récupérer les photos actuelles
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('photos')
            .eq('id', userId)
            .single();

        if (fetchError) {
            console.error("Error fetching profile photos:", fetchError);
            throw fetchError;
        }

        const currentPhotos: Photo[] = profile?.photos || [];

        // Ajouter ou mettre à jour la photo
        const photoIndex = currentPhotos.findIndex(p => p.id === photo.id);
        if (photoIndex >= 0) {
            currentPhotos[photoIndex] = photo;
        } else {
            currentPhotos.push(photo);
        }

        console.log(`Updating profile with ${currentPhotos.length} photos`);

        // Sauvegarder
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                photos: currentPhotos,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (updateError) {
            console.error("Error updating profile photos:", updateError);
            throw updateError;
        }

    } catch (error) {
        console.error("Save Photo Metadata Error Details:", error);
        throw error;
    }
};

/**
 * Convertit un File en base64
 */
const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

/**
 * Récupère la liste des personnages disponibles pour l'autocomplete
 */
export const getAvailableCharacters = async (userId: string): Promise<string[]> => {
    try {
        // Récupérer les personnages depuis la table entities
        const { data: entities, error } = await supabase
            .from('entities')
            .select('value')
            .eq('user_id', userId)
            .eq('type', 'person');

        if (error) {
            console.error("Error fetching characters:", error);
            return [];
        }

        // Extraire les valeurs uniques et trier
        const characters = [...new Set(entities?.map(e => e.value) || [])];
        return characters.sort();

    } catch (error) {
        console.error("Get Available Characters Error:", error);
        return [];
    }
};

/**
 * Sauvegarde les personnages identifiés dans la table entities
 */
export const saveCharactersToEntities = async (
    userId: string,
    messageId: string,
    characters: string[]
): Promise<void> => {
    try {
        // Supprimer les anciennes entrées pour ce message
        await supabase
            .from('entities')
            .delete()
            .eq('user_id', userId)
            .contains('metadata', { message_id: messageId })
            .eq('type', 'person');

        // Insérer les nouveaux personnages
        if (characters.length > 0) {
            const entities = characters.map(char => ({
                user_id: userId,
                type: 'person',
                value: char,
                metadata: { message_id: messageId }
            }));

            const { error } = await supabase
                .from('entities')
                .insert(entities);

            if (error) {
                console.error("Error saving characters to entities:", error);
                throw error;
            }
        }
    } catch (error) {
        console.error("Save Characters to Entities Error:", error);
        throw error;
    }
};

/**
 * Analyse une photo existante dans la photothèque
 */
export const analyzeExistingPhoto = async (
    photoUrl: string,
    userId: string,
    photoId: string,
    userContext?: { firstName?: string; birthDate?: string }
): Promise<Photo> => {
    try {
        // Analyser la photo
        const analysis = await analyzePhotoWithVision(photoUrl, userContext);

        // Récupérer la photo actuelle
        const { data: profile } = await supabase
            .from('profiles')
            .select('photos')
            .eq('id', userId)
            .single();

        const currentPhotos: Photo[] = profile?.photos || [];
        const photo = currentPhotos.find(p => p.id === photoId);

        if (!photo) {
            throw new Error("Photo not found");
        }

        // Enrichir avec l'analyse
        const enrichedPhoto: Photo = {
            ...photo,
            analysis
        };

        // Sauvegarder
        await savePhotoMetadata(userId, enrichedPhoto);

        return enrichedPhoto;

    } catch (error) {
        console.error("Analyze Existing Photo Error:", error);
        throw error;
    }
};
