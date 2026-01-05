/**
 * helpContent.ts
 * Contenu complet du système d'aide interactif PLUME
 */

// Types
export interface TourStep {
    id: string;
    target: string;
    title: string;
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    section: 'atelier' | 'sanctuaire' | 'dashboard' | 'univers' | 'livre' | 'repertoire' | 'global';
    order: number;
}

export interface TooltipContent {
    id: string;
    title: string;
    description: string;
    learnMoreSection?: string;
}

export interface GlossaryItem {
    term: string;
    definition: string;
    icon?: string;
}

export interface FAQItem {
    question: string;
    answer: string;
    category: string;
}

// ============================================
// TOUR STEPS - Étapes du guide interactif
// ============================================

export const TOUR_STEPS: TourStep[] = [
    // === ACCUEIL ===
    {
        id: 'welcome',
        target: 'body',
        title: '🪶 Bienvenue dans PLUME',
        content: 'Votre compagnon d\'écriture pour transformer vos souvenirs en récits magnifiques. Je vais vous présenter les fonctionnalités principales.',
        placement: 'center',
        section: 'global',
        order: 0,
    },

    // === ATELIER ===
    {
        id: 'atelier-intro',
        target: 'body',
        title: '✍️ L\'Atelier - Votre Espace d\'Écriture',
        content: 'L\'Atelier est l\'endroit où vous dialoguez avec Plume pour créer vos souvenirs. Écrivez ou dictez naturellement, Plume vous guide avec des questions.',
        placement: 'center',
        section: 'atelier',
        order: 1,
    },
    {
        id: 'atelier-features',
        target: 'body',
        title: '🎨 Les Outils de Création',
        content: '• 🎤 Dictée vocale : parlez au lieu d\'écrire\n• 🎨 Studio de Style : choisissez le ton (poétique, nostalgique...)\n• ↻ Régénérer : demandez plusieurs versions\n• 📸 Photo : importez des photos pour inspirer le récit',
        placement: 'center',
        section: 'atelier',
        order: 2,
    },
    {
        id: 'atelier-graver',
        target: 'body',
        title: '💎 Graver ou 🌱 Laisser Germer',
        content: '• 💎 Graver : Valider définitivement le souvenir\n• 🌱 Germer : Sauvegarder en brouillon pour plus tard\n\nUn Score de Maturité vous aide à savoir si le souvenir est assez enrichi.',
        placement: 'center',
        section: 'atelier',
        order: 3,
    },

    // === SANCTUAIRE ===
    {
        id: 'sanctuaire-intro',
        target: 'body',
        title: '📚 Le Sanctuaire',
        content: 'Votre bibliothèque personnelle ! Tous vos souvenirs gravés et brouillons sont rangés ici, prêts à être explorés ou partagés.',
        placement: 'center',
        section: 'sanctuaire',
        order: 10,
    },
    {
        id: 'sanctuaire-features',
        target: 'body',
        title: '🔍 Recherche et Filtres',
        content: '• Recherchez par mot-clé, personne ou lieu\n• Filtrez par décennie, émotion, statut\n• 📤 Partagez avec vos proches\n• 👥 Invitez un "témoin" à enrichir un souvenir',
        placement: 'center',
        section: 'sanctuaire',
        order: 11,
    },

    // === TABLEAU DE BORD ===
    {
        id: 'dashboard-intro',
        target: 'body',
        title: '📊 Le Tableau de Bord',
        content: 'Vue d\'ensemble de votre progression : pages écrites, chapitres créés, photos intégrées et recommandations personnalisées.',
        placement: 'center',
        section: 'dashboard',
        order: 20,
    },
    {
        id: 'dashboard-zones',
        target: 'body',
        title: '🔦 Les Zones d\'Ombre',
        content: 'L\'IA détecte les périodes ou thèmes que vous n\'avez pas encore abordés. Cliquez pour les explorer et ne rien oublier d\'important !',
        placement: 'center',
        section: 'dashboard',
        order: 21,
    },

    // === UNIVERS DE VIE ===
    {
        id: 'univers-intro',
        target: 'body',
        title: '🌌 L\'Univers de Vie',
        content: 'Visualisez votre vie sous 3 angles :\n• 🗺️ Carte : les lieux importants\n• 👥 Relations : les personnes qui comptent\n• ⏳ Chronologie : les périodes clés',
        placement: 'center',
        section: 'univers',
        order: 30,
    },

    // === LIVRE ===
    {
        id: 'livre-intro',
        target: 'body',
        title: '📖 Le Livre',
        content: 'Organisez vos souvenirs en chapitres pour créer votre autobiographie. Glissez-déposez les récits dans l\'ordre de votre choix.',
        placement: 'center',
        section: 'livre',
        order: 40,
    },
    {
        id: 'livre-audio',
        target: 'body',
        title: '🎧 Le Livre Audio (Nouveau !)',
        content: 'Écoutez vos souvenirs narrés par une voix IA ultra-réaliste. Cliquez sur l\'icône de lecture dans chaque chapitre pour donner vie à votre histoire.',
        placement: 'center',
        section: 'livre',
        order: 41,
    },
    {
        id: 'livre-export',
        target: 'body',
        title: '📄 Exporter en PDF',
        content: 'Une fois satisfait, exportez votre livre en PDF. Vous obtiendrez un fichier magnifiquement mis en page, prêt à imprimer ou offrir !',
        placement: 'center',
        section: 'livre',
        order: 42,
    },

    // === RÉPERTOIRE ===
    {
        id: 'repertoire-intro',
        target: 'body',
        title: '👥 Le Répertoire',
        content: 'Toutes les personnes détectées dans vos souvenirs. Vous pouvez fusionner les doublons (ex: "Papa" et "Jean") ou supprimer les erreurs.',
        placement: 'center',
        section: 'repertoire',
        order: 50,
    },

    // === FIN ===
    {
        id: 'tour-complete',
        target: 'body',
        title: '🎉 Vous êtes prêt !',
        content: 'Vous connaissez maintenant l\'essentiel de PLUME. Cliquez sur ❓ à tout moment pour revoir ce guide, consulter le glossaire ou la FAQ.',
        placement: 'center',
        section: 'global',
        order: 100,
    },
];

