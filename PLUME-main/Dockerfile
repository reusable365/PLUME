# ÉTAPE 1: Construction (Build Stage) - PAS DE CHANGEMENT
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build


# ÉTAPE 2: Production (Runtime Stage) - UTILISATION DE SERVE
FROM node:18-alpine AS runner
WORKDIR /app

# Installe l'outil 'serve' globalement pour servir les fichiers statiques
RUN npm install -g serve

# Copie uniquement le dossier de distribution (compilé) de Vite
COPY --from=builder /app/dist ./dist 

# Cloud Run/Docker attend le port 8080
ENV PORT 8080
EXPOSE 8080

# Lancement de l'application avec 'serve' sur le port 8080, servant le dossier dist
# -s : single-page application (important pour React/Vite)
CMD ["serve", "-s", "dist", "-l", "8080"]