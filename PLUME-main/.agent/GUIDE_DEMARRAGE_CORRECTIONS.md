# 🚀 GUIDE DE DÉMARRAGE RAPIDE - CORRECTIONS AUDIT

**Temps estimé**: 5-7 heures  
**Objectif**: Corriger les problèmes critiques avant la beta

---

## ✅ ÉTAPE 1: Configuration initiale (10 min)

### 1.1 Créer une branche Git
```bash
git checkout -b fix/critical-security-ux-issues
```

### 1.2 Créer le fichier .env.local
```bash
# Copier le template
cp .env.example .env.local
```

### 1.3 Remplir .env.local avec vos vraies clés
```bash
# Ouvrir avec votre éditeur
code .env.local

# Remplir avec:
VITE_SUPABASE_URL=https://tuezgyggesrebzfxeufr.supabase.co
VITE_SUPABASE_ANON_KEY=<votre_clé_supabase>
GEMINI_API_KEY=<votre_clé_gemini>
```

### 1.4 Vérifier que .env.local est dans .gitignore
```bash
cat .gitignore | grep .env.local
# Si rien n'apparaît, ajouter:
echo ".env.local" >> .gitignore
```

---

## 🔒 ÉTAPE 2: Sécuriser les clés API (30 min)

### 2.1 Modifier services/supabaseClient.ts

**AVANT** (❌ DANGEREUX):
```typescript
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**APRÈS** (✅ SÉCURISÉ):
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 2.2 Tester que tout fonctionne
```bash
npm run dev
```

Vérifier dans la console:
- ✅ Pas d'erreur "Missing Supabase environment variables"
- ✅ L'authentification fonctionne
- ✅ Les données se chargent

---

## 📝 ÉTAPE 3: Remplacer console.log par logger (1h)

### 3.1 Le logger est déjà créé ✅
Fichier: `utils/logger.ts`

### 3.2 Importer le logger dans vos fichiers

**Exemple dans App.tsx**:
```typescript
// En haut du fichier
import { logger } from './utils/logger';

// Remplacer tous les console.log
// AVANT:
console.log('User logged in', user);
console.error('Failed to save', error);

// APRÈS:
logger.info('User logged in', { userId: user.id });
logger.error('Failed to save chapter', error);
```

### 3.3 Fichiers prioritaires à modifier

1. **App.tsx** (15+ occurrences)
   ```bash
   # Rechercher tous les console
   grep -n "console\." App.tsx
   ```

2. **services/geminiService.ts**
   ```typescript
   import { logger } from '../utils/logger';
   
   // Ligne 107
   logger.warn('Failed to parse extracted data JSON', e);
   
   // Ligne 244
   logger.error('Gemini API Error', error);
   ```

3. **services/photoAnalysisService.ts**
   ```typescript
   import { logger } from '../utils/logger';
   
   // Remplacer tous les console.log/error
   logger.info('Uploading file', { fileName, size: file.size });
   logger.error('Upload Error', error);
   ```

### 3.4 Script de remplacement rapide (optionnel)

**VS Code Find & Replace**:
- Find: `console\.(log|error|warn|info)`
- Replace: `logger.$1`
- Fichiers: `*.ts, *.tsx`

⚠️ **ATTENTION**: Vérifier manuellement chaque remplacement !

---

## 🐛 ÉTAPE 4: Corriger les bugs UX (2-3h)

### 4.1 Bug: Bloc de saisie qui "rebalaye"

**Fichier**: `index.css` ou créer `components/ChatInput.css`

```css
/* Fixer la hauteur dès le départ */
.input-container {
    min-height: 120px;
    max-height: 300px;
    transition: none; /* Pas de transition au chargement */
}

.input-container.loaded {
    transition: height 0.2s ease-in-out;
}

.input-textarea {
    resize: vertical;
    min-height: 80px;
    max-height: 250px;
    overflow-y: auto;
    font-size: 16px; /* Évite le zoom sur iOS */
}
```

**Fichier**: `App.tsx`

```typescript
const [isInputLoaded, setIsInputLoaded] = useState(false);

