# 🎨 Système de Styles d'Écriture - PLUME

## Vue d'ensemble

Le **Studio de Style** de PLUME offre une personnalisation avancée de la voix narrative avec 9 tons d'écriture, un curseur d'intensité, et des inspirations d'auteurs célèbres.

## Fonctionnalités

### 1. **9 Tons d'Écriture**

| Ton | Description | Cas d'usage |
|-----|-------------|-------------|
| **Authentique** | Sincère, factuel, témoignage | Récits historiques, faits précis |
| **Humour** | Léger, ironique, esprit | Anecdotes amusantes, moments légers |
| **Poétique** | Littéraire, métaphores | Descriptions sensorielles, émotions |
| **Direct** | Concis, sobre, efficace | Événements factuels, chronologie |
| **Nostalgique** | Mélancolique, doux, regret | Souvenirs d'enfance, temps passé |
| **Lyrique** | Expressif, musical, intense | Moments émotionnels forts |
| **Contemplatif** | Réflexif, philosophique | Introspection, questionnements |
| **Épique** | Grandiose, dramatique | Moments décisifs, tournants de vie |
| **Intimiste** | Confidentiel, pudique | Secrets, confidences, pudeur |

### 2. **Curseur d'Intensité (0-100%)**

- **0-30% (Subtil)** : Touches discrètes du style choisi
- **31-70% (Modéré)** : Équilibre entre style et naturel
- **71-100% (Intense)** : Style prononcé et affirmé

**Exemple avec "Poétique"** :
- **30%** : "Je me souviens de cette journée ensoleillée."
- **70%** : "Je me souviens de cette journée où le soleil dansait sur les pavés."
- **100%** : "Je me souviens de cette journée où le soleil, tel un peintre céleste, dansait sur les pavés dorés de mon enfance."

### 3. **Inspirations d'Auteurs**

Sélectionnez un auteur pour adopter automatiquement son style caractéristique :

- **Marcel Proust** → Contemplatif (phrases longues, introspection, mémoire)
- **Marguerite Duras** → Intimiste (épuré, silences, sensualité)
- **Albert Camus** → Direct (sobre, existentialiste, lucide)
- **Colette** → Poétique (sensoriel, gourmand, descriptif)
- **Annie Ernaux** → Authentique (factuel, sociologique, auto-analyse)
- **Romain Gary** → Lyrique (romanesque, tendre, universel)

## Utilisation dans l'application

### Intégration dans l'Atelier

```typescript
import { StyleStudio, StyleConfig } from './components/StyleStudio';

const [styleConfig, setStyleConfig] = useState<StyleConfig>({
  tone: Tone.AUTHENTIQUE,
  intensity: 50,
  authorStyle: undefined
});

<StyleStudio
  currentConfig={styleConfig}
  onConfigChange={setStyleConfig}
/>
```

### Transmission à l'IA

Le `StyleConfig` est converti en instructions pour Gemini :

```typescript
const prompt = `
PARAMÈTRES: Ton=${config.tone}, Intensité=${config.intensity}%
${config.authorStyle ? `Style inspiré de ${config.authorStyle}` : ''}
`;
```

## Design UX/UI

### Principes

1. **Exploration visuelle** : Cards colorées avec gradients uniques
2. **Feedback immédiat** : Aperçu en temps réel des exemples
3. **Hiérarchie claire** : Ton → Auteur → Intensité
4. **Accessibilité** : Tooltips, labels clairs, états visuels

### Palette de couleurs

Chaque ton a un gradient unique pour une identification rapide :

- Authentique : `from-amber-500 to-orange-600`
- Nostalgique : `from-rose-400 to-pink-500`
- Lyrique : `from-indigo-500 to-purple-600`
- etc.

## Évolutions futures

- [ ] **Presets personnalisés** : Sauvegarder des combinaisons favorites
- [ ] **Comparaison A/B** : Voir le même texte dans 2 styles différents
- [ ] **Mode Expert** : Combiner plusieurs tons (ex: "70% Nostalgique + 30% Poétique")
- [ ] **Analyse de cohérence** : Vérifier l'homogénéité stylistique du livre
- [ ] **Suggestions contextuelles** : L'IA recommande un style selon le contenu

## Architecture technique

### Composants

- `StyleStudio.tsx` : Interface principale du studio
- `types.ts` : Définitions TypeScript (Tone enum, StyleConfig)
- `geminiService.ts` : Intégration des styles dans les prompts IA

### État

```typescript
interface StyleConfig {
  tone: Tone;
  intensity: number; // 0-100
  authorStyle?: string;
}
```

### Flux de données

```
User Selection → StyleStudio → StyleConfig → App State → Gemini Service → AI Response
```

## Notes de conception

### Pourquoi 9 tons ?

- **4 de base** : Couvrent 80% des besoins (Authentique, Humour, Poétique, Direct)
- **5 avancés** : Nuances pour utilisateurs exigeants
- **Équilibre** : Assez de choix sans surcharger l'interface

### Pourquoi un curseur d'intensité ?

- Évite les extrêmes parfois gênants (poétique à 100% peut être trop)
- Permet une personnalisation fine
- UX moderne et intuitive

### Pourquoi les auteurs ?

- **Pédagogique** : Compréhension immédiate du style
- **Aspirationnel** : S'identifier à un maître
- **Différenciant** : Fonctionnalité premium unique

---

**Créé le** : 30 novembre 2025  
**Version** : 1.0  
**Auteur** : Équipe PLUME
