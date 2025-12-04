# 🔑 CONFIGURATION DES CLÉS API - PLUME

**URGENT**: Vous devez créer ce fichier pour que l'application fonctionne !

---

## 📝 ÉTAPE 1: Créer le fichier .env.local

```bash
# Dans le dossier racine du projet (PLUME-main)
# Créer le fichier .env.local
```

**Sur Windows (PowerShell)**:
```powershell
New-Item -Path ".env.local" -ItemType File
```

**Sur Mac/Linux**:
```bash
touch .env.local
```

---

## 📋 ÉTAPE 2: Copier ce contenu dans .env.local

Ouvrez le fichier `.env.local` avec votre éditeur et collez ceci :

```bash
# ========================================
# PLUME - Variables d'environnement
# ========================================

# ----------------------------------------
# Supabase Configuration
# ----------------------------------------
VITE_SUPABASE_URL=https://tuezgyggesrebzfxeufr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1ZXpneWdnZXNyZWJ6ZnhldWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTcxODcsImV4cCI6MjA3OTU5MzE4N30.cNUF9zyZLNMwLxp3XH-fD74pME5un656pj331L89rhk

# ----------------------------------------
# Gemini AI Configuration
# ----------------------------------------
# 🔑 REMPLACEZ PAR VOTRE VRAIE CLÉ GEMINI ICI
GEMINI_API_KEY=VOTRE_CLE_GEMINI_ICI

# Pour obtenir votre clé Gemini:
# 1. Allez sur: https://aistudio.google.com/app/apikey
# 2. Cliquez sur "Create API Key"
# 3. Copiez la clé et remplacez "VOTRE_CLE_GEMINI_ICI" ci-dessus
```

---

## ✅ ÉTAPE 3: Obtenir votre clé Gemini

1. **Ouvrir le site**: https://aistudio.google.com/app/apikey
2. **Se connecter** avec votre compte Google
3. **Cliquer** sur "Create API Key" ou "Get API Key"
4. **Copier** la clé générée (elle ressemble à: `AIzaSy...`)
5. **Remplacer** `VOTRE_CLE_GEMINI_ICI` dans le fichier `.env.local`

---

## 🚀 ÉTAPE 4: Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

---

## ✅ VÉRIFICATION

Après avoir redémarré, ouvrez la console navigateur (F12) :

**✅ BON SIGNE**:
- Pas d'erreur "API Key missing"
- Pas de warning "Using default Supabase key"
- L'application se charge normalement

**❌ PROBLÈME**:
- Erreur "API Key missing" → Vérifiez que `GEMINI_API_KEY` est bien rempli
- Warning "Using default Supabase key" → Vérifiez que `VITE_SUPABASE_ANON_KEY` est bien rempli
- Fichier non trouvé → Vérifiez que `.env.local` est bien à la racine du projet

---

## 🔒 SÉCURITÉ

⚠️ **IMPORTANT**:
- ✅ Le fichier `.env.local` est déjà dans `.gitignore`
- ✅ Il ne sera JAMAIS commité sur Git
- ✅ Vos clés restent privées

❌ **NE JAMAIS**:
- Partager votre fichier `.env.local`
- Commiter vos clés API sur Git
- Publier vos clés en ligne

---

## 🆘 EN CAS DE PROBLÈME

### Problème 1: "Cannot find module '.env.local'"
**Solution**: Le fichier doit être à la racine du projet, au même niveau que `package.json`

### Problème 2: "API Key missing"
**Solution**: 
1. Vérifiez que le fichier s'appelle bien `.env.local` (avec le point au début)
2. Vérifiez que `GEMINI_API_KEY=` est bien rempli (pas de "VOTRE_CLE_GEMINI_ICI")
3. Redémarrez le serveur (`npm run dev`)

### Problème 3: Les changements ne sont pas pris en compte
**Solution**:
1. Arrêtez le serveur (Ctrl+C)
2. Relancez `npm run dev`
3. Rechargez la page (Ctrl+R ou F5)

---

## 📞 AIDE RAPIDE

**Commandes utiles**:

```bash
# Vérifier que le fichier existe
ls -la | grep .env.local    # Mac/Linux
dir | findstr .env.local    # Windows

# Afficher le contenu (pour debug)
cat .env.local              # Mac/Linux
type .env.local             # Windows

# Redémarrer le serveur
npm run dev
```

---

**Une fois configuré, vous n'aurez plus l'erreur "API Key missing" ! 🎉**