useEffect(() => {
    const timer = setTimeout(() => setIsInputLoaded(true), 100);
    return () => clearTimeout(timer);
}, []);

// Dans le JSX
<div className={`input-container ${isInputLoaded ? 'loaded' : ''}`}>
    <textarea
        ref={inputRef}
        className="input-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
    />
</div>
```

### 4.2 Bug: Zone de texte invisible sur mobile

**Fichier**: `index.css`

```css
/* Mobile responsive */
@media (max-width: 768px) {
    .input-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        background: var(--bg-primary, white);
        padding: 1rem;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    }

    .chat-container {
        padding-bottom: 180px; /* Espace pour l'input */
    }
}

/* Gérer le clavier virtuel */
@supports (height: 100dvh) {
    .chat-container {
        height: 100dvh;
    }
}
```

**Fichier**: `App.tsx`

```typescript
useEffect(() => {
    // Gérer le resize du viewport (clavier mobile)
    const handleResize = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 4.3 Bug: Perte de texte lors de la synthèse

**Fichier**: `App.tsx` (fonction `handleSynthesis`)

```typescript
const handleSynthesis = async () => {
    if (isLoading || !session?.user) return;

    // 1. BACKUP
    const backupState = {
        messages: [...state.messages],
        draft: draftContent,
        timestamp: Date.now()
    };

    localStorage.setItem('plume_synthesis_backup', JSON.stringify(backupState));

    // 2. Confirmation
    const confirm = window.confirm(
        'La synthèse va compiler vos échanges. Continuer ?'
    );
    if (!confirm) {
        localStorage.removeItem('plume_synthesis_backup');
        return;
    }

    setIsLoading(true);

    try {
        // ... code de synthèse existant ...
        
        localStorage.removeItem('plume_synthesis_backup');
        showToast('Synthèse réussie !', 'success');

    } catch (error) {
        logger.error('Synthesis failed', error);
        
        // 3. RESTAURER
        setState(prev => ({ ...prev, messages: backupState.messages }));
        setDraftContent(backupState.draft);
        
        showToast('Erreur. Texte restauré automatiquement.', 'error');
    } finally {
        setIsLoading(false);
    }
};
```

---

## ⚡ ÉTAPE 5: Optimiser la performance (1-2h)

### 5.1 Optimiser l'auto-save

**Fichier**: `App.tsx`

```typescript
// Créer un hook de debounce
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

// Utiliser le debounce
const AUTOSAVE_DELAY = 5000; // 5s au lieu de 2s
const debouncedDraft = useDebounce(draftContent, AUTOSAVE_DELAY);

useEffect(() => {
    if (!session?.user || !debouncedDraft) return;

    const saveDraft = async () => {
        try {
            if (workspaceId) {
                await supabase
                    .from('chapters')
                    .update({ content: debouncedDraft, updated_at: new Date().toISOString() })
                    .eq('id', workspaceId);
            } else {
                const { data } = await supabase
                    .from('chapters')
                    .insert({ 
                        user_id: session.user.id, 
                        title: 'Brouillon Atelier', 
                        content: debouncedDraft, 
                        status: 'draft_workspace' 
                    })
                    .select()
                    .single();

                if (data) setWorkspaceId(data.id);
            }

            logger.info('Draft auto-saved');
        } catch (err) {
            logger.error('Auto-save failed', err);
        }
    };

    saveDraft();
}, [debouncedDraft, session, workspaceId]);
```

### 5.2 Ajouter validation taille fichiers

**Fichier**: `services/photoAnalysisService.ts`

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadPhotoToSupabase = async (file: File, userId: string) => {
    // Validation taille
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(
            `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB`
        );
    }

    // Validation type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Type non supporté: ${file.type}`);
    }

    // ... reste du code ...
};
```

---

## ✅ ÉTAPE 6: Tests et validation (30 min)

### 6.1 Tests locaux

```bash
# Démarrer le serveur de dev
npm run dev

