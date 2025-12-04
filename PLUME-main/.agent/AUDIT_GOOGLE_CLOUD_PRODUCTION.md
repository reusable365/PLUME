# 🔍 AUDIT GOOGLE CLOUD - PLUME PRODUCTION READINESS

**Date**: 2025-12-01  
**Objectif**: Identifier les problèmes critiques avant le lancement de la beta  
**Scope**: Infrastructure Google Cloud, Performance, Sécurité, Stockage

---

## 📊 RÉSUMÉ EXÉCUTIF

### ✅ Points Forts
- ✅ Migration Google Cloud (Gemini AI) complétée
- ✅ Supabase configuré avec RLS (Row Level Security)
- ✅ Architecture modulaire bien structurée
- ✅ Authentification OAuth Google fonctionnelle

### 🚨 PROBLÈMES CRITIQUES (À CORRIGER IMMÉDIATEMENT)

#### 🔴 **CRITIQUE 1: Clés API exposées dans le code**
**Fichier**: `services/supabaseClient.ts` (ligne 6)
```typescript
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```
**Impact**: 🔥 **SÉCURITÉ MAXIMALE**
- Clé Supabase ANON exposée en dur dans le code source
- Risque de vol de données si le repo est public
- Violation des bonnes pratiques de sécurité

**Solution**:
```typescript
// ❌ MAUVAIS
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// ✅ BON
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is required');
}
```

#### 🔴 **CRITIQUE 2: Gestion des clés API Gemini**
**Fichier**: `vite.config.ts` (lignes 14-15)
```typescript
'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
```
**Impact**: 🔥 **SÉCURITÉ + PERFORMANCE**
- Duplication de la clé API
- Pas de validation de présence de la clé
- Risque d'exposition côté client

**Solution**:
- Utiliser un backend proxy pour les appels Gemini
- Ne jamais exposer les clés API côté client en production

#### 🔴 **CRITIQUE 3: Console.log en production**
**Impact**: 🔥 **PERFORMANCE + SÉCURITÉ**
- **102+ console.log/error/warn** détectés dans le code
- Ralentit l'application en production
- Peut exposer des données sensibles dans les logs navigateur

**Fichiers concernés**:
- `App.tsx`: 15+ console.error/warn
- `services/photoAnalysisService.ts`: 12+ console.log
- `services/lifeUniverseService.ts`: 8+ console.log/error
- Tous les services ont des console.error

**Solution**:
```typescript
// Créer un logger centralisé
const logger = {
    log: (...args: any[]) => {
        if (import.meta.env.DEV) console.log(...args);
    },
    error: (...args: any[]) => {
        if (import.meta.env.DEV) console.error(...args);
        // En production: envoyer à un service de monitoring (Sentry, etc.)
    },
    warn: (...args: any[]) => {
        if (import.meta.env.DEV) console.warn(...args);
    }
};
```

---

## ⚡ PROBLÈMES DE PERFORMANCE

### 🟡 **PERF 1: Pas de mise en cache des appels Gemini**
**Impact**: 💰 **COÛTS + VITESSE**
- Chaque appel Gemini coûte de l'argent
- Pas de cache pour les analyses répétitives
- Temps de réponse lent pour l'utilisateur

**Fichiers concernés**:
- `services/dashboardAIService.ts`: Cache localStorage présent mais limité
- `services/lifeUniverseService.ts`: Cache localStorage présent
- `services/geminiService.ts`: **AUCUN CACHE** ❌

**Solution**:
```typescript
// Ajouter un cache Redis ou Supabase pour les réponses IA
const CACHE_TTL = 3600; // 1 heure

async function cachedGeminiCall(cacheKey: string, prompt: string) {
    // 1. Vérifier cache Supabase
    const { data } = await supabase
        .from('ai_cache')
        .select('response')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();
    
    if (data) return data.response;
    
    // 2. Appel Gemini si pas en cache
    const response = await ai.generateContent(prompt);
    
    // 3. Sauvegarder en cache
    await supabase.from('ai_cache').insert({
        cache_key: cacheKey,
        response: response.text,
        expires_at: new Date(Date.now() + CACHE_TTL * 1000)
    });
    
    return response.text;
}
```

### 🟡 **PERF 2: Chargement initial lourd**
**Fichier**: `App.tsx` (fonction `loadUserData`, ligne 191)
**Impact**: ⏱️ **UX - Temps de chargement**
- Charge TOUS les messages en une fois
- Pas de pagination
- Peut bloquer l'UI avec beaucoup de données

