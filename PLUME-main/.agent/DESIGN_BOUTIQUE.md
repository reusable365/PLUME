# 🎨 Design Visuel - La Boutique des Souvenirs

## 🏛️ Concept : "Le Sanctuaire Vivant"

Un espace chaleureux qui mélange l'esthétique d'un atelier d'artisan et d'une bibliothèque magique.

---

## 📐 Structure de la Page

```
┌─────────────────────────────────────────────────────────────┐
│  🎥 BANNIÈRE VIDÉO (Votre vidéo personnalisée)              │
│  - Hauteur : 300px (desktop) / 200px (mobile)               │
│  - Overlay gradient pour le texte                           │
│  - Titre : "Le Sanctuaire" en overlay                       │
│  - Sous-titre : "Où vos souvenirs prennent vie"             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  ✨ INSIGHTS DE VIE (Nouveau - WOW Factor)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🧠 "Vos souvenirs révèlent..."                      │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │ │Insight 1│ │Insight 2│ │Insight 3│ │Insight 4│   │   │
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  │ Scroll horizontal avec cartes glassmorphism        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  🔍 BARRE DE RECHERCHE + FILTRES                            │
│  [🔎 Rechercher...] [🎛️ Filtres (3)]                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  📊 STATISTIQUES RAPIDES (Nouveau)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 42       │ │ 15       │ │ 8        │ │ 1995-    │      │
│  │ Souvenirs│ │ Lieux    │ │ Personnes│ │ 2024     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  📚 GRILLE DE SOUVENIRS (Cartes Glassmorphism)              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ 😊      │ │ 🌅      │ │ 😢      │  ← Badges émotionnels │
│  │ Titre   │ │ Titre   │ │ Titre   │                       │
│  │ Extrait │ │ Extrait │ │ Extrait │                       │
│  │ 📍Nice  │ │ 📍Paris │ │ 📍Lyon  │                       │
│  │ 1996    │ │ 2003    │ │ 2010    │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ ...     │ │ ...     │ │ ...     │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Palette de Couleurs (Esprit Atelier)

```css
/* Couleurs principales */
--atelier-wood: #8B7355;        /* Bois d'atelier */
--atelier-paper: #F5F1E8;       /* Papier ancien */
--atelier-ink: #2C2416;         /* Encre */
--atelier-gold: #D4AF37;        /* Dorures */
--atelier-leather: #6B4423;     /* Cuir */

/* Accents émotionnels */
--emotion-joy: #FFD700;         /* Or joyeux */
--emotion-nostalgia: #DDA0DD;   /* Mauve nostalgique */
--emotion-sadness: #4169E1;     /* Bleu mélancolique */
--emotion-neutral: #A9A9A9;     /* Gris neutre */

