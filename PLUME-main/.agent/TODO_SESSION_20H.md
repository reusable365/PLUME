# 🚀 OBJECTIF 20H - Checklist de Validation

Cette liste est extraite de l'Audit SaaS. Cochez les cases au fur et à mesure de votre progression aujourd'hui.

## 🔴 PRIORITÉ 1 : CRITIQUE (Doit être fait)

- [ ] **Migration SQL**
  - [ ] Ouvrir Supabase SQL Editor
  - [ ] Copier/Coller le contenu de `supabase_migration_life_universe.sql`
  - [ ] Exécuter ("Run")
  - [ ] Vérifier que les tables `places`, `relationships`, `timeline_events` existent

- [ ] **Sécurité API**
  - [ ] Créer un fichier `.env.local` à la racine (ne pas le commit !)
  - [ ] Ajouter : `API_KEY=votre_clé_gemini_commençant_par_AIza`
  - [ ] Ajouter : `SUPABASE_URL=...`
  - [ ] Ajouter : `SUPABASE_ANON_KEY=...`
  - [ ] Redémarrer le serveur (`npm run dev`) pour prendre en compte

- [ ] **Nettoyage Codebase**
  - [ ] Supprimer `components/SocialGraph.tsx`
  - [ ] Supprimer `components/SpaceTimeView.tsx`
  - [ ] Supprimer `components/TimelineView.tsx`
  - [ ] Vérifier qu'il n'y a plus d'imports cassés dans `App.tsx` (déjà fait normalement)

## ⚠️ PRIORITÉ 2 : CONFORT & PERF (Si temps disponible)

- [ ] **Optimisation**
  - [ ] Dans `App.tsx`, utiliser `React.lazy` pour `LifeUniverse` :
    ```tsx
    const LifeUniverse = React.lazy(() => import('./components/LifeUniverse'));
    // ...
    <Suspense fallback={<div>Chargement...</div>}>
      {currentView === 'universe' && <LifeUniverse ... />}
    </Suspense>
    ```

- [ ] **Test Univers de Vie**
  - [ ] Aller dans l'onglet "Univers de Vie"
  - [ ] Cliquer sur "Actualiser"
  - [ ] Vérifier que les lieux/relations s'affichent bien

## 🧪 PRIORITÉ 3 : TESTS (Bonus)

- [ ] **Vérification Manuelle**
  - [ ] Créer un nouveau souvenir
  - [ ] Vérifier qu'il apparaît dans le Dashboard
  - [ ] Vérifier qu'il est pris en compte dans l'Univers de Vie

---
*Généré par Antigravity - À relancer à 20H pour mise à jour du score.*