// ============================================
// TOOLTIPS - Contenu des info-bulles
// ============================================

export const TOOLTIPS: Record<string, TooltipContent> = {
    'regenerate': {
        id: 'regenerate',
        title: '↻ Régénérer le texte',
        description: 'Demandez à Plume de réécrire ce passage avec un ton différent (poétique, nostalgique...) ou une longueur différente.',
        learnMoreSection: 'atelier',
    },
    'graver': {
        id: 'graver',
        title: '💎 Graver ce souvenir',
        description: 'Validez définitivement votre récit. Il sera sauvegardé et pourra être ajouté à votre livre.',
        learnMoreSection: 'atelier',
    },
    'germer': {
        id: 'germer',
        title: '🌱 Laisser germer',
        description: 'Sauvegardez en brouillon pour y revenir plus tard. Rien n\'est perdu !',
        learnMoreSection: 'atelier',
    },
    'style-studio': {
        id: 'style-studio',
        title: '🎨 Studio de Style',
        description: 'Choisissez le ton de votre récit : Authentique, Poétique, Nostalgique, Humour ou Intime.',
        learnMoreSection: 'atelier',
    },
    'authenticity': {
        id: 'authenticity',
        title: '📜 Curseur d\'Authenticité',
        description: '"Sacré" = Plume garde vos mots exacts. "Libre" = Plume peut embellir et enrichir.',
        learnMoreSection: 'atelier',
    },
    'photo-catalyst': {
        id: 'photo-catalyst',
        title: '📸 Catalyseur Photo',
        description: 'Importez une photo pour que l\'IA l\'analyse et vous aide à raconter ce souvenir.',
        learnMoreSection: 'photo',
    },
    'share': {
        id: 'share',
        title: '📤 Partager',
        description: 'Envoyez ce souvenir à vos proches ou invitez-les à ajouter leurs propres mémoires.',
        learnMoreSection: 'partage',
    },
    'merge': {
        id: 'merge',
        title: '🔗 Fusionner',
        description: 'Sélectionnez plusieurs fiches qui désignent la même personne et fusionnez-les.',
        learnMoreSection: 'repertoire',
    },
    'export-pdf': {
        id: 'export-pdf',
        title: '📄 Exporter en PDF',
        description: 'Téléchargez votre livre complet au format PDF, prêt à imprimer ou à offrir.',
        learnMoreSection: 'livre',
    },
    'ai-structure': {
        id: 'ai-structure',
        title: '✨ Génération IA',
        description: 'Laissez l\'IA organiser automatiquement vos souvenirs en chapitres.',
        learnMoreSection: 'livre',
    },
    'zones-ombre': {
        id: 'zones-ombre',
        title: '🔦 Zones d\'Ombre',
        description: 'Périodes ou thèmes que vous n\'avez pas encore abordés. Des pistes pour enrichir votre récit !',
        learnMoreSection: 'dashboard',
    },
    'microphone': {
        id: 'microphone',
        title: '🎤 Dictée Vocale',
        description: 'Parlez naturellement et Plume transcrit vos paroles en texte.',
        learnMoreSection: 'atelier',
    },
    'temoin': {
        id: 'temoin',
        title: '👥 Appel à Témoin',
        description: 'Invitez un proche à enrichir ce souvenir avec ses propres mémoires.',
        learnMoreSection: 'partage',
    },
};

// ============================================
// GLOSSAIRE
// ============================================

