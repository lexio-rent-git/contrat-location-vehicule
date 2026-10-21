# Contrat de location de véhicule et fiche d'état des lieux en ligne de commande.
# Aucune dépendance npm : Node 24 exécute le TypeScript directement.
FROM node:24-alpine

# Renseignés au build (date ISO 8601 et version du paquet) pour Artifact Hub.
ARG CREATED
ARG VERSION

LABEL org.opencontainers.image.title="contrat-location-vehicule" \
      org.opencontainers.image.description="Contrat de location de véhicule (voiture, utilitaire, camion, moto, camping-car) et fiche d'état des lieux, clauses sourcées" \
      org.opencontainers.image.url="https://lexio.rent/logiciel-location-voiture" \
      org.opencontainers.image.source="https://github.com/lexio-rent-git/contrat-location-vehicule" \
      org.opencontainers.image.licenses="LicenseRef-Lexio-source-available" \
      org.opencontainers.image.vendor="Lexio Rent" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${CREATED}" \
      io.artifacthub.package.readme-url="https://raw.githubusercontent.com/lexio-rent-git/contrat-location-vehicule/main/ARTIFACTHUB.md" \
      io.artifacthub.package.keywords="contrat-de-location,etat-des-lieux,location-voiture,loueur,cli" \
      io.artifacthub.package.logo-url="https://lexio.rent/icon.png"

WORKDIR /app
COPY package.json README.md LICENSE.md ./
COPY src ./src
COPY tests ./tests

# Les tests et le contrôle des renvois entre articles sont rejoués au build.
RUN node --test "tests/**/*.test.ts" && node src/cli.ts verifier

USER node
ENTRYPOINT ["node", "/app/src/cli.ts"]
CMD ["--help"]