/* Glassmorphism */
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
```

---

## 🎥 Intégration de Votre Vidéo

### Option 1 : Vidéo en Arrière-Plan (Recommandé)

```tsx
<div className="relative h-80 overflow-hidden rounded-3xl mb-8 shadow-2xl">
    {/* Votre vidéo */}
    <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
    >
        <source src="/videos/boutique-ambiance.mp4" type="video/mp4" />
    </video>
    
    {/* Overlay gradient pour lisibilité */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
    
    {/* Contenu par-dessus */}
    <div className="relative h-full flex flex-col items-center justify-center text-white px-4">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <h1 className="text-5xl font-serif font-bold mb-3 drop-shadow-lg">
                Le Sanctuaire
            </h1>
            <p className="text-xl font-light drop-shadow-md">
                Où vos souvenirs prennent vie
            </p>
        </div>
    </div>
</div>
```

### Option 2 : Vidéo Décorative sur le Côté

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    {/* Vidéo à gauche */}
    <div className="rounded-3xl overflow-hidden shadow-2xl">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/videos/boutique-ambiance.mp4" type="video/mp4" />
        </video>
    </div>
    
    {/* Texte à droite */}
    <div className="flex flex-col justify-center">
        <h1 className="text-5xl font-serif font-bold text-ink-900 mb-4">
            Le Sanctuaire
        </h1>
        <p className="text-xl text-ink-700 mb-6">
            Explorez, organisez et redécouvrez vos mémoires avec l'intelligence artificielle
        </p>
        <div className="flex gap-4">
            <button className="px-6 py-3 bg-accent text-white rounded-xl">
                📖 Mes Histoires
            </button>
            <button className="px-6 py-3 bg-white text-accent border-2 border-accent rounded-xl">
                📸 Mes Photos
            </button>
        </div>
    </div>
</div>
```

---

## ✨ Composant "Insights de Vie" (Nouveau)

```tsx
<div className="mb-8 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-3xl p-8 shadow-xl border border-purple-200/50">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-3xl font-serif font-bold text-ink-900 mb-2">
                ✨ Vos Souvenirs Révèlent...
            </h2>
            <p className="text-ink-600">
                L'IA a analysé {souvenirs.length} souvenirs et découvert ces patterns
            </p>
        </div>
        <button className="px-4 py-2 bg-white/80 rounded-xl text-sm font-medium hover:bg-white transition-colors">
            🔄 Actualiser
        </button>
    </div>
    
    {/* Insights Cards - Scroll Horizontal */}
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {insights.map((insight, idx) => (
            <div 
                key={idx}
                className="min-w-[300px] bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 snap-start hover:scale-105 transition-transform cursor-pointer"
                onClick={() => filterByInsight(insight)}
            >
                {/* Icon basé sur le type */}
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">
                        {insight.type === 'emotional' ? '❤️' : 
                         insight.type === 'temporal' ? '⏰' :
                         insight.type === 'relational' ? '👥' : '🗺️'}
                    </span>
                </div>
                
                {/* Titre */}
                <h3 className="font-bold text-lg text-ink-900 mb-2">
                    {insight.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-ink-600 mb-4 line-clamp-3">
                    {insight.description}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-700 font-medium">
                        {insight.relatedSouvenirIds.length} souvenirs liés
                    </span>
                    <span className="text-ink-400">
                        {insight.confidence}% confiance
                    </span>
                </div>
            </div>
        ))}
    </div>
</div>
```

---

## 📊 Statistiques Rapides (Nouveau)

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/50">
        <div className="text-4xl font-bold text-accent mb-2">
            {souvenirs.length}
        </div>
        <div className="text-sm text-ink-600 font-medium">
            Souvenirs Gravés
        </div>
    </div>
    
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/50">
        <div className="text-4xl font-bold text-blue-600 mb-2">
            {uniquePlaces.length}
        </div>
        <div className="text-sm text-ink-600 font-medium">
            Lieux Visités
        </div>
    </div>
    
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/50">
        <div className="text-4xl font-bold text-purple-600 mb-2">
            {uniqueCharacters.length}
        </div>
        <div className="text-sm text-ink-600 font-medium">
            Personnages
        </div>
    </div>
    
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-center shadow-lg border border-white/50">
        <div className="text-4xl font-bold text-green-600 mb-2">
            {yearRange}
        </div>
        <div className="text-sm text-ink-600 font-medium">
            Années Couvertes
        </div>
    </div>
</div>
```

---

## 🎴 Cartes de Souvenirs Améliorées

```tsx
<div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group relative">
    {/* Badge Émotionnel (Nouveau) */}
    <div className="absolute top-4 left-4 bg-white/90 rounded-full px-3 py-1 shadow-sm flex items-center gap-2">
        <span className="text-2xl">{emotionEmoji}</span>
        <span className="text-xs font-medium text-ink-600">{emotionLabel}</span>
    </div>
    
    {/* Badge Statut */}
    <div className="absolute top-4 right-4">
        {status === 'published' ? (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                ✓ Gravé
            </span>
        ) : (
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                ✎ Brouillon
            </span>
        )}
    </div>
    
    {/* Contenu */}
    <div className="mt-12">
        <h3 className="text-xl font-serif font-bold text-ink-900 mb-3">
            {title}
        </h3>
        
        <p className="text-ink-600 text-sm mb-4 line-clamp-3">
            {narrative}
        </p>
        
        {/* Métadonnées */}
        <div className="flex flex-wrap gap-2 mb-4">
            {places?.[0] && (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    📍 {places[0]}
                </span>
            )}
            {dates?.[0] && (
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    📅 {dates[0]}
                </span>
            )}
            {characters?.[0] && (
                <span className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">
                    👤 {characters[0]}
                </span>
            )}
        </div>
        
        {/* Actions (visible au hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium">
                Lire →
            </button>
            <button className="p-2 bg-ink-100 text-ink-600 rounded-lg hover:bg-ink-200">
                <IconShare2 className="w-4 h-4" />
            </button>
        </div>
    </div>
</div>
```

---

## 🎬 Animations

```css
/* Fade in pour les insights */
@keyframes slideInFromLeft {
    from {
        opacity: 0;
        transform: translateX(-50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.insight-card {
    animation: slideInFromLeft 0.5s ease-out forwards;
}

.insight-card:nth-child(2) { animation-delay: 0.1s; }
.insight-card:nth-child(3) { animation-delay: 0.2s; }
.insight-card:nth-child(4) { animation-delay: 0.3s; }

/* Pulse pour les badges émotionnels */
@keyframes pulse-glow {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
    }
    50% {
        box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
    }
}

.emotion-badge {
    animation: pulse-glow 2s infinite;
}
```

---

## 📱 Responsive

- **Desktop (>1024px)** : Grille 3 colonnes
- **Tablet (768-1024px)** : Grille 2 colonnes
- **Mobile (<768px)** : Grille 1 colonne, insights en scroll horizontal

---

**Prêt à implémenter ?** 🚀

Ce design garde l'esprit "atelier" avec :
- Couleurs chaudes (bois, papier, encre)
- Glassmorphism pour la modernité
- Votre vidéo en hero
- Place pour les insights IA

Dois-je commencer le code ?