export const GLOSSARY: GlossaryItem[] = [
    {
        term: 'Graver',
        definition: 'Valider définitivement un souvenir. Une fois gravé, il est sauvegardé de façon permanente.',
        icon: '💎',
    },
    {
        term: 'Germer (Laisser germer)',
        definition: 'Sauvegarder un souvenir en brouillon pour y revenir plus tard.',
        icon: '🌱',
    },
    {
        term: 'Texte Sacré',
        definition: 'Quand le curseur d\'authenticité est au maximum, Plume ne modifie pas vos mots.',
        icon: '📜',
    },
    {
        term: 'Sanctuaire',
        definition: 'La bibliothèque de tous vos souvenirs gravés et brouillons.',
        icon: '📚',
    },
    {
        term: 'Catalyseur',
        definition: 'Outil qui transforme une photo en récit grâce à l\'analyse IA.',
        icon: '📸',
    },
    {
        term: 'Témoin',
        definition: 'Personne que vous invitez à enrichir un souvenir avec ses propres mémoires.',
        icon: '👥',
    },
    {
        term: 'Zones d\'Ombre',
        definition: 'Périodes ou thèmes de votre vie que vous n\'avez pas encore abordés.',
        icon: '🔦',
    },
    {
        term: 'Insight',
        definition: 'Analyse intelligente générée par l\'IA pour vous aider.',
        icon: '💡',
    },
];

// ============================================
// FAQ RAPIDE
// ============================================

export const FAQ: FAQItem[] = [
    {
        question: 'Comment modifier un souvenir déjà gravé ?',
        answer: 'Allez dans le Sanctuaire, cliquez sur le souvenir, puis sur "Modifier". Vous pourrez le ré-éditer et le re-graver.',
        category: 'édition',
    },
    {
        question: 'Que signifie le score de maturité ?',
        answer: 'Il indique si votre souvenir est assez enrichi (dates, lieux, personnes...). Un score de 80%+ est recommandé avant de graver.',
        category: 'édition',
    },
    {
        question: 'Comment fusionner deux personnes ?',
        answer: 'Dans le Répertoire, cliquez sur chaque fiche à fusionner (des coches apparaissent), puis appuyez sur "Fusionner".',
        category: 'répertoire',
    },
    {
        question: 'Puis-je récupérer un souvenir supprimé ?',
        answer: 'Non, la suppression est définitive. Avant de supprimer, assurez-vous que c\'est bien ce que vous voulez.',
        category: 'édition',
    },
    {
        question: 'Comment exporter mon livre en PDF ?',
        answer: 'Allez dans la section "Livre", organisez vos chapitres, puis cliquez sur "Exporter en PDF".',
        category: 'livre',
    },
    {
        question: 'Que fait le bouton "Régénérer" ?',
        answer: 'Il demande à Plume de réécrire le récit avec un ton différent (plus poétique, plus court, etc.).',
        category: 'édition',
    },
    {
        question: 'Comment inviter un proche à contribuer ?',
        answer: 'Cliquez sur Partager > Appel à Témoin. Remplissez votre question et partagez le lien par WhatsApp ou email.',
        category: 'partage',
    },
];

// ============================================
// SECTIONS DU GUIDE
// ============================================

export const GUIDE_SECTIONS = [
    { id: 'atelier', title: 'L\'Atelier', icon: '✍️', description: 'Écrire et dicter vos souvenirs' },
    { id: 'sanctuaire', title: 'Le Sanctuaire', icon: '📚', description: 'Votre bibliothèque de souvenirs' },
    { id: 'dashboard', title: 'Tableau de Bord', icon: '📊', description: 'Statistiques et progression' },
    { id: 'univers', title: 'Univers de Vie', icon: '🌌', description: 'Lieux, relations et temps' },
    { id: 'livre', title: 'Le Livre', icon: '📖', description: 'Organiser et exporter' },
    { id: 'repertoire', title: 'Répertoire', icon: '👥', description: 'Gérer les personnes' },
    { id: 'photo', title: 'Catalyseur Photo', icon: '📸', description: 'Photos → Récits' },
    { id: 'partage', title: 'Partage', icon: '📤', description: 'Témoins et invitations' },
];

// ============================================
// HELPERS
// ============================================

export const getTourStepsForSection = (section: string): TourStep[] => {
    return TOUR_STEPS.filter(step => step.section === section || step.section === 'global')
        .sort((a, b) => a.order - b.order);
};

export const getTooltipContent = (id: string): TooltipContent | undefined => {
    return TOOLTIPS[id];
};

export const searchHelp = (query: string): { glossary: GlossaryItem[], faq: FAQItem[] } => {
    const lowerQuery = query.toLowerCase();
    return {
        glossary: GLOSSARY.filter(item =>
            item.term.toLowerCase().includes(lowerQuery) ||
            item.definition.toLowerCase().includes(lowerQuery)
        ),
        faq: FAQ.filter(item =>
            item.question.toLowerCase().includes(lowerQuery) ||
            item.answer.toLowerCase().includes(lowerQuery)
        ),
    };
};
