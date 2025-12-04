

export enum Tone {
  AUTHENTIQUE = 'Authentique',
  HUMOUR = 'Humour',
  POETIQUE = 'Poétique',
  DIRECT = 'Direct',
  NOSTALGIQUE = 'Nostalgique',
  LYRIQUE = 'Lyrique',
  CONTEMPLATIF = 'Contemplatif',
  EPIQUE = 'Épique',
  INTIMISTE = 'Intimiste',
}

export enum Length {
  COURT = 'Court',
  MOYEN = 'Moyen',
  LONG = 'Long'
}

export enum Fidelity {
  HAUTE = 'Haute',
  BASSE = 'Basse',
}

export interface StyleConfig {
  tone: Tone;
  intensity: number; // 0-100
  authorStyle?: string; // Optional author inspiration (e.g., 'proust', 'duras')
}

export interface DigitalMemory {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter';
  externalId: string;
  date: string;
  content: string;
  location?: string;
  imageUrl?: string;
  analysis?: {
    emotion: string;
    themes: string[];
    suggestedAngles: string[];
  };
}


export interface ExtractedData {
  dates_chronologie: string[];
  lieux_cites: string[];
  personnages_cites: string[];
  tags_suggeres: string[];
}

export interface QuestionOption {
  type: 'emotion' | 'action' | 'descriptif';
  label: string; // ex: "Focus Émotion"
  text: string; // La question complète
}

export interface PlumeResponse {
  narrative: string;
  data: ExtractedData | null;
  suggestion: {
    title: string;
    content: string;
    tag: string;
  } | null;
  questions: QuestionOption[];
  selectedQuestionIndex?: number;
  isDrafted?: boolean;
  isSynthesized?: boolean;
  isSynthesisResult?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | PlumeResponse;
  timestamp: number;
  isSynthesized?: boolean;
  isDivider?: boolean; // Marqueur pour "Nouveau Souvenir"
  imageUrl?: string; // URL de l'image associée (pour le catalyseur photo)
}

export interface Idea {
  id: string;
  title?: string;
  content: string;
  tags?: string[];
  createdAt: number;
}

export interface AppState {
  messages: ChatMessage[];
  ideas: Idea[];
  aggregatedData: {
    dates: Set<string>;
    locations: Set<string>;
    characters: Set<string>;
    tags: Set<string>;
  };
}

export type ViewType = 'landing' | 'studio' | 'gallery' | 'manuscript' | 'dashboard' | 'boutique' | 'universe' | 'digital-memory' | 'guest_prototype';

export interface PhotoAnalysis {
  description: string;          // Description générale de la photo
  detectedPeriod?: string;      // Époque estimée (ex: "années 1980")
  detectedLocation?: string;    // Lieu si identifiable
  detectedPeople?: string[];    // Personnes détectées (descriptions)
  detectedObjects?: string[];   // Objets principaux
  mood?: string;                // Ambiance générale
  narrativeAngles?: {
    emotion: string;            // Angle émotionnel
    action: string;             // Angle narratif/action
    sensory: string;            // Angle sensoriel/descriptif
  };
}

export interface Photo {
  id?: string;                  // ID unique
  period: 'enfance' | 'jeunesse' | 'adulte';
  url: string;
  caption: string;
  uploadedAt?: number;          // Timestamp d'upload

  // Métadonnées IA
  analysis?: PhotoAnalysis;

  // Métadonnées utilisateur
  linkedCharacters?: string[];  // Personnages identifiés par l'utilisateur
  linkedTags?: string[];        // Tags associés
  linkedDate?: string;          // Date précise si connue
  isProfilePhoto?: boolean;     // True if uploaded via ProfileModal for avatar use
}

export interface PhotoCatalystResult {
  photo: Photo;
  selectedAngle: 'emotion' | 'action' | 'sensory';
  generatedPrompt: string;      // Prompt généré pour PLUME
}

export interface LifeLocation {
  city: string;
  country: string;
  period: string; // ex: "1982-1994"
  type: 'birth' | 'childhood' | 'adolescence' | 'adult' | 'current';
}

export interface User {
  id: string;
  email: string;
  name: string;
  subscription_status: 'free' | 'premium';
  life_locations?: LifeLocation[];
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  photos?: Photo[];
}

export type EntityType = 'person' | 'place' | 'event' | 'date' | 'theme' | 'other';

export enum RelationCategory {
  FAMILY = 'Famille',
  FRIEND = 'Ami',
  WORK = 'Travail',
  OTHER = 'Autre',
}

export interface EntityMetadata {
  // Pour les personnes
  relationship?: string; // ex: "Père", "Collègue"
  category?: RelationCategory;

  // Pour les lieux
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Pour les dates/événements
  date?: string;
  endDate?: string;
}

export interface Entity {
  id: string;
  user_id: string;
  type: EntityType;
  value: string; // Le nom de la personne, du lieu, etc.
  metadata: EntityMetadata;
  created_at: string;
}

// Book Architecture Types
export type BookStructureMode = 'chronological' | 'thematic' | 'expert';

export interface BookChapter {
  id: string;
  title: string;
  description: string;
  memoryIds: string[]; // IDs des chapitres/souvenirs à inclure
  order: number;
  estimatedPages: number;
  period?: string; // Pour mode chronologique
  theme?: string; // Pour mode thématique
}

export interface BookStructure {
  mode: BookStructureMode;
  title: string;
  subtitle?: string;
  chapters: BookChapter[];
  totalEstimatedPages: number;
  rationale?: string; // Explication de l'IA sur ses choix
  generatedAt: string;
}


export interface DigitalMemory {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter';
  externalId: string;
  date: string;
  imageUrl?: string;
  content: string;
  location?: string;
  likes?: number;
  taggedPeople?: string[];
  analysis?: {
    emotion: string;
    themes: string[];
    suggestedAngles: string[];
  };
}

export interface GuestContext {
  souvenirId: string;
  authorName: string;
  memoryTitle: string;
  memoryContext: {
    location: string;
    date: string;
    tags: string[];
  };
  authorQuestion: string;
}