**Solution**:
```typescript
// Pagination des messages
const MESSAGES_PER_PAGE = 50;

const { data: msgs } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(MESSAGES_PER_PAGE);
```

### 🟡 **PERF 3: Auto-save toutes les 2 secondes**
**Fichier**: `App.tsx` (ligne 312-325)
```typescript
const timer = setTimeout(async () => {
    // Auto-save draft
}, 2000); // ⚠️ Trop fréquent
```
**Impact**: 🔋 **BATTERIE + RÉSEAU**
- Trop d'appels réseau
- Consomme de la batterie sur mobile
- Peut causer des conflits de sauvegarde

**Solution**:
```typescript
// Debounce à 5-10 secondes
const AUTOSAVE_DELAY = 5000;

// Ou utiliser un debounce intelligent
import { debounce } from 'lodash';
const debouncedSave = debounce(saveDraft, 5000);
```

---

## 💾 PROBLÈMES DE STOCKAGE

### 🟡 **STORAGE 1: Pas de limite de taille pour les uploads**
**Fichier**: `services/photoAnalysisService.ts` (ligne 202)
**Impact**: 💰 **COÛTS STOCKAGE**
- Pas de validation de taille de fichier
- Risque d'upload de fichiers énormes
- Coûts Supabase Storage non contrôlés

