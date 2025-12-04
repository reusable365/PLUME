# 🏗️ REFONTE ATELIER : UX, DATA & INTELLIGENCE

Ce document analyse et structure la transformation de l'Atelier en un véritable "Cockpit de Rédaction Intelligent".

## 1. UX & INTERFACE : La "Zone de Commande Unifiée"

**Problème Actuel :**
- Les paramètres (Ton, Longueur, Fidélité) sont déconnectés de la zone de saisie (en haut de page).
- L'utilisateur doit faire des allers-retours visuels.
- L'écran est encombré par des réglages qui ne servent qu'au moment de la génération.

**Solution Cible :**
- **Fusion :** Intégrer les "Paramètres de Style" directement dans la barre d'outils de saisie (Input Bar).
- **Interaction :** Une icône "Plume" ou "Réglages" à gauche.
- **Comportement :** Au clic, un petit panneau "pop-up" apparaît juste au-dessus de la barre de saisie, permettant de régler le style à la volée sans quitter le clavier des yeux.

## 2. INTELLIGENCE CONTEXTUELLE (Gestion des Tags & Entités)

C'est le point critique pour la "magie" de PLUME.

**Le Défi "Caroline vs Charlotte" :**
L'IA doit résoudre les ambiguïtés ("ma chérie", "maman", "la maison") en fonction du contexte temporel.

**Architecture Proposée :**
1.  **Timeline des Relations :**
    - Dans la table `people`, ajouter des métadonnées temporelles (ex: `relationship_start`, `relationship_end`).
    - *Exemple :* Charlotte (Tag: `amourette`, `1995-1998`), Caroline (Tag: `épouse`, `2005-présent`).
2.  **Résolution d'Entité au moment du Draft :**
    - Avant de générer le texte, PLUME analyse les mots-clés ambigus.
    - Si l'utilisateur dit "vacances avec ma chérie en 96", PLUME consulte la base : "En 96, 'ma chérie' correspond probablement à Charlotte".
    - PLUME peut demander confirmation subtilement : *"On parle bien de Charlotte ici ?"* ou l'assumer dans le brouillon.

**Impact sur la Boutique :**
- Les tags ne sont pas juste des étiquettes, ce sont des **liens vivants**.
- Filtrer par "Amour" montrera Charlotte ET Caroline, mais filtrer par "Période Lycée" ne montrera que Charlotte.

## 3. WORKFLOW : De la Page Blanche à la Boutique

Le cycle de vie d'un souvenir doit être strict pour garantir la qualité.

**Phase A : L'Échange (Conversation)**
- PLUME pose des questions.
- L'utilisateur répond.
- *Nouveauté :* PLUME détecte et valide les entités au fil de l'eau (ex: "C'était à Nice ?" -> Tag `Lieu: Nice` ajouté provisoirement).

**Phase B : La Synthèse (Le Draft)**
- L'utilisateur clique sur "Synthèse".
- PLUME génère le récit en utilisant les Paramètres de Style (définis en bas).
- **Régénération :** Si le texte ne plaît pas, l'utilisateur doit pouvoir dire "Plus court" ou "Plus drôle". Le bouton "Régénérer" doit rouvrir les paramètres de style pour ajustement rapide.

**Phase C : La Validation (Le Sas de Sortie)**
- Avant d'envoyer vers la "Boutique" (Enregistrement final), une **Carte d'Identité du Souvenir** apparaît.
- **Checklist obligatoire :**
    - [ ] Titre (Généré ou modifié)
    - [ ] Date/Époque (Validée)
    - [ ] Lieux (Validés)
    - [ ] Personnes identifiées (C'est ici qu'on valide que c'est bien Caroline).
    - [ ] Médias associés (Photos ancrées).
- Ce n'est qu'après validation de cette carte que le souvenir part en base "propre".

## 4. PLAN D'ACTION TECHNIQUE

1.  **Immédiat (UI) :** Déplacer le bloc "Style" dans la barre d'input (`App.tsx`).
2.  **Court Terme (Data) :** Enrichir le `entityService` pour gérer les relations temporelles.
3.  **Moyen Terme (Workflow) :** Créer le composant `SouvenirValidatorModal` pour l'étape de fin.
