# Stratégie de Croissance : Le Souvenir Collaboratif & Viralité

Ce document détaille la conception fonctionnelle et stratégique du module "Souvenir Collaboratif", conçu comme un levier de croissance virale et une fonctionnalité Premium majeure pour PLUME.

## 1. La Vision : De l'Écriture Solitaire à l'Expérience Partagée

L'objectif est de transformer l'acte d'écrire ses mémoires (souvent solitaire) en une expérience sociale riche, sans perdre l'intimité du projet.

**Le Concept Clé :** "La Bulle de Souvenir Partagée"
L'utilisateur n'envoie pas juste un texte, il ouvre une "bulle" temporelle et invite des proches à y entrer pour déposer leur propre vision.

---

## 2. Le Parcours "Invité" (Le Témoin) : L'Opération Séduction

C'est ici que se joue l'acquisition de nouveaux utilisateurs. L'expérience doit être fluide, magique et incitative.

### A. L'Invitation (Le Hook)
Le message doit être personnel mais structuré par PLUME pour maximiser le taux de clic.

*   **Canaux** : WhatsApp, SMS, Email, Lien direct.
*   **Message type (personnalisable)** :
    > "Coucou [Prénom], j'écris le livre de ma vie avec PLUME. Je suis en train de raconter [Nom du Souvenir : ex: Nos vacances en Bretagne 98]. J'ai ma version, mais elle ne serait pas complète sans la tienne. Peux-tu me raconter ce dont tu te souviens ? Ça prend 2 minutes (tu peux même le faire en audio !). Bises, [Nom Auteur]"
*   **L'Aperçu (Open Graph)** : Une belle image générée avec le titre du souvenir et une photo floutée (teasing).

### B. La Landing Page "Guest" (L'Atelier Invité)
L'invité arrive sur une page web dédiée (pas besoin de compte immédiat).

1.  **L'Accueil Chaleureux** :
    *   Photo de l'auteur.
    *   Contexte : "Aidez [Nom] à enrichir son patrimoine familial."
    *   **Le Teasing** : Un court extrait du souvenir de l'auteur (flouté après 3 lignes) ou une "Ambiance" (mots clés, lieu, date).
    *   *Psychologie* : On joue sur la curiosité et l'ego ("Mon avis compte").

2.  **La Contribution Simplifiée (La "Magie" avant l'inscription)** :
    *   **Mode Audio (Dictaphone)** : "Racontez simplement, PLUME s'occupe d'écrire." (Démonstration de force de la technologie).
    *   **Mode Texte** : Interface épurée.
    *   **Upload Photo** : "Avez-vous une photo de ce moment ?"

3.  **La Révélation (Le "Waooooo" Effect)** :
    *   Une fois la contribution envoyée, l'IA de PLUME génère *instantanément* un petit résumé ou une reformulation élégante de son témoignage : *"Voici comment votre souvenir sera intégré..."*
    *   **Le Call-to-Action (CTA)** :
        > "Vous avez une belle plume ! Vous aussi, vous avez sûrement des histoires incroyables à raconter. [Nom Auteur] utilise PLUME pour écrire sa vie. **Commencez votre premier souvenir gratuitement.**"

---

## 3. La Stratégie Premium (Monétisation)

Ces fonctionnalités sont des leviers puissants pour l'abonnement "Héritage" ou "Premium".

### Ce qui est GRATUIT (Freemium)
*   Recevoir une invitation et contribuer (pour que la viralité ne soit jamais bloquée).
*   L'auteur peut intégrer manuellement le texte reçu.

### Ce qui est PREMIUM (L'Auteur paye pour le confort et la magie)
1.  **L'Invitation "Riche"** : Envoyer des invitations avec une mise en page premium, incluant des photos et une ambiance sonore.
2.  **La Fusion IA (Le "Mixeur de Mémoires")** :
    *   *Fonction* : L'IA prend le souvenir de l'auteur + le témoignage de l'invité et réécrit une version "Master" qui tisse les deux points de vue.
    *   *Indicateur* : "Souvenir enrichi par [Nom Invité] - *Certifié Collaboratif*".
3.  **La Traduction Instantanée (International)** :
    *   L'invité écrit en Portugais (Brésil), l'auteur reçoit le texte traduit en Français, avec une note sur la langue d'origine.
4.  **Gestion des Contributeurs** :
    *   Tableau de bord : "Qui a répondu ?", "Relancer les témoins".
    *   Arbre des contributeurs (visualisation sociale).

---

## 4. Scénarios d'Usage (Use Cases)

### Scénario 1 : Le Mariage (Multi-points de vue)
*   **Auteur** : Raconte son mariage.
*   **Action** : Envoie un lien à 5 personnes clés (Témoin, Mère, Père, Meilleur ami).
*   **Résultat** : PLUME compile "Le Mariage : L'Édition 360°". Chaque paragraphe peut révéler "Le point de vue de Maman" au survol.

### Scénario 2 : L'Enquête Généalogique
*   **Auteur** : "Je ne me souviens plus du nom du chien de Grand-père."
*   **Action** : Envoie une "Question Flash" à la famille via WhatsApp.
*   **Résultat** : Les réponses alimentent directement la base de données de l'histoire.

### Scénario 3 : Le Lien Intergénérationnel
*   **Auteur (Grand-mère)** : Envoie un souvenir à son petit-fils.
*   **Message** : "C'était l'époque où ton père avait ton âge..."
*   **Guest (Petit-fils)** : Réagit, pose une question, ou valide "Je me souviens que Papa m'en a parlé !".
*   **Conversion** : Le petit-fils découvre l'outil moderne et cool de sa grand-mère -> Il offre un abonnement ou s'inscrit.

---

## 5. Prochaines Étapes Techniques (Roadmap)

1.  **Base de données** :
    *   Créer une table `collaborations` (token unique, status, guest_info).
    *   Créer une table `contributions` (texte, audio, media, langue).
2.  **Interface "Guest"** :
    *   Développer une route publique `/guest/[token]`.
    *   Design mobile-first absolu (pour WhatsApp).
3.  **Service IA** :
    *   Prompt "Fusion" : "Intègre ce témoignage au récit principal sans le dénaturer, en ajoutant des nuances..."
