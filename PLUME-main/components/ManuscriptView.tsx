import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { exportBookToPDF } from '../services/exportService';
import { IconBook, IconCheck, IconX, IconSettings, IconCalendar, IconDownload, IconImage, IconPlus, IconEye, IconEdit, IconArrowRight, IconArrowLeft, IconChevronRight, IconChevronDown, IconZap } from './Icons';
import { User, Photo, BookStructure } from '../types';
import BookStructureModal from './BookStructureModal';

// --- TYPES ---
interface Chapter {
  id: string;
  title: string;
  content: string;
  created_at: string;
  metadata?: {
    dates?: string[];
    characters?: string[];
    tags?: string[];
    photos?: string[];
  };
}

interface ManuscriptViewProps {
  userProfile: User | null;
  showToast: (message: string, type: 'success' | 'error') => void;
}

type BookAxis = 'chronological' | 'thematic' | 'linear';
type Theme = 'voyages' | 'famille' | 'passions' | 'enfance' | 'carriere' | 'all';

// --- PREMIUM FLAT BOOK PRESENTATION ---
const BookPresentation = ({
  title,
  author,
  chapterCount,
  pageCount,
  onOpenReader,
  onOpenArchitect,
  structureMode
}: {
  title: string;
  author: string;
  chapterCount: number;
  pageCount: number;
  onOpenReader: () => void;
  onOpenArchitect: () => void;
  structureMode?: string;
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 h-full p-8 max-w-7xl mx-auto animate-fade-in">

      {/* LEFT: THE BOOK COVER */}
      <div className="relative group cursor-pointer perspective-1000" onClick={onOpenReader}>
        <div className="relative w-[320px] h-[480px] bg-[#1a252f] rounded-r-2xl rounded-l-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-4 group-hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-l-4 border-[#0f161c] overflow-hidden">

          {/* Texture & Gradient */}
          <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40 pointer-events-none"></div>

          {/* Spine Highlight */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8 border-2 border-[#d4af37]/20 m-3 rounded">
            <div className="text-center pt-8">
              <div className="w-12 h-12 mx-auto border-2 border-[#d4af37] rotate-45 mb-6 flex items-center justify-center">
                <div className="w-8 h-8 border border-[#d4af37] bg-[#d4af37]/10"></div>
              </div>
              <p className="text-[#d4af37] text-xs tracking-[0.4em] uppercase font-bold">Édition Unique</p>
            </div>

            <div className="text-center">
              <h1 className="font-serif text-4xl text-[#f4ecd8] font-bold leading-tight drop-shadow-lg mb-4">{title}</h1>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto"></div>
            </div>

            <div className="text-center pb-8">
              <p className="text-[#a0aab5] font-serif italic mb-2">Une vie racontée par</p>
              <p className="text-[#f4ecd8] font-bold tracking-widest uppercase text-sm">{author}</p>
            </div>
          </div>
        </div>

        {/* Book Pages Effect (Right Side) */}
        <div className="absolute top-2 right-0 w-4 h-[472px] bg-[#fdfbf7] rounded-r-sm shadow-inner transform translate-x-full z-0 border-l border-black/10 background-[linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[length:2px_100%]"></div>

        {/* Hover Hint */}
        <div className="absolute -bottom-12 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white/50 text-xs font-bold tracking-widest uppercase bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
            Cliquez pour lire
          </span>
        </div>
      </div>

      {/* RIGHT: THE MAGIC & STATS */}
      <div className="flex-1 max-w-md space-y-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Votre histoire,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4af37] to-amber-200">
              structurée avec magie.
            </span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            PLUME a rassemblé vos souvenirs pour composer une œuvre cohérente.
            L'intelligence artificielle a organisé votre récit pour en faire un véritable livre.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
            <div className="text-[#d4af37] font-bold text-2xl mb-1">{chapterCount}</div>
            <div className="text-white/50 text-xs uppercase tracking-wider">Chapitres</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
            <div className="text-[#d4af37] font-bold text-2xl mb-1">~{pageCount}</div>
            <div className="text-white/50 text-xs uppercase tracking-wider">Pages estimées</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <IconZap className="w-24 h-24 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <IconZap className="w-5 h-5 text-indigo-300" />
              </div>
              <h3 className="text-white font-bold">Structure du Récit</h3>
            </div>

            <p className="text-white/70 text-sm mb-4">
              Mode actuel : <strong className="text-white">{structureMode === 'chronological' ? 'Chronologique' : structureMode === 'thematic' ? 'Thématique' : structureMode === 'expert' ? 'Expert Biographique' : 'Standard'}</strong>
            </p>

            <button
              onClick={onOpenArchitect}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2 group-hover:border-indigo-400/50"
            >
              <IconSettings className="w-4 h-4" />
              Changer la structure (IA)
            </button>
          </div>
        </div>

        <button
          onClick={onOpenReader}
          className="w-full py-4 bg-[#d4af37] hover:bg-[#b5952f] text-[#1a252f] font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
        >
          <IconBook className="w-5 h-5" />
          Ouvrir le livre
        </button>
      </div>
    </div>
  );
};

// --- KINDLE-LIKE READER COMPONENT ---
const KindleReader = ({
  chapters,
  onClose,
  bookTitle,
  authorName
}: {
  chapters: Chapter[];
  onClose: () => void;
  bookTitle: string;
  authorName: string;
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [showSidebar, setShowSidebar] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentChapter = chapters[currentChapterIndex];
  const progress = ((currentChapterIndex + 1) / chapters.length) * 100;

  const nextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(i => i + 1);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(i => i - 1);
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const bgColor = nightMode ? 'bg-[#1a1a1a]' : 'bg-[#fdfbf7]';
  const textColor = nightMode ? 'text-[#e8e6e3]' : 'text-[#2c2c2c]';
  const secondaryColor = nightMode ? 'text-[#a0a0a0]' : 'text-[#666666]';

  console.log('KindleReader received:', chapters.length, 'chapters');
  console.log('Current chapter:', currentChapter);


  return (
    <div className={`fixed inset-0 z-50 ${bgColor} transition-colors duration-300 flex flex-col`}>
      {/* TOP BAR */}
      <div className={`h-14 border-b ${nightMode ? 'border-white/10 bg-black/20' : 'border-ink-100 bg-white/50'} backdrop-blur flex items-center justify-between px-6`}>
        <div className="flex items-center gap-4">
          <button onClick={onClose} className={`p-2 hover:bg-white/10 rounded-full ${textColor} transition-colors`}>
            <IconArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`font-serif font-bold ${textColor}`}>{bookTitle}</h1>
            <p className={`text-xs ${secondaryColor}`}>par {authorName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Font Size */}
          <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className={`px-2 py-1 ${secondaryColor} hover:${textColor}`}>A-</button>
          <span className={`text-sm ${secondaryColor}`}>{fontSize}px</span>
          <button onClick={() => setFontSize(Math.min(24, fontSize + 2))} className={`px-2 py-1 ${secondaryColor} hover:${textColor}`}>A+</button>

          {/* Night Mode */}
          <button onClick={() => setNightMode(!nightMode)} className={`ml-4 p-2 rounded-full ${secondaryColor} hover:${textColor}`}>
            {nightMode ? <IconEye className="w-5 h-5" /> : <IconEye className="w-5 h-5" />}
          </button>

          {/* Sidebar Toggle */}
          <button onClick={() => setShowSidebar(!showSidebar)} className={`p-2 rounded-full ${secondaryColor} hover:${textColor}`}>
            <IconBook className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* SIDEBAR */}
        <div className={`absolute top-0 left-0 h-full w-80 ${nightMode ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-ink-100'} border-r transform transition-transform duration-300 z-20 overflow-y-auto ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`font-bold ${textColor}`}>Chapitres</h2>
              <button onClick={() => setShowSidebar(false)} className={secondaryColor}>
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  onClick={() => { setCurrentChapterIndex(index); setShowSidebar(false); }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${index === currentChapterIndex
                    ? nightMode ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'
                    : nightMode ? 'hover:bg-white/5 text-[#a0a0a0]' : 'hover:bg-ink-50 text-ink-600'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-50">{index + 1}</span>
                    <span className="font-medium text-sm truncate">{chapter.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-12 scrollbar-thin">
          <div className="max-w-3xl mx-auto">
            {/* Chapter Header */}
            <div className="mb-12 text-center">
              <p className={`text-sm ${secondaryColor} uppercase tracking-widest mb-2`}>Chapitre {currentChapterIndex + 1}</p>
              <h1 className={`font-serif text-4xl md:text-5xl font-bold ${textColor} mb-4`}>{currentChapter?.title}</h1>
              {currentChapter?.metadata?.dates?.[0] && (
                <p className={`text-sm ${secondaryColor} flex items-center justify-center gap-2`}>
                  <IconCalendar className="w-4 h-4" />
                  {currentChapter.metadata.dates[0]}
                </p>
              )}
            </div>

            {/* Photo */}
            {currentChapter?.metadata?.photos?.[0] && (
              <div className="mb-8 rounded-lg overflow-hidden shadow-xl">
                <img src={currentChapter.metadata.photos[0]} alt={currentChapter.title} className="w-full h-auto" />
              </div>
            )}

            {/* Content */}
            {currentChapter ? (
              <div
                className={`font-serif leading-relaxed ${textColor} whitespace-pre-wrap text-justify`}
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
              >
                {currentChapter.content}
              </div>
            ) : (
              <div className="text-center py-20">
                <IconBook className={`w-16 h-16 mx-auto mb-4 ${secondaryColor}`} />
                <h3 className={`text-xl font-bold ${textColor} mb-2`}>Aucun chapitre disponible</h3>
                <p className={secondaryColor}>Commencez à écrire dans l'Atelier pour remplir votre livre.</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-16 pt-8 border-t border-current/10">
              <button
                onClick={prevChapter}
                disabled={currentChapterIndex === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${secondaryColor} hover:${textColor} disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
              >
                <IconArrowLeft className="w-4 h-4" />
                Chapitre précédent
              </button>

              <button
                onClick={nextChapter}
                disabled={currentChapterIndex === chapters.length - 1}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${secondaryColor} hover:${textColor} disabled:opacity-30 disabled:cursor-not-allowed transition-colors`}
              >
                Chapitre suivant
                <IconArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className={`h-1 ${nightMode ? 'bg-white/10' : 'bg-ink-100'}`}>
        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const ManuscriptView: React.FC<ManuscriptViewProps> = ({ userProfile, showToast }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<'stage' | 'reader' | 'edit'>('stage');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [bookAxis, setBookAxis] = useState<BookAxis>('linear');
  const [selectedTheme, setSelectedTheme] = useState<Theme>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Book Architect State
  const [showBookArchitect, setShowBookArchitect] = useState(false);
  const [activeStructure, setActiveStructure] = useState<BookStructure | null>(null);
  const [generatedStructure, setGeneratedStructure] = useState<BookStructure | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // 1. Fetch Memories (Chapters)
      const { data: memoriesData } = await supabase
        .from('chapters')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: true });

      if (memoriesData) {
        setChapters(memoriesData);
      }

      // 2. Fetch Active Book Structure
      const { data: structureData } = await supabase
        .from('book_structures')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (structureData) {
        // Map DB format to frontend type
        const structure: BookStructure = {
          mode: structureData.mode as any,
          title: structureData.title,
          subtitle: structureData.subtitle,
          chapters: structureData.structure.chapters,
          totalEstimatedPages: structureData.structure.totalEstimatedPages,
          rationale: structureData.rationale,
          generatedAt: structureData.created_at
        };
        setActiveStructure(structure);
      }

      // 3. Fetch Photos
      const { data: profileData } = await supabase
        .from('profiles')
        .select('photos')
        .eq('id', session.user.id)
        .single();

      if (profileData?.photos) setUserPhotos(profileData.photos);
      setLoading(false);
    };

    fetchData();
  }, []);

  const authorName = userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : "L'Auteur";

  // Determine Book Title
  const bookTitle = activeStructure?.title || (selectedTheme !== 'all' ? `${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}` : "Mémoires");

  // Organize Content based on Structure or Filters
  const organizedChapters = React.useMemo(() => {
    // If we have an active AI structure, use it!
    if (activeStructure && selectedTheme === 'all') {
      const structuredChapters: Chapter[] = [];

      activeStructure.chapters.forEach(structChapter => {
        const chapterMemories = chapters.filter(c => structChapter.memoryIds.includes(c.id));

        if (chapterMemories.length > 0) {
          const combinedContent = chapterMemories.map(m => m.content).join('\n\n***\n\n');
          const combinedPhotos = chapterMemories.flatMap(m => m.metadata?.photos || []);
          const combinedDates = chapterMemories.flatMap(m => m.metadata?.dates || []);

          structuredChapters.push({
            id: structChapter.id,
            title: structChapter.title,
            content: combinedContent,
            created_at: new Date().toISOString(),
            metadata: {
              dates: combinedDates,
              photos: combinedPhotos,
              tags: [structChapter.theme || '', structChapter.period || ''].filter(Boolean)
            }
          });
        }
      });

      return structuredChapters.length > 0 ? structuredChapters : chapters;
    }

    // Fallback to standard filtering with IMPROVED SEARCH
    let filtered = [...chapters];
    if (selectedTheme !== 'all') {
      const searchTerms = {
        'enfance': ['enfance', 'enfant', 'école', 'petit', 'naissance', 'jeune'],
        'voyages': ['voyage', 'monde', 'pays', 'vacances', 'étranger', 'visite', 'tourisme'],
        'famille': ['famille', 'parent', 'mère', 'père', 'frère', 'soeur', 'enfant', 'mari', 'femme'],
        'carriere': ['travail', 'boulot', 'carrière', 'métier', 'entreprise', 'bureau', 'collègue'],
        'passions': ['passion', 'hobby', 'sport', 'art', 'musique', 'lecture']
      };

      const terms = searchTerms[selectedTheme] || [selectedTheme];

      filtered = filtered.filter(ch => {
        const tags = (ch.metadata?.tags || []).map(t => t.toLowerCase());
        const content = ch.content.toLowerCase();
        const title = ch.title.toLowerCase();

        // Check if any of the related terms appear in tags, title, or content
        return terms.some(term =>
          tags.some(t => t.includes(term)) ||
          title.includes(term) ||
          content.includes(term)
        );
      });
    }
    return filtered;
  }, [chapters, selectedTheme, activeStructure]);

  const handleApplyStructure = async (structure: BookStructure) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // 1. Deactivate all existing structures
      await supabase
        .from('book_structures')
        .update({ is_active: false })
        .eq('user_id', session.user.id);

      // 2. Save new structure
      const { error } = await supabase
        .from('book_structures')
        .insert({
          user_id: session.user.id,
          title: structure.title,
          subtitle: structure.subtitle,
          mode: structure.mode,
          structure: {
            chapters: structure.chapters,
            totalEstimatedPages: structure.totalEstimatedPages
          },
          rationale: structure.rationale,
          is_active: true
        });

      if (error) throw error;

      setActiveStructure(structure);
      setShowBookArchitect(false);
      showToast(`Structure "${structure.title}" appliquée !`, 'success');

    } catch (err) {
      console.error('Error saving structure:', err);
      showToast("Erreur lors de la sauvegarde de la structure", "error");
    }
  };

  const handleSave = async () => {
    if (!editingId) return;
    setIsSaving(true);
    try {
      const currentChapter = chapters.find(c => c.id === editingId);
      const updatedMetadata = { ...currentChapter?.metadata, photos: editPhotos };
      const { error } = await supabase.from('chapters').update({
        title: editTitle, content: editContent, metadata: updatedMetadata, updated_at: new Date().toISOString()
      }).eq('id', editingId);

      if (error) throw error;
      setChapters(chapters.map(c => c.id === editingId ? { ...c, title: editTitle, content: editContent, metadata: updatedMetadata } : c));
      showToast("Chapitre mis à jour !", "success");
      setEditingId(null);
    } catch (err) {
      showToast("Erreur de sauvegarde", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportBookToPDF({
        authorName,
        chapters: organizedChapters,
        bookTitle,
        includePhotos: true,
        includeQRCodes: true,
        axis: bookAxis
      });
      showToast('Livre PDF généré !', 'success');
    } catch (err) {
      showToast('Erreur export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center bg-[#1a1a1a] text-white/30 animate-pulse">Chargement de la bibliothèque...</div>;

  return (
    <div className="h-full bg-[#1a1a1a] overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#2c3e50] via-[#1a1a1a] to-[#000000] opacity-80"></div>

      {mode === 'stage' && (
        <div className="relative z-10 h-full flex flex-col animate-fade-in">
          <div className="flex-1 overflow-y-auto">
            <BookPresentation
              title={bookTitle}
              author={authorName}
              chapterCount={organizedChapters.length}
              pageCount={activeStructure?.totalEstimatedPages || Math.ceil(organizedChapters.reduce((acc, c) => acc + c.content.length, 0) / 1500)}
              onOpenReader={() => setMode('reader')}
              onOpenArchitect={() => setShowBookArchitect(true)}
              structureMode={activeStructure?.mode}
            />
          </div>

          <div className="h-16 border-t border-white/5 bg-black/20 backdrop-blur flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              {/* Theme filter removed as per request */}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleExportPDF} className="flex items-center gap-2 text-sm font-bold text-accent hover:text-white transition-colors">
                <IconDownload className="w-4 h-4" /> {isExporting ? 'Exportation...' : 'Exporter PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'reader' && (
        <KindleReader
          chapters={organizedChapters}
          onClose={() => setMode('stage')}
          bookTitle={bookTitle}
          authorName={authorName}
        />
      )}

      {mode === 'edit' && (
        <div className="absolute inset-0 z-20 bg-[#f4ecd8] overflow-y-auto animate-slide-up">
          <div className="max-w-4xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setMode('stage')} className="flex items-center gap-2 text-ink-500 hover:text-ink-900 font-bold">
                <IconArrowLeft className="w-5 h-5" /> Retour au Livre
              </button>
              <h2 className="font-serif text-2xl font-bold text-ink-900">Atelier d'Édition</h2>
            </div>

            <div className="space-y-4">
              {organizedChapters.map(chapter => (
                <div key={chapter.id} className="bg-white p-6 rounded-lg shadow-sm border border-ink-100 flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="font-bold text-ink-800 text-lg">{chapter.title}</h3>
                    <p className="text-ink-400 text-sm truncate max-w-md">{chapter.content.substring(0, 100)}...</p>
                  </div>
                  <button
                    onClick={() => { setEditingId(chapter.id); setEditTitle(chapter.title); setEditContent(chapter.content); setEditPhotos(chapter.metadata?.photos || []); }}
                    className="p-2 bg-ink-50 text-ink-600 rounded hover:bg-accent hover:text-white transition-colors"
                  >
                    <IconSettings className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {editingId && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
                  <h3 className="font-bold text-2xl mb-6">Modifier le Chapitre</h3>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full p-3 border rounded mb-4 font-serif text-xl font-bold" />
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full p-3 border rounded mb-4 h-64 font-serif" />

                  <div className="mb-6">
                    <h4 className="font-bold mb-2">Photos</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {userPhotos.map(photo => (
                        <img
                          key={photo.url}
                          src={photo.url}
                          className={`w-20 h-20 object-cover rounded cursor-pointer border-2 ${editPhotos.includes(photo.url) ? 'border-accent' : 'border-transparent'}`}
                          onClick={() => {
                            if (editPhotos.includes(photo.url)) setEditPhotos(editPhotos.filter(p => p !== photo.url));
                            else setEditPhotos([...editPhotos, photo.url]);
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-ink-500 hover:bg-ink-50 rounded">Annuler</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-accent text-white rounded font-bold hover:bg-amber-600">{isSaving ? '...' : 'Enregistrer'}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book Architect Modal */}
      <BookStructureModal
        isOpen={showBookArchitect}
        onClose={() => setShowBookArchitect(false)}
        userId={userProfile?.id || ''}
        userProfile={userProfile}
        onStructureGenerated={(structure) => {
          handleApplyStructure(structure);
        }}
      />
    </div>
  );
};

export default ManuscriptView;