# Ouvrir http://localhost:3000
```

**Checklist de tests**:
- [ ] L'app démarre sans erreur
- [ ] Connexion/Déconnexion fonctionne
- [ ] Envoyer un message fonctionne
- [ ] Synthèse fonctionne (et backup en cas d'erreur)
- [ ] Upload photo < 5MB fonctionne
- [ ] Upload photo > 5MB = erreur
- [ ] Auto-save fonctionne (attendre 5s)
- [ ] Pas de console.log dans la console navigateur
- [ ] Responsive mobile OK (F12 > Toggle device toolbar)

### 6.2 Build de production

```bash
# Tester le build
npm run build

# Vérifier qu'il n'y a pas d'erreurs
```

### 6.3 Vérifier les variables d'environnement

```bash
# Dans la console navigateur (en dev)
console.log(import.meta.env);

# Vérifier:
# - VITE_SUPABASE_URL est défini
# - VITE_SUPABASE_ANON_KEY est défini
# - GEMINI_API_KEY est défini (via process.env.API_KEY)
```

---

## 🚀 ÉTAPE 7: Déploiement (15 min)

### 7.1 Commit et push

```bash
git add .
git commit -m "fix: critical security and UX issues

- Secure API keys in .env
- Replace console.log with centralized logger
- Fix input area resize bug (desktop)
- Fix invisible textarea on mobile
- Add backup before synthesis
- Optimize auto-save (5s debounce)
- Add file size validation (5MB max)"

git push origin fix/critical-security-ux-issues
```

### 7.2 Configurer les variables d'environnement sur Vercel

1. Aller sur Vercel Dashboard
2. Sélectionner votre projet PLUME
3. Settings > Environment Variables
4. Ajouter:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`

### 7.3 Déployer

```bash
# Merge dans main
git checkout main
git merge fix/critical-security-ux-issues
git push origin main

# Vercel déploiera automatiquement
```

---

## 📋 CHECKLIST FINALE

### Sécurité
- [ ] ✅ Clés API dans .env.local (pas hardcodées)
- [ ] ✅ .env.local dans .gitignore
- [ ] ✅ Logger centralisé créé
- [ ] ✅ Tous les console.log remplacés

### UX
- [ ] ✅ Bloc saisie stable (pas de rebalayage)
- [ ] ✅ Zone texte visible sur mobile
- [ ] ✅ Backup avant synthèse

### Performance
- [ ] ✅ Auto-save optimisé (5s)
- [ ] ✅ Validation taille fichiers

### Déploiement
- [ ] ✅ Build réussit
- [ ] ✅ Variables d'env configurées sur Vercel
- [ ] ✅ Tests manuels en production

---

## 🎉 FÉLICITATIONS !

Vous avez corrigé tous les problèmes critiques ! 🚀

**Prochaines étapes** (optionnel, après la beta):
1. Implémenter le cache Gemini (économie de coûts)
2. Ajouter pagination des messages
3. Configurer Sentry pour le monitoring
4. Optimiser les images (compression)

---

## 🆘 EN CAS DE PROBLÈME

### L'app ne démarre pas
```bash
# Vérifier les variables d'env
cat .env.local

# Vérifier les dépendances
npm install

# Nettoyer le cache
rm -rf node_modules dist
npm install
npm run dev
```

### Erreur "Missing Supabase environment variables"
```bash
# Vérifier que .env.local existe
ls -la | grep .env.local

# Vérifier le contenu
cat .env.local

# Redémarrer le serveur
npm run dev
```

### Les console.log apparaissent toujours
```bash
# Vérifier que le logger est importé
grep "import.*logger" App.tsx

# Vérifier que vous avez bien remplacé console par logger
grep "console\." App.tsx
```

---

**Bon courage ! 💪**
