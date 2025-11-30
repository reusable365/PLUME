# ÉTAPE 1: Construction (Build Stage)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# ÉTAPE 2: Production (Runtime Stage) - SIMPLIFIÉE
FROM node:18-alpine AS runner
WORKDIR /app

# IMPORTANT : Au lieu de réinstaller les dépendances, nous copions
# l'installation complète du BUILDER (y compris node_modules)
COPY --from=builder /app /app 

# Le dossier de sortie de Vite est "dist"
# Nous copions le dossier 'dist' créé par la compilation.
# (Cette ligne n'est plus strictement nécessaire si nous avons copié tout /app ci-dessus, mais laissons-la pour la clarté si vous faites un multi-stage build plus tard)
# COPY --from=builder /app/dist ./dist 

ENV PORT 8080
EXPOSE 8080

# Lancement du serveur de prévisualisation Vite
CMD ["npm", "run", "preview"]