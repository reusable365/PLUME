# 🔄 Plan de Refactoring App.tsx - À FAIRE APRÈS NOËL

> [!NOTE]
> Ce document capture les idées de refactoring identifiées le 23/12/2024.
> À reprendre après les fêtes pour améliorer la maintenabilité.

## Fichier Cible
**`App.tsx`** - 1965 lignes, 55 fonctions

---

## Extractions Prioritaires

### 1. `useVoiceRecording` (164 lignes)
**Lignes** : 663-827  
**Contenu** :
- `handleStartRecording()`
- Gestion Web Speech API
- Gemini Live API audio
- États : `isRecording`, refs audio

### 2. `useUserData` (214 lignes)
**Lignes** : 261-475  
**Contenu** :
- `loadUserData(authUser)`
- Chargement profil/messages/ideas
- Local storage fallback

### 3. `useSequence` (120 lignes)
**Lignes** : 1447-1567  
**Contenu** :
- `handleNewSequence()`
- Gestion dividers/sessions

### 4. `useValidation` (151 lignes)
**Lignes** : 1006-1157  
**Contenu** :
- `handleValidationConfirm()`
- Sauvegarde chapitres

---

## Bénéfices Attendus
- Réduction de ~650 lignes dans App.tsx
- Meilleure testabilité
- Réutilisabilité des hooks
