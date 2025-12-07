# 🧠 Analyse Approfondie & Cahier des Charges de Stabilisation (PLUME v2)

**Version:** 2.1 (Update Beta)
**Date:** 07/12/2024
**Statut:** Spécification Technique Validée
**Priorité:** Critique (Expérience Utilisateur)

---

## 1. 🔍 Diagnostic des Frictions & "Douleurs" Utilisateur

Après analyse du code (`App.tsx`, `geminiService.ts`) et des retours utilisateurs, voici les 5 points de rupture majeurs.

| Douleur Utilisateur | Cause Racine (Code Actuel) | Conséquence Visible |
|-------------------|--------------------------|-------------------|
| **"Plume me répète mon histoire dans le chat"** | `triggerSend` utilise des regex fragiles. Prompt system flou. | Pollution du livre par du chat. Compilation impossible à nettoyer. |
| **"J'ouvre un nouveau souvenir, mais je vois les anciens messages"** | `useChatSession` ne gère pas les sessions. | Confusion totale de contexte (IA parle de Noël en Été). |
| **"Je ne peux pas modifier confortablement un souvenir"** | `handleSouvenirSelect` charge le texte mais garde l'ancien chat. | L'utilisateur modifie le texte, l'IA répond hors contexte. |
| **"Peur de perdre mon style / mes textes existants"** | Pas de mode "Verbatim" ou "Protégé". L'IA réécrit tout. | Frustration des auteurs qui ont déjà des ébauches parfaites. |
| **"Mes idées ne disparaissent pas du coffre"** | Pas de lien entre `Idea` et `Souvenir`. | Le coffre se remplit de doublons déjà traités. |

---

## 2. 🏗️ Architecture Technique Cible : "Le Sanctuaire Fermé"

Pour résoudre ces problèmes, nous passons de "Flux Continu" à **"Sessions Hermétiques"**.

### A. Le Concept de "Session D'Écriture"
Une session est une unité de temps et de contexte. Elle commence quand l'utilisateur clique sur "Nouveau" ou "Éditer".

**Règle d'Or :** L'interface ne doit JAMAIS afficher un message qui n'appartient pas à la session active.

### B. Le Protocole de Communication (XML Strict)
**Nouveau System Prompt (Gemini) :**
```xml
<THINKING>...</THINKING>
<CONVERSATION>...</CONVERSATION>
<NARRATIVE>...</NARRATIVE>
<METADATA>...</METADATA>
```
L'IA sépare strictement le dialogue (Chat) du récit (Livre).

---

## 3. 📝 Spécifications des Fonctionnalités Clés

### 1. Nouveau Souvenir (Reset Absolu)
- **Action Backend :** Insérer `DIVIDER_START`.
- **Action Frontend :** Vider `messages state`.
- **Action IA :** Ping "START_SESSION" avec contexte profil.

### 2. Le "Auto-Compile" Intelligent
- Écoute le flux `<NARRATIVE>`.
- Si l'utilisateur modifie manuellement, cela devient la **Vérité Terrain**. L'IA continue *à la suite*.

### 3. Retour Boutique & Édition (Hydratation)
- Charge le texte et injecte un prompt contexte: *"L'auteur revient sur [TITRE]. Texte actuel : [...]"*.

---

## 4. 🌱 V2.1 - Retours Beta & Raffinements (Update 07/12)

Suite aux retours des premiers beta-testeurs, nous ajoutons deux piliers fondamentaux.

### A. Le "Droit à l'Authenticité Absolue" (Sanctuaire)
**Problème :** Certains utilisateurs ont déjà des textes parfaits. Ils craignent que l'IA ne les "lisse".
**Solution :**
1.  **Mode "Verbatim" (Authenticité 100%)** :
    -   Ajout d'une option dans le slider "Fidélité" (ou un toggle "Mode Import").
    -   Instruction IA : *"Interdiction de modifier ce segment. Contente-toi de le formater ou de le continuer."*
2.  **Collage Intelligent** :
    -   Si un utilisateur colle un gros bloc de texte, Plume demande : *"Voulez-vous que je retravaille ce texte ou que je le garde intact ?"*

### B. Cycle de Vie des Idées (Coffre Intelligent)
**Problème :** Une idée utilisée pour démarrer un souvenir reste visible.
**Solution :**
-   Quand une idée est utilisée :
    1.  Marquer l'idée comme `status: 'converted'` dans la DB.
    2.  Lier l'idée au nouveau souvenir (`souvenir_id`).
    3.  L'idée disparaît visuellement du coffre (ou passe dans "Archives").

### C. Anti-Page Blanche : Proactivité Intelligente
**Problème :** L'utilisateur arrive devant "Nouveau Souvenir" et sèche, mais ne pense pas à ouvrir le coffre.
**Solution :**
- L'IA ne doit pas attendre.
- Dès l'ouverture d'une nouvelle session, l'IA analyse silencieusement :
  1. Le Coffre à Idées (Top 3).
  2. Les "Trous" de la chronologie (Zones d'ombre).
  3. Les profils personnages trop peu cités.
- **Message d'accueil proactif** : "Bonjour Stéphane. Pour démarrer, voulez-vous explorer cette idée que vous aviez notée : 'Le vélo rouge' ? Ou préfèrez-vous combler ce vide en 1998 ?"
- Si l'utilisateur clique "Oui pour le vélo", l'idée est automatiquement sortie du coffre.

---

## 5. 📅 Plan de Bataille Révisé

### Étape 1 : Blindage IA (FAIT ✅)
- Protocol XML implémenté.
- Service Gemini robuste.

### Étape 2 : Sessions & UI (FAIT ✅)
- Isolation des sessions (`loadUserData`).
- Mode Édition fonctionnel.

### Étape 3 : Raffinements V2.1 (À FAIRE 🚧)
- [ ] Implémenter le switch "Authenticité Max" dans `StudioView`.
- [ ] Mettre à jour `handleNewSequence` pour "consommer" l'idée du coffre (Update DB).
- [ ] Ajouter un prompt spécifique "Protection de texte" dans `geminiService`.

---
