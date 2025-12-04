# 🚀 PLAN DE CORRECTION URGENT - PLUME BETA

**Objectif**: Corriger les problèmes critiques identifiés dans l'audit avant le lancement beta  
**Durée estimée**: 8-10 heures  
**Priorité**: 🔥 CRITIQUE

---

## 🎯 PHASE 1: SÉCURITÉ (2-3h) - BLOQUANT

### ✅ Tâche 1.1: Sécuriser les clés API Supabase
**Fichier**: `services/supabaseClient.ts`

**Problème actuel**:
```typescript
// ❌ CLÉ EXPOSÉE EN DUR
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Actions**:
1. Créer `.env.local` avec les vraies clés
2. Supprimer la clé hardcodée
3. Ajouter validation

**Code à modifier**:
```typescript
// services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Fichier `.env.local` à créer**:
```bash
VITE_SUPABASE_URL=https://tuezgyggesrebzfxeufr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GEMINI_API_KEY=votre_clé_gemini
```

**Fichier `.env.example` à mettre à jour**:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Monitoring
VITE_SENTRY_DSN=your_sentry_dsn_here
```

---

### ✅ Tâche 1.2: Créer un logger centralisé
**Nouveau fichier**: `utils/logger.ts`

```typescript
/**
 * Centralized logging utility
 * - Development: logs to console
 * - Production: sends to monitoring service (Sentry, etc.)
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    data?: any;
    timestamp: string;
    userId?: string;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;
    private userId: string | null = null;

    setUserId(userId: string | null) {
        this.userId = userId;
    }

    private createLogEntry(level: LogLevel, message: string, data?: any): LogEntry {
        return {
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
            userId: this.userId || undefined
        };
    }

    private sendToMonitoring(entry: LogEntry) {
        // TODO: Intégrer Sentry ou autre service de monitoring
        // if (window.Sentry) {
        //     window.Sentry.captureMessage(entry.message, {
        //         level: entry.level,
        //         extra: entry.data
        //     });
        // }
    }

    log(message: string, data?: any) {
        const entry = this.createLogEntry('log', message, data);
        if (this.isDevelopment) {
            console.log(`[LOG] ${message}`, data || '');
        }
    }

    info(message: string, data?: any) {
        const entry = this.createLogEntry('info', message, data);
        if (this.isDevelopment) {
            console.info(`[INFO] ${message}`, data || '');
        }
    }

    warn(message: string, data?: any) {
        const entry = this.createLogEntry('warn', message, data);
        if (this.isDevelopment) {
            console.warn(`[WARN] ${message}`, data || '');
        } else {
            this.sendToMonitoring(entry);
        }
    }

    error(message: string, error?: any) {
        const entry = this.createLogEntry('error', message, error);
        if (this.isDevelopment) {
            console.error(`[ERROR] ${message}`, error || '');
        } else {
            this.sendToMonitoring(entry);
        }
    }

    debug(message: string, data?: any) {
        if (this.isDevelopment) {
            console.debug(`[DEBUG] ${message}`, data || '');
        }
    }
}

export const logger = new Logger();
```

**Exemple d'utilisation**:
```typescript
// Avant
console.log('User logged in', user);
console.error('Failed to save', error);

// Après
import { logger } from './utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Failed to save chapter', error);
```

---

### ✅ Tâche 1.3: Remplacer tous les console.log
**Script de remplacement automatique** (à exécuter manuellement):

```bash
# Rechercher tous les console.log
grep -r "console.log" --include="*.ts" --include="*.tsx" .

# Remplacer par logger.log (faire manuellement pour vérifier)
# Utiliser VS Code Find & Replace avec regex:
# Find: console\.(log|error|warn|info)
# Replace: logger.$1
```

**Fichiers prioritaires à modifier**:
1. `App.tsx`
2. `services/geminiService.ts`
3. `services/photoAnalysisService.ts`
4. `services/lifeUniverseService.ts`
5. `services/dashboardAIService.ts`

---

## 🐛 PHASE 2: BUGS UX CRITIQUES (3-4h) - BLOQUANT

### ✅ Tâche 2.1: Corriger le "rebalayage" du bloc de saisie
**Fichier**: `App.tsx` + CSS

**Problème**: Le bloc de saisie change de taille après quelques secondes

**Solution CSS**:
```css
/* Dans index.css ou App.css */
.input-container {
    /* Fixer la hauteur minimale dès le départ */
    min-height: 120px;
    max-height: 300px;
    
    /* Désactiver les transitions au chargement */
    transition: none;
}