**Solution**:
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const uploadPhotoToSupabase = async (file: File, userId: string) => {
    // Validation
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`Fichier trop volumineux. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    
    // Compression avant upload
    const compressedFile = await compressImage(file);
    
    // Upload
    const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, compressedFile);
};
```

### 🟡 **STORAGE 2: Pas de nettoyage des fichiers orphelins**
**Impact**: 💰 **COÛTS**
- Photos supprimées de la DB mais pas du Storage
- Accumulation de fichiers inutiles
- Coûts croissants

**Solution**:
```typescript
// Créer une fonction de nettoyage périodique
async function cleanOrphanedFiles() {
    // 1. Lister tous les fichiers dans Storage
    const { data: files } = await supabase.storage
        .from('photos')
        .list();
    
    // 2. Vérifier quels fichiers sont référencés dans la DB
    const { data: profiles } = await supabase
        .from('profiles')
        .select('photos');
    
    // 3. Supprimer les fichiers non référencés
    const referencedUrls = profiles.flatMap(p => p.photos.map(ph => ph.url));
    const orphanedFiles = files.filter(f => !referencedUrls.includes(f.name));
    
    for (const file of orphanedFiles) {
        await supabase.storage.from('photos').remove([file.name]);
    }
}
```

---

## 🔒 PROBLÈMES DE SÉCURITÉ

### 🟡 **SEC 1: Validation des entrées utilisateur insuffisante**
**Fichier**: `App.tsx` (ligne 336)
```typescript
const triggerSend = useCallback(async (text: string, imageUrl?: string) => {
    if (!text.trim() || isLoading || !session?.user) return;
    // ⚠️ Pas de sanitization du texte
    await supabase.from('messages').insert({ 
        user_id: session.user.id, 
        role: 'user', 
        content: { text: text, isSynthesized: false } 
    });
});
```
**Impact**: 🔒 **INJECTION XSS**
- Risque d'injection de code malveillant
- Pas de validation de longueur maximale

**Solution**:
```typescript
import DOMPurify from 'dompurify';

const MAX_MESSAGE_LENGTH = 5000;

const triggerSend = useCallback(async (text: string, imageUrl?: string) => {
    // Validation
    if (!text.trim() || text.length > MAX_MESSAGE_LENGTH) {
        showToast('Message trop long ou vide', 'error');
        return;
    }
    
    // Sanitization
    const sanitizedText = DOMPurify.sanitize(text);
    
    // Insert
    await supabase.from('messages').insert({ 
        user_id: session.user.id, 
        role: 'user', 
        content: { text: sanitizedText, isSynthesized: false } 
    });
});
```

### 🟡 **SEC 2: Pas de rate limiting**
**Impact**: 💰 **ABUS + COÛTS**
- Un utilisateur peut spammer l'API Gemini
- Risque de dépassement de quota
- Coûts incontrôlés

**Solution**:
```typescript
// Implémenter un rate limiter côté Supabase
CREATE TABLE rate_limits (
    user_id UUID PRIMARY KEY,
    requests_count INT DEFAULT 0,
    window_start TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction pour vérifier le rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID, p_max_requests INT, p_window_minutes INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_count INT;
    v_window_start TIMESTAMPTZ;
BEGIN
    SELECT requests_count, window_start INTO v_count, v_window_start
    FROM rate_limits WHERE user_id = p_user_id;
    
    -- Reset si fenêtre expirée
    IF v_window_start + (p_window_minutes || ' minutes')::INTERVAL < NOW() THEN
        UPDATE rate_limits SET requests_count = 1, window_start = NOW()
        WHERE user_id = p_user_id;
        RETURN TRUE;
    END IF;
    
    -- Vérifier limite
    IF v_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Incrémenter
    UPDATE rate_limits SET requests_count = requests_count + 1
    WHERE user_id = p_user_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## 🐛 BUGS IDENTIFIÉS

### 🟡 **BUG 1: Effet de "rebalayage" du bloc de saisie**
**Description**: Le bloc de saisie change de taille après quelques secondes
**Cause probable**: 
- CSS qui se charge de manière asynchrone
- Calculs de hauteur dynamiques qui se réexécutent
- Conflits entre styles initiaux et styles finaux

**Fichiers à vérifier**:
- `App.tsx`: Zone de saisie de texte
- CSS global: Vérifier les transitions et animations

**Solution**:
```css
/* Fixer la hauteur minimale dès le départ */
.input-zone {
    min-height: 120px;
    transition: none; /* Désactiver les transitions au chargement */
}

/* Activer les transitions après le premier rendu */
.input-zone.loaded {
    transition: height 0.2s ease;
}
```

### 🟡 **BUG 2: Zone de texte invisible sur mobile**
**Description**: Le bloc de saisie n'est pas visible sur smartphone
**Cause probable**: 
- Problème de responsive CSS
- z-index incorrect
- Viewport non configuré

**Solution**:
```css
/* Mobile-first approach */
@media (max-width: 768px) {
    .input-zone {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        background: white;
        padding: 1rem;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    }
}
```

### 🟡 **BUG 3: Perte de texte lors de la synthèse**
**Description**: L'utilisateur peut perdre son texte pendant la synthèse
**Fichier**: `App.tsx` (fonction `handleSynthesis`, ligne 511)
**Cause**: Pas de sauvegarde avant synthèse

**Solution**:
```typescript
const handleSynthesis = async () => {
    // 1. Sauvegarder l'état actuel AVANT la synthèse
    const backupMessages = [...state.messages];
    const backupDraft = draftContent;
    
    try {
        // 2. Synthèse
        const response = await synthesizeNarrative(...);
        
        // 3. Succès
        setState(...);
    } catch (error) {
        // 4. Restaurer en cas d'erreur
        setState(prev => ({ ...prev, messages: backupMessages }));
        setDraftContent(backupDraft);
        showToast('Erreur de synthèse. Votre texte a été restauré.', 'error');
    }
};
```

---

## 📝 TODOs NON RÉSOLUS

**Fichier**: `services/archiveParser.ts`
```typescript
// TODO: Implémenter le vrai parsing avec JSZip (ligne 50)
// TODO: Intégrer l'analyse Gemini pour détecter émotions et thèmes (ligne 152)
```

**Fichier**: `components/BoutiqueSouvenirs.tsx`
```typescript
// TODO: persist order to DB when schema supports it (ligne 223)
// TODO: persist order (ligne 237)
```

**Impact**: 🟡 **FONCTIONNALITÉS INCOMPLÈTES**
- Parsing d'archives sociales non fonctionnel
- Ordre des souvenirs non persisté

---

## 🎯 PLAN D'ACTION PRIORITAIRE

### 🔥 **URGENT (Avant Beta)**

1. **Sécurité des clés API** (2h)
   - [ ] Déplacer toutes les clés vers `.env`
   - [ ] Supprimer les clés hardcodées
   - [ ] Créer un backend proxy pour Gemini
   - [ ] Ajouter validation des variables d'environnement

2. **Nettoyage des console.log** (1h)
   - [ ] Créer un logger centralisé
   - [ ] Remplacer tous les console.log
   - [ ] Configurer Sentry ou équivalent pour la production

3. **Bugs UX critiques** (3h)
   - [ ] Corriger le "rebalayage" du bloc de saisie
   - [ ] Fixer la zone de texte invisible sur mobile
   - [ ] Ajouter sauvegarde automatique avant synthèse

### ⚡ **IMPORTANT (Semaine 1 post-beta)**

4. **Performance** (4h)
   - [ ] Implémenter cache Gemini dans Supabase
   - [ ] Ajouter pagination des messages
   - [ ] Optimiser auto-save (debounce 5s)

5. **Stockage** (2h)
   - [ ] Ajouter validation taille fichiers
   - [ ] Implémenter compression images
   - [ ] Créer job de nettoyage fichiers orphelins

6. **Sécurité** (3h)
   - [ ] Ajouter sanitization des inputs
   - [ ] Implémenter rate limiting
   - [ ] Ajouter validation longueur maximale

### 📊 **MONITORING (Continu)**

7. **Observabilité** (2h)
   - [ ] Configurer Sentry pour erreurs
   - [ ] Ajouter métriques de performance (Vercel Analytics)
   - [ ] Créer dashboard de monitoring Supabase

---

## 🛠️ RECOMMANDATIONS TECHNIQUES

### Architecture Backend
```
┌─────────────┐
│   Frontend  │
│   (Vite)    │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
┌──────▼──────┐   ┌─────▼─────┐
│  Supabase   │   │  Backend  │
│  (Storage)  │   │   Proxy   │
└─────────────┘   └─────┬─────┘
                        │
                  ┌─────▼─────┐
                  │  Gemini   │
                  │    API    │
                  └───────────┘
```

**Pourquoi un backend proxy ?**
- ✅ Sécurise les clés API
- ✅ Permet le rate limiting
- ✅ Facilite le caching
- ✅ Monitoring centralisé

### Variables d'environnement requises

**`.env.production`**
```bash
# Supabase
VITE_SUPABASE_URL=https://tuezgyggesrebzfxeufr.supabase.co
VITE_SUPABASE_ANON_KEY=<votre_clé_anon>

# Backend Proxy (à créer)
VITE_API_PROXY_URL=https://api.plume.app

# Monitoring
VITE_SENTRY_DSN=<votre_sentry_dsn>

# Feature Flags
VITE_ENABLE_VOICE_RECORDING=true
VITE_ENABLE_PHOTO_ANALYSIS=true
```

**Backend `.env`** (Node.js/Vercel Functions)
```bash
# Gemini
GEMINI_API_KEY=<votre_clé_gemini>

# Supabase (service role pour admin)
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MINUTES=60
```

---

## 📈 MÉTRIQUES À SURVEILLER

### Performance
- ⏱️ **Temps de réponse Gemini**: < 3s (95e percentile)
- ⏱️ **Temps de chargement initial**: < 2s
- 📊 **Taille du bundle**: < 500KB (gzipped)

### Coûts
- 💰 **Coût Gemini par utilisateur/mois**: < 5€
- 💰 **Stockage Supabase**: < 1GB par utilisateur
- 💰 **Bande passante**: < 10GB/mois

### Fiabilité
- ✅ **Uptime**: > 99.5%
- 🐛 **Taux d'erreur**: < 1%
- 🔄 **Taux de retry réussi**: > 90%

---

## ✅ CHECKLIST AVANT LANCEMENT BETA

### Sécurité
- [ ] Toutes les clés API sont dans `.env`
- [ ] RLS activé sur toutes les tables Supabase
- [ ] Rate limiting implémenté
- [ ] Sanitization des inputs
- [ ] HTTPS forcé

### Performance
- [ ] Cache Gemini actif
- [ ] Images compressées
- [ ] Lazy loading des composants
- [ ] Service Worker pour offline

### UX
- [ ] Tous les bugs critiques corrigés
- [ ] Responsive testé (mobile + desktop)
- [ ] Messages d'erreur clairs
- [ ] Loading states partout

### Monitoring
- [ ] Sentry configuré
- [ ] Analytics configuré
- [ ] Logs centralisés
- [ ] Alertes configurées

### Documentation
- [ ] README à jour
- [ ] Guide de déploiement
- [ ] Variables d'environnement documentées
- [ ] Procédure de rollback

---

## 🎓 RESSOURCES UTILES

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

**Audit réalisé par**: Antigravity AI  
**Prochaine révision**: Après correction des points critiques
