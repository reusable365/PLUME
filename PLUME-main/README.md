<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1xh70gHjJWO1e5EXVfOxgz46a4qlN4Mte

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Copiez le fichier `.env.example` vers `.env.local` :
   ```bash
   cp .env.example .env.local
   ```
3. Ajoutez votre clé API Gemini dans `.env.local` :
   - Obtenez votre clé sur [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Remplacez `votre_cle_api_gemini_ici` par votre vraie clé API
   - ⚠️ **Important** : Ne commitez JAMAIS le fichier `.env.local` dans Git
3. Run the app:
   `npm run dev`
