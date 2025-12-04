# Analyse & Proposition de Workflow : Le Concept "Bulle de Souvenir"

Ce document propose une refonte du workflow basée sur la métaphore de la **"Bulle"** : un souvenir est d'abord fragile et éthéré, qu'il faut capturer, consolider, puis préserver précieusement.

---

## 1. Diagnostic : Pourquoi le workflow actuel "grince" ?

| Étape | État Actuel (Approche "Traitement de Texte") | Ressenti Utilisateur | Point de Friction Majeur |
| :--- | :--- | :--- | :--- |
| **Démarrage** | Un champ de saisie vide et un historique de chat. | "Par quoi je commence ? C'est vide." | **L'angoisse de la page blanche.** Le Coffre à idées est caché/déconnecté. |
| **Écriture** | Un chat linéaire sans fin apparente. | "Est-ce que j'ai assez raconté ? Quand ça s'arrête ?" | **Manque de feedback.** Pas d'indicateur de progression ou de "maturité" du souvenir. |
| **Transition** | Boutons techniques ("Synthèse", "Ciseaux"). | "Je clique sur quoi ? J'ai peur de perdre mon texte." | **Rupture de flux.** Les termes sont trop fonctionnels et anxiogènes. |
| **Clôture** | Le texte est généré, puis... flou. | "C'est fini ? C'est où ?" | **Absence de rituel.** Pas de moment satisfaisant de "mise en boîte". |

---

## 2. Proposition : Le Workflow "Bulle de Souvenir" (Organique)

L'objectif est de rendre le processus fluide, rassurant et gratifiant.

### Phase 1 : L'Inspiration (Former la Bulle)
Au lieu d'un écran vide, l'Atelier propose des points de départ.
*   **Concept UI** : "Le Hub d'Inspiration".
*   **Visuel Mockup** : Au centre, une invitation douce "Quel souvenir explorons-nous ?". Autour, flottant comme des bulles :
    *   🫧 **Bulle "Idée du jour"** (venant du Coffre).
    *   🫧 **Bulle "Photo"** (Importer une image).
    *   🫧 **Bulle "Libre"** (Juste écrire).

### Phase 2 : Le Souffle (Gonfler la Bulle)
Pendant la conversation avec Plume.
*   **Concept UI** : "La Jauge de Maturité".
*   **Visuel Mockup** : En haut de l'écran, une sphère ou une jauge circulaire qui se remplit/se colore à mesure que l'échange avance.
    *   *Début* : Bulle transparente/petite.
    *   *Milieu* : Bulle colorée, Plume dit "Je commence à bien visualiser la scène...".
    *   *Fin* : Bulle brillante/pleine, Plume suggère "Je crois que nous tenons un beau moment. Voulez-vous que je l'écrive ?".

### Phase 3 : La Cristallisation (Solidifier la Bulle)
Le moment où l'IA transforme le chat en récit.
*   **Concept UI** : "L'Écrin de Prévisualisation".
*   **Visuel Mockup** : Une transition douce. Le chat s'estompe pour laisser place à une **page de livre** (pas juste un champ texte).
    *   Le texte est mis en page.
    *   Le titre est déjà posé.
    *   C'est le moment "Wahoo".

### Phase 4 : L'Ancrage (Préserver la Bulle)
La validation finale avant le stockage.
*   **Concept UI** : "La Carte d'Identité du Souvenir".
*   **Visuel Mockup** : Un panneau latéral ou un modal élégant qui vient "étiqueter" la bulle.
    *   📍 **Où ?** (Lieu détecté).
    *   📅 **Quand ?** (Date détectée).
    *   👥 **Qui ?** (Personnages détectés).
    *   **Action** : Un bouton gratifiant "Graver dans mon Livre" (et non "Sauvegarder").

---

## 3. Guide Détaillé pour vos Mockups

Voici comment structurer vos écrans pour le mockup :

### Écran A : L'Accueil de l'Atelier (Mode "Invitation")
*   **Ambiance** : Calme, épurée.
*   **Éléments clés** :
    1.  **Zone Centrale** : Pas de chat visible tout de suite. Trois grandes cartes/bulles cliquables :
        *   [ 💡 Reprendre "La Ford Fiesta" ] (Issu du coffre)
        *   [ 📸 Partir d'une photo ]
        *   [ ✍️ Raconter un moment ]
    2.  **Le Coffre** : Intégré visuellement (ex: une pile de cartes sur le côté) pour montrer qu'il est plein de ressources.

### Écran B : La Conversation Active (Mode "Construction")
*   **Ambiance** : Focus.
*   **Éléments clés** :
    1.  **Header** : Titre provisoire du souvenir (ex: "En parlant de la Ford Fiesta...").
    2.  **Indicateur de progression** : Une barre ou un cercle "Densité du souvenir".
    3.  **Le Chat** : Les messages de Plume et de l'utilisateur.
    4.  **Bouton d'Action** : Il change d'état.
        *   *Au début* : "Continuer à raconter".
        *   *À la fin* : Devient brillant/doré "✨ Révéler le Récit".

### Écran C : La Révélation (Mode "Validation")
*   **Ambiance** : Gratifiante, "Premium".
*   **Disposition** : Split screen (Écran divisé) ou Modal large.
    *   **Gauche (Le Récit)** : Le texte finalisé, belle typographie, ressemblant à une page de livre.
    *   **Droite (Les Métadonnées)** :
        *   Champs : Titre, Date, Lieu, Personnes.
        *   État : Pré-remplis par l'IA, modifiables.
        *   **Boutons** :
            *   [ 💾 Mettre de côté (Brouillon) ] (Discret)
            *   [ 🖋️ Graver le Souvenir ] (Principal, mis en avant)

---

## 4. Comparatif Synthétique

| Critère | Workflow Actuel (Technique) | Workflow "Bulle" (Émotionnel) |
| :--- | :--- | :--- |
| **Déclencheur** | Utilisateur doit décider d'écrire. | Le système propose des inspirations. |
| **Progression** | Invisible. On ne sait pas quand arrêter. | Visuelle. On voit le souvenir se construire. |
| **Transformation** | Bouton "Synthèse" (froid). | Bouton "Révéler le Récit" (magique). |
| **Validation** | Inexistante ou confuse. | Étape clé de "l'Ancrage" (Date/Lieu/Gens). |
| **Finalité** | Stockage en base de données. | Gravure dans le Livre de Vie. |

Ce workflow place l'utilisateur dans la posture d'un **explorateur** qui capture des moments, plutôt que d'un opérateur qui saisit des données.
