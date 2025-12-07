import React, { useState, useEffect } from 'react';
import { IconBook, IconFeather, IconGripVertical, IconPlus, IconTrash, IconPrinter, IconSave, IconSparkles } from './Icons';
import { supabase } from '../services/supabaseClient';
import { generateBookStructure } from '../services/bookArchitectService';
import { Souvenir, BookStructure, BookChapter, BookStructureMode } from '../types';
import jsPDF from 'jspdf';

interface BookViewProps {
    userId: string;
}

export const BookView: React.FC<BookViewProps> = ({ userId }) => {
    const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
    const [bookStructure, setBookStructure] = useState<BookStructure>({
        mode: 'chronological',
        title: 'Mémoires',
        subtitle: 'Une vie en quelques lignes',
        chapters: [],
        totalEstimatedPages: 0,
        generatedAt: new Date().toISOString()
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Drag & Drop state
    const [draggedSouvenirId, setDraggedSouvenirId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Load Souvenirs
            let loadedSouvenirs: Souvenir[] = [];

            try {
                const { data: chaptersData, error } = await supabase
                    .from('chapters')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (chaptersData) {
                    loadedSouvenirs = chaptersData.map(c => ({
                        id: c.id,
                        title: c.title,
                        content: c.content,
                        narrative: c.content,
                        created_at: c.created_at,
                        dates: c.metadata?.dates || [],
                        characters: c.metadata?.characters || [],
                        tags: c.metadata?.tags || [],
                        status: c.status,
                        emotion: c.metadata?.emotion,
                        imageUrl: c.image_url || c.metadata?.imageUrl || c.metadata?.image
                    }));
                }
            } catch (dbError) {
                console.error("Supabase load failed:", dbError);
                loadedSouvenirs = [];
            }

            setSouvenirs(loadedSouvenirs);

            // 2. Load Active Book Structure
            try {
                const { data: bookData, error: bookError } = await supabase
                    .from('book_structures')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('is_active', true)
                    .maybeSingle();

                if (bookData) {
                    setBookStructure({
                        mode: bookData.mode as BookStructureMode,
                        title: bookData.title,
                        subtitle: bookData.subtitle,
                        chapters: bookData.structure.chapters || [],
                        totalEstimatedPages: bookData.structure.totalEstimatedPages || 0,
                        rationale: bookData.rationale,
                        generatedAt: bookData.created_at
                    });
                } else {
                    if (bookStructure.chapters.length === 0) {
                        const defaultChapter: BookChapter = {
                            id: 'chap-1',
                            title: 'Chapitre 1',
                            description: 'Premiers souvenirs',
                            memoryIds: [],
                            order: 1,
                            estimatedPages: 0
                        };
                        setBookStructure(prev => ({ ...prev, chapters: [defaultChapter] }));
                        setActiveChapterId('chap-1');
                    }
                }
            } catch (err) {
                console.error("Error loading book structure:", err);
            }

        } catch (error) {
            console.error('Error loading book data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Drag & Drop Handlers ---

    const handleDragStart = (e: React.DragEvent, souvenirId: string) => {
        console.log("Drag Start:", souvenirId);
        setDraggedSouvenirId(souvenirId);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDraggedSouvenirId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDropOnChapter = (e: React.DragEvent, chapterId: string) => {
        e.preventDefault();
        console.log("Drop on chapter:", chapterId, "Souvenir:", draggedSouvenirId);

        if (!draggedSouvenirId) return;

        // Add souvenir to chapter
        setBookStructure(prev => {
            const newChapters = prev.chapters.map(ch => {
                if (ch.id === chapterId) {
                    // Avoid duplicates in the same chapter
                    if (ch.memoryIds.includes(draggedSouvenirId)) return ch;
                    return {
                        ...ch,
                        memoryIds: [...ch.memoryIds, draggedSouvenirId]
                    };
                }
                return ch;
            });
            return { ...prev, chapters: newChapters };
        });

        setIsDragging(false);
        setDraggedSouvenirId(null);
    };

    // --- Actions ---

    const handleSave = async () => {
        if (!userId) return;
        try {
            console.log("Saving book structure...", bookStructure);

            // 1. Check for existing active structure
            const { data: existing } = await supabase
                .from('book_structures')
                .select('id')
                .eq('user_id', userId)
                .eq('is_active', true)
                .maybeSingle();

            const dbData = {
                user_id: userId,
                title: bookStructure.title,
                subtitle: bookStructure.subtitle,
                mode: bookStructure.mode,
                rationale: bookStructure.rationale,
                structure: {
                    chapters: bookStructure.chapters,
                    totalEstimatedPages: bookStructure.totalEstimatedPages
                },
                is_active: true
            };

            let error;
            if (existing) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('book_structures')
                    .update(dbData)
                    .eq('id', existing.id);
                error = updateError;
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('book_structures')
                    .insert(dbData);
                error = insertError;
            }

            if (error) throw error;

            alert("Livre sauvegardé avec succès !");
        } catch (error) {
            console.error("Error saving book:", error);
            alert("Erreur lors de la sauvegarde : " + (error as any).message);
        }
    };

    const imageUrlToBase64 = async (url: string): Promise<string> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error loading image for PDF:", error);
            return "";
        }
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const maxLineWidth = pageWidth - margin * 2;
        let yPos = 20;

        // --- Helper: Check Page Break ---
        const checkPageBreak = (heightNeeded: number) => {
            if (yPos + heightNeeded > pageHeight - margin) {
                doc.addPage();
                yPos = margin + 10;
                return true;
            }
            return false;
        };

        // --- 1. COVER PAGE (Design Premium) ---
        // Background Color for Cover
        doc.setFillColor(253, 251, 247); // Cream background
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Decorative Border
        doc.setDrawColor(87, 83, 78); // Stone-600
        doc.setLineWidth(1);
        doc.rect(15, 15, pageWidth - 30, pageHeight - 30);
        doc.rect(18, 18, pageWidth - 36, pageHeight - 36);

        // Title
        doc.setTextColor(28, 25, 23); // Ink-900
        doc.setFont("times", "bold");
        doc.setFontSize(42);
        const titleLines = doc.splitTextToSize(bookStructure.title, pageWidth - 60);
        const titleHeight = titleLines.length * 15;
        doc.text(titleLines, pageWidth / 2, pageHeight / 3, { align: "center" });

        // Subtitle
        if (bookStructure.subtitle) {
            doc.setFontSize(18);
            doc.setFont("times", "italic");
            doc.setTextColor(87, 83, 78);
            doc.text(bookStructure.subtitle, pageWidth / 2, (pageHeight / 3) + titleHeight + 10, { align: "center" });
        }

        // Author & Logo
        doc.setFontSize(12);
        doc.setFont("times", "normal");
        doc.setTextColor(120, 113, 108);
        doc.text("Généré par PLUME", pageWidth / 2, pageHeight - 40, { align: "center" });
        doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth / 2, pageHeight - 30, { align: "center" });

        doc.addPage();
        yPos = 40;

        // --- 2. TABLE OF CONTENTS ---
        // Reset alignment
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(18);
        doc.setFont("times", "bold");
        doc.text("Table des Matières", pageWidth / 2, yPos, { align: "center" });
        yPos += 30;

        doc.setFontSize(12);
        doc.setFont("times", "normal");

        bookStructure.chapters.forEach((chap, index) => {
            const label = `${index + 1}. ${chap.title}`;
            doc.text(label, margin, yPos);
            yPos += 12;
        });

        doc.addPage();

        // --- 3. CHAPTERS CONTENT ---
        for (let i = 0; i < bookStructure.chapters.length; i++) {
            const chap = bookStructure.chapters[i];

            // Start Chapter on new page (already done at end of loop, or first page)
            if (i > 0) doc.addPage();
            yPos = 60; // Start lower for Chapter Title

            // Chapter Number
            doc.setFontSize(14);
            doc.setFont("times", "bold");
            doc.setTextColor(168, 162, 158); // Stone-400
            doc.text(`CHAPITRE ${i + 1}`, pageWidth / 2, yPos, { align: "center" });
            yPos += 15;

            // Chapter Title
            doc.setFontSize(26);
            doc.setTextColor(28, 25, 23);
            doc.text(chap.title, pageWidth / 2, yPos, { align: "center" });
            yPos += 20;

            // Description
            if (chap.description) {
                doc.setFontSize(12);
                doc.setFont("times", "italic");
                doc.setTextColor(87, 83, 78);
                const descLines = doc.splitTextToSize(chap.description, maxLineWidth - 40); // Narrower
                doc.text(descLines, pageWidth / 2, yPos, { align: "center" });
                yPos += (descLines.length * 6) + 20;
            }

            // Separator
            doc.setDrawColor(231, 229, 228); // Stone-200
            doc.line(margin + 40, yPos, pageWidth - margin - 40, yPos);
            yPos += 20;

            // --- Souvenirs ---
            for (const memId of chap.memoryIds) {
                const mem = getSouvenirById(memId);
                if (mem) {
                    checkPageBreak(30);

                    // Souvenir Title
                    doc.setFont("times", "bold");
                    doc.setFontSize(16);
                    doc.setTextColor(28, 25, 23);
                    doc.text(mem.title, margin, yPos);
                    yPos += 12;

                    // Image
                    if (mem.imageUrl) {
                        try {
                            const imgBase64 = await imageUrlToBase64(mem.imageUrl);
                            if (imgBase64) {
                                const imgProps = doc.getImageProperties(imgBase64);
                                const imgWidth = maxLineWidth;
                                // Calculate height maintaining aspect ratio
                                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                                // Check for space
                                if (checkPageBreak(imgHeight + 10)) {
                                    // If page break, reprint title? No, just image.
                                }

                                doc.addImage(imgBase64, margin, yPos, imgWidth, imgHeight);
                                yPos += imgHeight + 10;
                            }
                        } catch (imgErr) {
                            console.warn("PDF Image Error", imgErr);
                        }
                    }

                    // Content
                    doc.setFont("times", "normal");
                    doc.setFontSize(12);
                    doc.setTextColor(0, 0, 0);

                    const text = mem.narrative || mem.content;
                    const lines = doc.splitTextToSize(text, maxLineWidth);

                    lines.forEach((line: string) => {
                        checkPageBreak(7);
                        // Using 'text' directly.
                        doc.text(line, margin, yPos);
                        yPos += 7;
                    });

                    yPos += 15; // Space after souvenir

                    // Decorative Asterism
                    if (!checkPageBreak(20)) {
                        doc.setTextColor(214, 211, 209); // Stone-300
                        doc.setFontSize(16);
                        doc.text("***", pageWidth / 2, yPos, { align: "center" });
                        yPos += 20;
                    }
                }
            }
        }

        // --- 4. PAGINATION (Footer) ---
        const totalPages = doc.getNumberOfPages();
        for (let j = 1; j <= totalPages; j++) {
            // Skip cover page (page 1)
            if (j === 1) continue;

            doc.setPage(j);
            doc.setFont("times", "normal");
            doc.setFontSize(10);
            doc.setTextColor(168, 162, 158); // Lightweight grey
            doc.text(`Page ${j} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" });
        }

        doc.save(`Plume_Memoires_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    doc.addPage();

    // --- Table of Contents ---
    doc.setFontSize(18);
    doc.setFont("times", "bold");
    doc.text("Table des Matières", pageWidth / 2, yPos, { align: "center" });
    yPos += 20;

    doc.setFontSize(12);
    doc.setFont("times", "normal");
    bookStructure.chapters.forEach((chap, index) => {
        doc.text(`${index + 1}. ${chap.title}`, margin, yPos);
        yPos += 10;
    });

    doc.addPage();

    // --- Chapters ---
    for (let i = 0; i < bookStructure.chapters.length; i++) {
        const chap = bookStructure.chapters[i];

        // Chapter Title
        yPos = margin;
        doc.setFontSize(24);
        doc.setFont("times", "bold");
        doc.text(`Chapitre ${i + 1}`, pageWidth / 2, yPos, { align: "center" });
        yPos += 15;

        doc.setFontSize(20);
        doc.text(chap.title, pageWidth / 2, yPos, { align: "center" });
        yPos += 20;

        if (chap.description) {
            doc.setFontSize(12);
            doc.setFont("times", "italic");
            doc.setTextColor(100);
            const descLines = doc.splitTextToSize(chap.description, maxLineWidth);
            doc.text(descLines, margin, yPos);
            yPos += descLines.length * 7 + 10;
            doc.setTextColor(0);
        }

        // Chapter Content (Souvenirs)
        doc.setFont("times", "normal");
        doc.setFontSize(12);

        for (const memId of chap.memoryIds) {
            const mem = getSouvenirById(memId);
            if (mem) {
                // Souvenir Title
                if (yPos > 250) { doc.addPage(); yPos = margin; }
                doc.setFont("times", "bold");
                doc.setFontSize(14);
                doc.text(mem.title, margin, yPos);
                yPos += 10;

                // --- Image Integration ---
                if (mem.imageUrl) {
                    try {
                        const imgBase64 = await imageUrlToBase64(mem.imageUrl);
                        if (imgBase64) {
                            const imgProps = doc.getImageProperties(imgBase64);
                            const imgWidth = maxLineWidth;
                            // Calculate height maintaining aspect ratio
                            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                            // Check for space
                            if (yPos + imgHeight > 270) {
                                doc.addPage();
                                yPos = margin;
                            }

                            doc.addImage(imgBase64, margin, yPos, imgWidth, imgHeight);
                            yPos += imgHeight + 10;
                        }
                    } catch (imgErr) {
                        console.warn("Failed to load image for PDF", imgErr);
                    }
                }

                // Souvenir Text
                doc.setFont("times", "normal");
                doc.setFontSize(12);
                const text = mem.narrative || mem.content;
                const lines = doc.splitTextToSize(text, maxLineWidth);

                lines.forEach((line: string) => {
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(line, margin, yPos);
                    yPos += 7;
                });

                yPos += 10; // Space between souvenirs

                // Separator
                if (yPos > 260) { doc.addPage(); yPos = margin; }
                doc.text("***", pageWidth / 2, yPos, { align: "center" });
                yPos += 15;
            }
        }

        if (i < bookStructure.chapters.length - 1) {
            doc.addPage();
        }
    }

    doc.save("mon_livre_plume.pdf");
};

const handleAutoGenerate = async (mode: BookStructureMode) => {
    setIsGenerating(true);
    try {
        // Fetch user profile if needed for birth date etc. (mocking for now or fetching)
        // Ideally we should pass the real user profile.
        const userProfile = { id: userId, name: 'Auteur', email: '' } as any;

        const newStructure = await generateBookStructure(mode, userId, userProfile);
        setBookStructure(newStructure);
        if (newStructure.chapters.length > 0) {
            setActiveChapterId(newStructure.chapters[0].id);
        }
    } catch (error) {
        console.error("Error generating book structure:", error);
        alert("Erreur lors de la génération de la structure. Vérifiez votre connexion ou réessayez.");
    } finally {
        setIsGenerating(false);
    }
};

const addChapter = () => {
    const newChapterId = `chap-${Date.now()}`;
    const newChapter: BookChapter = {
        id: newChapterId,
        title: `Nouveau Chapitre`,
        description: 'Description du chapitre...',
        memoryIds: [],
        order: bookStructure.chapters.length + 1,
        estimatedPages: 0
    };
    setBookStructure(prev => ({
        ...prev,
        chapters: [...prev.chapters, newChapter]
    }));
    setActiveChapterId(newChapterId);
};

const removeSouvenirFromChapter = (chapterId: string, souvenirId: string) => {
    setBookStructure(prev => {
        const newChapters = prev.chapters.map(ch => {
            if (ch.id === chapterId) {
                return {
                    ...ch,
                    memoryIds: ch.memoryIds.filter(id => id !== souvenirId)
                };
            }
            return ch;
        });
        return { ...prev, chapters: newChapters };
    });
};

// --- Helpers ---

const getSouvenirById = (id: string) => souvenirs.find(s => s.id === id);

const getUnusedSouvenirs = () => {
    const usedIds = new Set(bookStructure.chapters.flatMap(c => c.memoryIds));
    return souvenirs.filter(s => !usedIds.has(s.id));
};

// --- Render Helpers ---

const renderPreview = () => (
    <div className="max-w-4xl mx-auto bg-white shadow-2xl min-h-screen p-16 text-ink-900 font-serif leading-relaxed">
        {/* Title Page */}
        <div className="text-center py-20 border-b border-stone-100 mb-20">
            <h1 className="text-6xl font-bold mb-6">{bookStructure.title}</h1>
            <p className="text-2xl italic text-stone-500">{bookStructure.subtitle}</p>
        </div>

        {/* Table of Contents */}
        <div className="mb-20">
            <h2 className="text-2xl font-bold mb-8 text-center uppercase tracking-widest">Table des Matières</h2>
            <div className="space-y-4">
                {bookStructure.chapters.map((chap, i) => (
                    <div key={chap.id} className="flex justify-between border-b border-stone-100 pb-2">
                        <span>{i + 1}. {chap.title}</span>
                        <span className="text-stone-400">p. {i * 10 + 5}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Chapters */}
        {bookStructure.chapters.map((chapter, i) => (
            <div key={chapter.id} className="mb-24">
                <div className="text-center mb-12">
                    <span className="text-stone-400 text-sm uppercase tracking-widest">Chapitre {i + 1}</span>
                    <h2 className="text-4xl font-bold mt-2">{chapter.title}</h2>
                    {chapter.description && <p className="text-stone-500 italic mt-4">{chapter.description}</p>}
                </div>

                <div className="space-y-12">
                    {chapter.memoryIds.map(memId => {
                        const mem = getSouvenirById(memId);
                        if (!mem) return null;
                        return (
                            <div key={memId} className="prose prose-stone max-w-none">
                                <h3 className="text-2xl font-bold mb-4">{mem.title}</h3>
                                {/* Image Display */}
                                {mem.imageUrl && (
                                    <img
                                        src={mem.imageUrl}
                                        alt={mem.title}
                                        className="w-full h-64 object-cover rounded-lg mb-6 shadow-md"
                                    />
                                )}

                                <div className="whitespace-pre-wrap text-lg text-justify">
                                    {mem.narrative || mem.content}
                                </div>
                                <div className="flex justify-center mt-8">
                                    <span className="text-accent text-xl">***</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Page Break for next chapter */}
                <div className="h-24"></div>
            </div>
        ))}
    </div>
);

return (
    <div className="flex h-full bg-[#Fdfbf7] overflow-hidden font-sans">
        {/* LEFT PANEL: The "Bank" of Souvenirs */}
        {!isPreviewMode && (
            <div className="w-1/3 min-w-[350px] border-r border-stone-200 flex flex-col bg-white/50 backdrop-blur-sm transition-all duration-300">
                <div className="p-6 border-b border-stone-100">
                    <h2 className="text-xl font-serif font-bold text-ink-900 flex items-center gap-2">
                        <IconFeather className="w-5 h-5 text-accent" />
                        Banc de Montage
                    </h2>
                    <p className="text-sm text-ink-500 mt-1">
                        Vos souvenirs disponibles ({getUnusedSouvenirs().length})
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {getUnusedSouvenirs().map(souvenir => (
                        <div
                            key={souvenir.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, souvenir.id)}
                            onDragEnd={handleDragEnd}
                            className={`bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-accent/30 cursor-grab active:cursor-grabbing transition-all group ${isDragging && draggedSouvenirId === souvenir.id ? 'opacity-50' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-ink-800 text-sm line-clamp-1">{souvenir.title || "Souvenir sans titre"}</h4>
                                {souvenir.emotion && (
                                    <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-600 rounded-full font-medium">
                                        {souvenir.emotion}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-ink-500 line-clamp-2 font-serif">
                                {souvenir.narrative || souvenir.content}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-[10px] text-ink-400">
                                <IconGripVertical className="w-3 h-3" />
                                <span>Glisser pour ajouter</span>
                            </div>
                        </div>
                    ))}
                    {getUnusedSouvenirs().length === 0 && (
                        <div className="text-center py-10 text-ink-400 italic text-sm">
                            Tous vos souvenirs sont placés !
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* CENTER PANEL: The Manuscript */}
        <div className="flex-1 flex flex-col bg-[#Fdfbf7] relative">
            {/* Header */}
            <div className="h-16 border-b border-stone-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-ink-900">{bookStructure.title}</h1>
                        <p className="text-xs text-ink-500 uppercase tracking-widest">{bookStructure.subtitle}</p>
                    </div>
                    {/* Generation Modes Toolbar */}
                    {!isPreviewMode && (
                        <div className="flex bg-stone-100 rounded-lg p-1 gap-1 ml-8">
                            <button
                                onClick={() => handleAutoGenerate('chronological')}
                                disabled={isGenerating}
                                className="px-3 py-1 text-xs font-medium text-ink-600 hover:bg-white hover:shadow-sm rounded transition-all disabled:opacity-50"
                                title="Trier par date"
                            >
                                Chronologique
                            </button>
                            <button
                                onClick={() => handleAutoGenerate('thematic')}
                                disabled={isGenerating}
                                className="px-3 py-1 text-xs font-medium text-ink-600 hover:bg-white hover:shadow-sm rounded transition-all disabled:opacity-50"
                                title="Grouper par thèmes"
                            >
                                Thématique
                            </button>
                            <button
                                onClick={() => handleAutoGenerate('expert')}
                                disabled={isGenerating}
                                className="px-3 py-1 text-xs font-bold text-accent bg-accent/10 hover:bg-accent hover:text-white rounded transition-all flex items-center gap-1 disabled:opacity-50"
                                title="Laisser l'IA structurer"
                            >
                                {isGenerating ? (
                                    <IconSparkles className="w-3 h-3 animate-spin" />
                                ) : (
                                    <IconFeather className="w-3 h-3" />
                                )}
                                {isGenerating ? 'Génération...' : 'Mode Biographe (IA)'}
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isPreviewMode ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 text-ink-700 hover:bg-stone-50'}`}
                    >
                        <IconBook className="w-4 h-4" />
                        {isPreviewMode ? 'Éditer' : 'Lire'}
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-ink-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        <IconSave className="w-4 h-4" />
                        Sauvegarder
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-accent text-white hover:bg-accent-dark rounded-lg text-sm font-medium shadow-md transition-all"
                    >
                        <IconPrinter className="w-4 h-4" />
                        Exporter PDF
                    </button>
                </div>
            </div>

            {/* Book Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {isPreviewMode ? renderPreview() : (
                    <div className="max-w-3xl mx-auto space-y-8 pb-20">

                        {/* Cover Placeholder */}
                        <div className="aspect-[1/1.414] bg-white shadow-2xl rounded-r-lg border-l-4 border-l-stone-800 p-12 flex flex-col justify-center items-center text-center mb-12 transform hover:scale-[1.01] transition-transform duration-500">
                            <div className="w-full h-full border-4 border-double border-stone-200 p-8 flex flex-col justify-between">
                                <div className="text-stone-400 text-sm tracking-[0.3em] uppercase">Mémoires</div>
                                <div>
                                    <h1 className="font-serif text-5xl text-ink-900 mb-4">{bookStructure.title}</h1>
                                    <div className="w-24 h-1 bg-accent mx-auto mb-4"></div>
                                    <h2 className="font-serif text-xl text-ink-600 italic">{bookStructure.subtitle}</h2>
                                </div>
                                <div className="text-stone-500 font-medium">Par {userId ? "L'Auteur" : "..."}</div>
                            </div>
                        </div>

                        {/* Chapters List */}
                        {bookStructure.chapters.map((chapter, index) => (
                            <div
                                key={chapter.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnChapter(e, chapter.id)}
                                className={`bg-white shadow-lg rounded-lg border border-stone-100 transition-all duration-300 ${activeChapterId === chapter.id ? 'ring-2 ring-accent/20' : ''} ${isDragging ? 'ring-2 ring-dashed ring-accent/40 bg-accent/5' : ''}`}
                                onClick={() => setActiveChapterId(chapter.id)}
                            >
                                {/* Chapter Header */}
                                <div className="p-6 border-b border-stone-50 flex items-start justify-between bg-stone-50/50 rounded-t-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl font-serif text-stone-200 font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                value={chapter.title}
                                                onChange={(e) => {
                                                    const newTitle = e.target.value;
                                                    setBookStructure(prev => ({
                                                        ...prev,
                                                        chapters: prev.chapters.map(c => c.id === chapter.id ? { ...c, title: newTitle } : c)
                                                    }));
                                                }}
                                                className="text-xl font-serif font-bold text-ink-900 bg-transparent border-none focus:ring-0 p-0 placeholder-stone-300 w-full"
                                                placeholder="Titre du chapitre"
                                            />
                                            <input
                                                type="text"
                                                value={chapter.description}
                                                onChange={(e) => {
                                                    const newDesc = e.target.value;
                                                    setBookStructure(prev => ({
                                                        ...prev,
                                                        chapters: prev.chapters.map(c => c.id === chapter.id ? { ...c, description: newDesc } : c)
                                                    }));
                                                }}
                                                className="text-sm text-ink-500 bg-transparent border-none focus:ring-0 p-0 w-full mt-1"
                                                placeholder="Description courte..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-stone-400 bg-white px-2 py-1 rounded border border-stone-100">
                                            {chapter.memoryIds.length} souvenirs
                                        </span>
                                    </div>
                                </div>

                                {/* Chapter Content (Drop Zone) */}
                                <div className={`p-6 min-h-[150px] space-y-4 ${chapter.memoryIds.length === 0 ? 'flex items-center justify-center' : ''}`}>
                                    {chapter.memoryIds.length === 0 ? (
                                        <div className="text-center border-2 border-dashed border-stone-200 rounded-xl p-8 w-full">
                                            <IconBook className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-accent animate-bounce' : 'text-stone-300'}`} />
                                            <p className={`text-sm ${isDragging ? 'text-accent font-bold' : 'text-stone-400'}`}>
                                                {isDragging ? 'Déposez ici !' : 'Glissez vos souvenirs ici pour construire ce chapitre'}
                                            </p>
                                        </div>
                                    ) : (
                                        chapter.memoryIds.map((memId, idx) => {
                                            const mem = getSouvenirById(memId);
                                            if (!mem) return null;
                                            return (
                                                <div key={memId} className="group relative pl-8 border-l-2 border-stone-200 hover:border-accent transition-colors py-2">
                                                    <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-stone-300 group-hover:border-accent transition-colors"></div>

                                                    <div className="bg-stone-50 p-4 rounded-lg group-hover:bg-white group-hover:shadow-md transition-all">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-bold text-ink-800 font-serif">{mem.title}</h4>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeSouvenirFromChapter(chapter.id, memId);
                                                                }}
                                                                className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <IconTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-ink-600 mt-2 line-clamp-3 font-serif leading-relaxed">
                                                            {mem.narrative || mem.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add Chapter Button */}
                        <button
                            onClick={addChapter}
                            className="w-full py-6 border-2 border-dashed border-stone-300 rounded-lg text-stone-500 font-bold hover:border-accent hover:text-accent hover:bg-accent/5 transition-all flex items-center justify-center gap-2"
                        >
                            <IconPlus className="w-5 h-5" />
                            Ajouter un nouveau chapitre
                        </button>

                    </div>
                )}
            </div>
        </div>
    </div>
);
};