/* Activer les transitions après le premier rendu */
.input-container.loaded {
    transition: height 0.2s ease-in-out;
}

/* Assurer que le textarea ne cause pas de resize */
.input-textarea {
    resize: vertical;
    min-height: 80px;
    max-height: 250px;
    overflow-y: auto;
}
```

**Solution React**:
```typescript
// Dans App.tsx
const [isInputLoaded, setIsInputLoaded] = useState(false);

useEffect(() => {
    // Marquer comme chargé après le premier rendu
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
        placeholder="Partagez un souvenir..."
    />
</div>
```

---

### ✅ Tâche 2.2: Fixer la zone de texte invisible sur mobile
**Fichier**: CSS global

**Problème**: Le bloc de saisie n'est pas visible sur smartphone

**Solution**:
```css
/* Mobile-first responsive design */
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
        border-top: 1px solid var(--border-color, #e5e7eb);
    }

    .input-textarea {
        width: 100%;
        font-size: 16px; /* Évite le zoom automatique sur iOS */
        -webkit-appearance: none;
    }

    /* Ajuster le padding du contenu pour éviter que le clavier ne cache l'input */
    .chat-container {
        padding-bottom: 180px; /* Hauteur de l'input + marge */
    }
}

/* Gérer le clavier virtuel sur mobile */
@supports (height: 100dvh) {
    .chat-container {
        height: 100dvh; /* Dynamic viewport height */
    }
}
```

**JavaScript pour gérer le clavier mobile**:
```typescript
// Dans App.tsx
useEffect(() => {
    // Gérer le resize du viewport quand le clavier apparaît
    const handleResize = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
}, []);
```

```css
/* Utiliser la variable CSS custom */
.chat-container {
    height: calc(var(--vh, 1vh) * 100);
}
```

---

### ✅ Tâche 2.3: Prévenir la perte de texte lors de la synthèse
**Fichier**: `App.tsx`

**Problème**: L'utilisateur peut perdre son texte pendant la synthèse

**Solution**:
```typescript
const handleSynthesis = async () => {
    if (isLoading || !session?.user) return;

    // 1. BACKUP AVANT SYNTHÈSE
    const backupState = {
        messages: [...state.messages],
        draft: draftContent,
        timestamp: Date.now()
    };

    // Sauvegarder dans localStorage en cas de crash
    try {
        localStorage.setItem('plume_synthesis_backup', JSON.stringify(backupState));
    } catch (e) {
        logger.warn('Failed to create synthesis backup', e);
    }

    // 2. Afficher un message de confirmation
    const confirmSynthesis = window.confirm(
        'La synthèse va compiler vos échanges récents. Voulez-vous continuer ?'
    );

    if (!confirmSynthesis) {
        localStorage.removeItem('plume_synthesis_backup');
        return;
    }

    setIsLoading(true);

    try {
        // ... code de synthèse existant ...

        // 3. Succès - supprimer le backup
        localStorage.removeItem('plume_synthesis_backup');
        showToast('Synthèse réussie !', 'success');

    } catch (error) {
        logger.error('Synthesis failed', error);

        // 4. RESTAURER EN CAS D'ERREUR
        setState(prev => ({ ...prev, messages: backupState.messages }));
        setDraftContent(backupState.draft);

        showToast(
            'Erreur de synthèse. Votre texte a été restauré automatiquement.',
            'error'
        );
    } finally {
        setIsLoading(false);
    }
};

// Restaurer au chargement si un backup existe
useEffect(() => {
    const backup = localStorage.getItem('plume_synthesis_backup');
    if (backup) {
        try {
            const { messages, draft, timestamp } = JSON.parse(backup);

            // Vérifier que le backup n'est pas trop vieux (< 1h)
            if (Date.now() - timestamp < 3600000) {
                const restore = window.confirm(
                    'Un brouillon de synthèse a été trouvé. Voulez-vous le restaurer ?'
                );

                if (restore) {
                    setState(prev => ({ ...prev, messages }));
                    setDraftContent(draft);
                    showToast('Brouillon restauré', 'success');
                }
            }

            localStorage.removeItem('plume_synthesis_backup');
        } catch (e) {
            logger.error('Failed to restore synthesis backup', e);
        }
    }
}, []);
```

---

## ⚡ PHASE 3: PERFORMANCE (2-3h) - IMPORTANT

### ✅ Tâche 3.1: Optimiser l'auto-save
**Fichier**: `App.tsx`

**Problème**: Auto-save toutes les 2 secondes = trop fréquent

**Solution**:
```typescript
import { useCallback, useEffect, useRef } from 'react';

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

// Dans App.tsx
const AUTOSAVE_DELAY = 5000; // 5 secondes au lieu de 2

// Utiliser le debounce
const debouncedDraft = useDebounce(draftContent, AUTOSAVE_DELAY);

useEffect(() => {
    if (!session?.user || !debouncedDraft) return;

    const saveDraft = async () => {
        try {
            if (workspaceId) {
                await supabase
                    .from('chapters')
                    .update({ 
                        content: debouncedDraft, 
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', workspaceId);
            } else {
                const { data, error } = await supabase
                    .from('chapters')
                    .insert({ 
                        user_id: session.user.id, 
                        title: 'Brouillon Atelier', 
                        content: debouncedDraft, 
                        status: 'draft_workspace' 
                    })
                    .select()
                    .single();

                if (data && !error) setWorkspaceId(data.id);
            }

            logger.info('Draft auto-saved');
        } catch (err) {
            logger.error('Auto-save failed', err);
        }
    };

    saveDraft();
}, [debouncedDraft, session, workspaceId]);
```

---

### ✅ Tâche 3.2: Ajouter pagination des messages
**Fichier**: `App.tsx`

**Problème**: Charge TOUS les messages en une fois

**Solution**:
```typescript
const MESSAGES_PER_PAGE = 50;

const loadUserData = async (authUser: any) => {
    if (!authUser) return;
    setIsLoading(true);

    try {
        // ... code profil existant ...

        // PAGINATION DES MESSAGES
        const { data: msgs, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(MESSAGES_PER_PAGE);

        if (msgError) throw msgError;

        // Inverser pour avoir l'ordre chronologique
        const loadedMessages = msgs ? msgs.reverse().map(/* ... */) : [];

        // ... reste du code ...

    } catch (err) {
        logger.error('Critical error loading user data', err);
        showToast('Erreur de chargement des données', 'error');
    } finally {
        setIsLoading(false);
    }
};

// Fonction pour charger plus de messages (infinite scroll)
const loadMoreMessages = async () => {
    if (!session?.user || isLoading) return;

    const oldestMessage = state.messages[0];
    if (!oldestMessage) return;

    setIsLoading(true);

    try {
        const { data: olderMsgs } = await supabase
            .from('messages')
            .select('*')
            .lt('created_at', new Date(oldestMessage.timestamp).toISOString())
            .order('created_at', { ascending: false })
            .limit(MESSAGES_PER_PAGE);

        if (olderMsgs && olderMsgs.length > 0) {
            const mappedMessages = olderMsgs.reverse().map(/* ... */);
            setState(prev => ({
                ...prev,
                messages: [...mappedMessages, ...prev.messages]
            }));
        }
    } catch (error) {
        logger.error('Failed to load more messages', error);
    } finally {
        setIsLoading(false);
    }
};
```

---

### ✅ Tâche 3.3: Ajouter validation taille fichiers
**Fichier**: `services/photoAnalysisService.ts`

**Problème**: Pas de limite de taille pour les uploads

**Solution**:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export const uploadPhotoToSupabase = async (
    file: File,
    userId: string,
    isProfilePhoto: boolean = false
): Promise<string> => {
    // VALIDATION 1: Taille
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(
            `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
            `Maximum autorisé: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        );
    }

    // VALIDATION 2: Type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(
            `Type de fichier non supporté: ${file.type}. ` +
            `Types autorisés: ${ALLOWED_TYPES.join(', ')}`
        );
    }

    // VALIDATION 3: Nom de fichier
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    try {
        const fileName = `${userId}/${Date.now()}_${sanitizedFileName}`;

        logger.info('Uploading file', { fileName, size: file.size });

        const { data, error } = await supabase.storage
            .from('photos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            logger.error('Supabase Storage Upload Error', error);
            throw new Error(`Erreur d'upload: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName);

        logger.info('File uploaded successfully', { publicUrl });

        return publicUrl;

    } catch (error) {
        logger.error('Upload Error', error);
        throw error;
    }
};
```

---

## 📋 CHECKLIST DE VALIDATION

### Avant de commencer
- [ ] Créer une branche Git: `git checkout -b fix/critical-issues`
- [ ] Backup de la base de données Supabase
- [ ] Tester en local avant de déployer

### Phase 1: Sécurité
- [ ] `.env.local` créé avec toutes les clés
- [ ] `.env.example` mis à jour
- [ ] Clés hardcodées supprimées de `supabaseClient.ts`
- [ ] Logger centralisé créé dans `utils/logger.ts`
- [ ] Tous les `console.log` remplacés par `logger.*`
- [ ] Test: L'app démarre sans erreur
- [ ] Test: Les appels API fonctionnent

### Phase 2: Bugs UX
- [ ] CSS du bloc de saisie corrigé
- [ ] Test desktop: Pas de "rebalayage"
- [ ] Test mobile: Zone de texte visible
- [ ] Test mobile: Clavier ne cache pas l'input
- [ ] Backup avant synthèse implémenté
- [ ] Test: Synthèse + erreur = texte restauré

### Phase 3: Performance
- [ ] Auto-save débounce à 5s
- [ ] Pagination des messages implémentée
- [ ] Validation taille fichiers ajoutée
- [ ] Test: Upload fichier > 5MB = erreur
- [ ] Test: Chargement initial < 3s

### Déploiement
- [ ] Tests E2E passent
- [ ] Build production réussit: `npm run build`
- [ ] Variables d'environnement configurées sur Vercel/hosting
- [ ] Déploiement en staging
- [ ] Tests manuels en staging
- [ ] Déploiement en production
- [ ] Monitoring actif (Sentry, etc.)

---

## 🚨 POINTS D'ATTENTION

### Sécurité
⚠️ **NE JAMAIS** commiter le fichier `.env.local`  
⚠️ **TOUJOURS** vérifier que `.env.local` est dans `.gitignore`  
⚠️ **ROTATION** des clés API si elles ont été exposées

### Performance
⚠️ Tester avec un compte ayant **beaucoup de données** (100+ messages)  
⚠️ Vérifier la consommation mémoire sur mobile  
⚠️ Monitorer les coûts Gemini après déploiement

### UX
⚠️ Tester sur **plusieurs navigateurs** (Chrome, Safari, Firefox)  
⚠️ Tester sur **plusieurs tailles d'écran** (iPhone SE, iPad, Desktop)  
⚠️ Tester avec **connexion lente** (throttling 3G)

---

## 📞 SUPPORT

Si vous rencontrez des problèmes pendant l'implémentation:

1. **Vérifier les logs**: Ouvrir la console navigateur
2. **Vérifier Supabase**: Dashboard > Logs
3. **Vérifier les variables d'env**: `console.log(import.meta.env)`
4. **Rollback si nécessaire**: `git reset --hard HEAD~1`

---

**Bon courage ! 🚀**
