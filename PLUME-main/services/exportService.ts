import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserStats, ThemeData, Gap } from './analyticsService';
import { WritingAnalysis } from './dashboardAIService';
import { WritingGoal } from '../components/GoalSettingModal';

export interface ExportData {
    userName: string;
    stats: UserStats;
    themes: ThemeData[];
    gaps: Gap[];
    aiAnalysis?: WritingAnalysis;
    goals?: WritingGoal[];
}

/**
 * Generate a comprehensive PDF report of the user's writing journey
 */
export const generatePDFReport = async (data: ExportData): Promise<void> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Helper function to add page numbers
    const addPageNumber = () => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(
            `Page ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    };

    // ===== COVER PAGE =====
    doc.setFillColor(180, 83, 9); // Accent color
    doc.rect(0, 0, pageWidth, 80, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('PLUME', pageWidth / 2, 35, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Rapport de Progression', pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(14);
    doc.text(data.userName, pageWidth / 2, 65, { align: 'center' });

    // Date
    doc.setTextColor(100);
    doc.setFontSize(12);
    const today = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(today, pageWidth / 2, pageHeight - 30, { align: 'center' });

    addPageNumber();

    // ===== PAGE 2: STATISTICS =====
    doc.addPage();
    doc.setTextColor(0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Statistiques Globales', 20, 30);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const statsData = [
        ['Métrique', 'Valeur'],
        ['Complétude', `${data.stats.completion}%`],
        ['Pages rédigées', `${data.stats.pages} / ${data.stats.estimatedTotal}`],
        ['Chapitres', `${data.stats.chapters}`],
        ['Photos intégrées', `${data.stats.photos}`],
        ['Messages écrits', `${data.stats.totalMessages}`],
        ['Progression cette semaine', `${data.stats.weeklyProgress} pages`]
    ];

    autoTable(doc, {
        startY: 40,
        head: [statsData[0]],
        body: statsData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [180, 83, 9], fontStyle: 'bold' },
        styles: { fontSize: 11, cellPadding: 5 }
    });

    addPageNumber();

    // ===== PAGE 3: THEMATIC BALANCE =====
    if (data.themes.length > 0) {
        doc.addPage();
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('🎨 Répartition Thématique', 20, 30);

        const themeData = [
            ['Thème', 'Pourcentage', 'Pages'],
            ...data.themes.map(t => [t.name, `${t.percentage}%`, `${t.pages}`])
        ];

        autoTable(doc, {
            startY: 40,
            head: [themeData[0]],
            body: themeData.slice(1),
            theme: 'striped',
            headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
            styles: { fontSize: 11, cellPadding: 5 }
        });

        addPageNumber();
    }

    // ===== PAGE 4: NARRATIVE GAPS =====
    if (data.gaps.length > 0) {
        doc.addPage();
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('⚠️ Zones d\'Ombre Détectées', 20, 30);

        let yPos = 45;
        data.gaps.forEach((gap, index) => {
            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = 30;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(gap.color === 'red' ? 220 : gap.color === 'amber' ? 245 : 250,
                gap.color === 'red' ? 38 : gap.color === 'amber' ? 158 : 204,
                gap.color === 'red' ? 38 : gap.color === 'amber' ? 11 : 21);
            doc.text(`${index + 1}. ${gap.title}`, 20, yPos);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Sévérité: ${gap.severity}`, 20, yPos + 7);

            doc.setTextColor(0);
            doc.setFontSize(11);
            const descLines = doc.splitTextToSize(gap.description, pageWidth - 40);
            doc.text(descLines, 20, yPos + 14);

            doc.setTextColor(50);
            doc.setFont('helvetica', 'italic');
            const impactLines = doc.splitTextToSize(`Impact: ${gap.impact}`, pageWidth - 40);
            doc.text(impactLines, 20, yPos + 14 + (descLines.length * 5));

            doc.setTextColor(180, 83, 9);
            doc.setFont('helvetica', 'bold');
            const suggLines = doc.splitTextToSize(`→ ${gap.suggestion}`, pageWidth - 40);
            doc.text(suggLines, 20, yPos + 14 + (descLines.length * 5) + (impactLines.length * 5));

            yPos += 50 + (descLines.length + impactLines.length + suggLines.length) * 2;
        });

        addPageNumber();
    }

    // ===== PAGE 5: AI INSIGHTS =====
    if (data.aiAnalysis) {
        doc.addPage();
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('🤖 Analyse IA', 20, 30);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        doc.text(`Style d'écriture: ${data.aiAnalysis.writingStyle}`, 20, 45);
        doc.text(`Ton émotionnel: ${data.aiAnalysis.emotionalTone}`, 20, 55);
        doc.text(`Score de cohérence: ${data.aiAnalysis.coherenceScore}/100`, 20, 65);

        // Strengths
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Forces:', 20, 80);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        data.aiAnalysis.strengths.forEach((strength, i) => {
            doc.text(`✓ ${strength}`, 25, 90 + (i * 8));
        });

        // Recommendations
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Recommandations:', 20, 120);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        data.aiAnalysis.recommendations.forEach((rec, i) => {
            const lines = doc.splitTextToSize(`• ${rec}`, pageWidth - 50);
            doc.text(lines, 25, 130 + (i * 15));
        });

        addPageNumber();
    }

    // ===== PAGE 6: GOALS =====
    if (data.goals && data.goals.length > 0) {
        doc.addPage();
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('🎯 Objectifs', 20, 30);

        const goalsData = [
            ['Type', 'Cible', 'Actuel', 'Statut'],
            ...data.goals.map(g => [
                g.goal_type === 'pages' ? 'Pages' : g.goal_type === 'chapters' ? 'Chapitres' : 'Date',
                g.target_value?.toString() || g.target_date || '-',
                g.current_value.toString(),
                g.status === 'active' ? 'Actif' : g.status === 'completed' ? 'Complété' : 'Abandonné'
            ])
        ];

        autoTable(doc, {
            startY: 40,
            head: [goalsData[0]],
            body: goalsData.slice(1),
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
            styles: { fontSize: 11, cellPadding: 5 }
        });

        addPageNumber();
    }

    // ===== FINAL PAGE: CONCLUSION =====
    doc.addPage();
    doc.setFillColor(180, 83, 9);
    doc.rect(0, 0, pageWidth, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Continuez votre voyage', pageWidth / 2, 35, { align: 'center' });

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const conclusion = `Chaque mot que vous écrivez est une pierre précieuse dans l'édifice de votre mémoire. Vous avez déjà parcouru ${data.stats.completion}% du chemin. Continuez à bâtir votre cathédrale de souvenirs.`;
    const conclusionLines = doc.splitTextToSize(conclusion, pageWidth - 40);
    doc.text(conclusionLines, pageWidth / 2, 80, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('— PLUME, votre biographe', pageWidth / 2, 120, { align: 'center' });

    addPageNumber();

    // Save the PDF
    doc.save(`PLUME_Rapport_${data.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export user data as JSON (backup)
 */
export const exportToJSON = (data: ExportData): void => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PLUME_Data_${data.userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// ===== BOOK EXPORT TYPES =====
export interface BookChapter {
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

export interface BookExportOptions {
    authorName: string;
    chapters: BookChapter[];
    bookTitle?: string;
    includePhotos?: boolean;
    includeQRCodes?: boolean;
    axis?: 'linear' | 'chronological' | 'thematic';
}

/**
 * Generate a beautiful PDF book with magazine-style layout
 */
export const exportBookToPDF = async (options: BookExportOptions): Promise<void> => {
    const {
        authorName,
        chapters,
        bookTitle = `L'Autobiographie de ${authorName}`,
        includePhotos = true,
        includeQRCodes = true,
        axis = 'linear'
    } = options;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let currentPage = 1;

    // Helper: Add decorative page number
    const addPageNumber = () => {
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.setFont('helvetica', 'italic');
        doc.text(`— ${currentPage} —`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        currentPage++;
    };

    // Helper: Add decorative header
    const addHeader = (text: string) => {
        doc.setDrawColor(180, 83, 9);
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 5, pageWidth - margin, margin + 5);

        doc.setFontSize(10);
        doc.setTextColor(180, 83, 9);
        doc.setFont('helvetica', 'bold');
        doc.text(text.toUpperCase(), pageWidth / 2, margin + 3, { align: 'center' });
    };

    // Helper: Generate QR Code URL
    const generateQRCodeUrl = (chapterId: string) => {
        const baseUrl = 'https://plume.app'; // Replace with actual domain
        const chapterUrl = `${baseUrl}/chapter/${chapterId}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(chapterUrl)}`;
    };

    // ===== COVER PAGE =====
    // Background gradient effect
    doc.setFillColor(252, 251, 249);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative top border
    doc.setFillColor(180, 83, 9);
    doc.rect(0, 0, pageWidth, 15, 'F');

    // Title
    doc.setTextColor(28, 25, 23);
    doc.setFontSize(36);
    doc.setFont('times', 'bold');
    const titleLines = doc.splitTextToSize(bookTitle, contentWidth);
    doc.text(titleLines, pageWidth / 2, 60, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setFont('times', 'italic');
    doc.setTextColor(120, 113, 108);
    doc.text('Rédigé avec PLUME', pageWidth / 2, 80, { align: 'center' });

    // Author
    doc.setFontSize(18);
    doc.setFont('times', 'normal');
    doc.setTextColor(68, 64, 60);
    doc.text(`par ${authorName}`, pageWidth / 2, 100, { align: 'center' });

    // Decorative element
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 30, 110, pageWidth / 2 + 30, 110);
    doc.circle(pageWidth / 2, 110, 2, 'F');

    // Date
    doc.setFontSize(11);
    doc.setTextColor(168, 162, 158);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(today, pageWidth / 2, pageHeight - 30, { align: 'center' });

    addPageNumber();

    // ===== TABLE OF CONTENTS =====
    doc.addPage();
    addHeader('PLUME');

    doc.setFontSize(24);
    doc.setFont('times', 'bold');
    doc.setTextColor(28, 25, 23);
    doc.text('Sommaire', pageWidth / 2, 40, { align: 'center' });

    let tocY = 55;
    chapters.forEach((chapter, index) => {
        if (tocY > pageHeight - 40) {
            doc.addPage();
            addHeader('PLUME');
            tocY = 40;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(68, 64, 60);

        const chapterTitle = chapter.title || `Chapitre ${index + 1}`;
        const truncated = chapterTitle.length > 60 ? chapterTitle.substring(0, 57) + '...' : chapterTitle;

        doc.text(`${index + 1}.`, margin, tocY);
        doc.text(truncated, margin + 10, tocY);

        // Dotted line
        doc.setDrawColor(214, 211, 209);
        (doc as any).setLineDash([1, 2]);
        doc.line(margin + 10 + doc.getTextWidth(truncated) + 3, tocY - 1, pageWidth - margin - 15, tocY - 1);
        (doc as any).setLineDash([]);

        // Page number (placeholder)
        doc.text(`${index + 3}`, pageWidth - margin - 10, tocY, { align: 'right' });

        tocY += 8;
    });

    addPageNumber();

    // ===== CHAPTERS =====
    chapters.forEach((chapter, chapterIndex) => {
        doc.addPage();
        addHeader('PLUME');

        let yPos = 40;

        // Chapter title
        doc.setFontSize(22);
        doc.setFont('times', 'bold');
        doc.setTextColor(28, 25, 23);
        const chapterTitle = chapter.title || `Chapitre ${chapterIndex + 1}`;
        const titleLines = doc.splitTextToSize(chapterTitle, contentWidth);
        doc.text(titleLines, pageWidth / 2, yPos, { align: 'center' });
        yPos += titleLines.length * 8 + 5;

        // Decorative line under title
        doc.setDrawColor(180, 83, 9);
        doc.setLineWidth(0.5);
        doc.line(pageWidth / 2 - 40, yPos, pageWidth / 2 + 40, yPos);
        yPos += 10;

        // Metadata badges
        if (chapter.metadata) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            let badgeX = margin;

            // Dates
            if (chapter.metadata.dates && chapter.metadata.dates.length > 0) {
                chapter.metadata.dates.slice(0, 2).forEach(date => {
                    doc.setFillColor(239, 246, 255);
                    doc.setTextColor(29, 78, 216);
                    doc.roundedRect(badgeX, yPos - 3, doc.getTextWidth(date) + 6, 6, 2, 2, 'F');
                    doc.text(date, badgeX + 3, yPos + 1);
                    badgeX += doc.getTextWidth(date) + 10;
                });
            }

            // Tags
            if (chapter.metadata.tags && chapter.metadata.tags.length > 0) {
                chapter.metadata.tags.slice(0, 3).forEach(tag => {
                    doc.setFillColor(255, 251, 235);
                    doc.setTextColor(180, 83, 9);
                    doc.roundedRect(badgeX, yPos - 3, doc.getTextWidth(tag) + 6, 6, 2, 2, 'F');
                    doc.text(tag, badgeX + 3, yPos + 1);
                    badgeX += doc.getTextWidth(tag) + 10;
                });
            }

            yPos += 12;
        }

        // Photo integration (magazine style)
        let photoHeight = 0;
        doc.setTextColor(68, 64, 60);

        const contentLines = doc.splitTextToSize(
            chapter.content,
            includePhotos && photoHeight > 0 ? contentWidth - 65 : contentWidth
        );

        contentLines.forEach((line: string, lineIndex: number) => {
            if (yPos > pageHeight - 35) {
                doc.addPage();
                addHeader('PLUME');
                yPos = 40;
            }

            // After photo height, use full width
            if (lineIndex * 5 > photoHeight && includePhotos && photoHeight > 0) {
                const remainingLines = contentLines.slice(lineIndex);
                const fullWidthLines = doc.splitTextToSize(remainingLines.join(' '), contentWidth);

                fullWidthLines.forEach((fwLine: string) => {
                    if (yPos > pageHeight - 35) {
                        doc.addPage();
                        addHeader('PLUME');
                        yPos = 40;
                    }
                    doc.text(fwLine, margin, yPos, { align: 'justify', maxWidth: contentWidth });
                    yPos += 5;
                });

                return; // Exit the forEach
            }

            doc.text(line, margin, yPos, { align: 'justify', maxWidth: includePhotos && photoHeight > 0 ? contentWidth - 65 : contentWidth });
            yPos += 5;
        });

        // QR Code for multimedia (phygital)
        if (includeQRCodes && chapter.metadata?.photos && chapter.metadata.photos.length > 1) {
            yPos += 10;

            if (yPos > pageHeight - 50) {
                doc.addPage();
                addHeader('PLUME');
                yPos = 40;
            }

            // QR Code box
            doc.setFillColor(255, 251, 235);
            doc.setDrawColor(251, 191, 36);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'FD');

            // QR Code placeholder (in production, embed actual QR image)
            doc.setFillColor(255, 255, 255);
            doc.rect(margin + 5, yPos + 5, 20, 20, 'F');
            doc.setFontSize(7);
            doc.setTextColor(120);
            doc.text('QR', margin + 12, yPos + 16, { align: 'center' });

            // QR Code text
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(68, 64, 60);
            doc.text('📱 Souvenir Augmenté', margin + 30, yPos + 10);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(87, 83, 78);
            const qrText = `Scannez ce code pour accéder aux ${chapter.metadata.photos.length} photos et médias de ce chapitre.`;
            const qrLines = doc.splitTextToSize(qrText, contentWidth - 35);
            doc.text(qrLines, margin + 30, yPos + 16);
        }

        addPageNumber();
    });

    // ===== FINAL PAGE =====
    doc.addPage();

    doc.setFillColor(180, 83, 9);
    doc.rect(0, 0, pageWidth, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('times', 'bold');
    doc.text('Fin', pageWidth / 2, 35, { align: 'center' });

    doc.setTextColor(68, 64, 60);
    doc.setFontSize(12);
    doc.setFont('times', 'italic');
    const epilogue = `Chaque page de ce livre est un fragment d'éternité. Merci d'avoir partagé votre histoire avec PLUME.`;
    const epilogueLines = doc.splitTextToSize(epilogue, contentWidth - 20);
    doc.text(epilogueLines, pageWidth / 2, 90, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`— ${authorName}`, pageWidth / 2, 120, { align: 'center' });

    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9);
    doc.text('Créé avec PLUME • plume.app', pageWidth / 2, pageHeight - 20, { align: 'center' });

    addPageNumber();

    // Save the PDF
    const filename = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_${authorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};

