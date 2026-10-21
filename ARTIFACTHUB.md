# Contrat de location de véhicule et état des lieux, en ligne de commande

Génère un **contrat de location** complet et une **fiche d'état des lieux** départ / retour pour voiture, utilitaire, camion, moto ou camping-car, à partir d'un simple formulaire JSON.

- Trois cas : loueur professionnel → particulier, professionnel → professionnel, entre particuliers
- Clauses filtrées selon le véhicule et les options (animaux, remorquage, conduite à l'étranger…), chacune avec sa base légale
- Articles numérotés sans trou et renvois entre articles contrôlés à chaque build
- Champs non renseignés imprimés en pointillés : un formulaire vide donne un contrat utilisable au stylo
- Fiche d'état des lieux à cocher « conforme / réserve », tour de carrosserie avec codes de nature, de gravité et de statut (préexistant, nouveau, usure normale)
- Aucune dépendance : Node 24 sur Alpine, exécuté en utilisateur non root

Vous préférez un formulaire ? Le contrat existe en ligne, avec export PDF et Word : **[modèle de contrat de location de voiture](https://lexio.rent/outils/modele-contrat-location-voiture)**.

## Utilisation

```bash
# Formulaire vierge à compléter (pro-conso, pro-pro ou particuliers)
docker run --rm lexiorent/contrat-location-vehicule formulaire --mode pro-conso > location.json

# Le contrat, prêt à imprimer
docker run --rm -i lexiorent/contrat-location-vehicule generer - < location.json

# La liste des articles retenus, avec leur base légale
docker run --rm -i lexiorent/contrat-location-vehicule generer - --json < location.json

# Fiche d'état des lieux : voiture, utilitaire, camion, moto ou camping-car
docker run --rm lexiorent/contrat-location-vehicule etat-des-lieux --type utilitaire

# Toutes les options
docker run --rm lexiorent/contrat-location-vehicule --help
```

Exemple de `location.json` (les champs absents restent en pointillés) :

```json
{
  "loueur": { "denomination": "Garage Martin", "formeJuridique": "SARL" },
  "locataire": { "prenom": "Jeanne", "nom": "Dupont" },
  "vehicule": { "marque": "Renault", "modele": "Clio V", "immatriculation": "AB-123-CD" },
  "location": { "debutDate": "2026-09-01", "debutHeure": "09:00", "finDate": "2026-09-03", "finHeure": "18:00" }
}
```

## Tags

- `latest`, `0.2.1`

## Licence

Licence « source-available » : vous pouvez exécuter l'outil et utiliser librement les contrats générés pour votre propre activité de location. La redistribution des modèles de clauses est réservée. Détail : [LICENSE.md](https://github.com/lexio-rent-git/contrat-location-vehicule/blob/main/LICENSE.md). Ce document ne constitue pas un conseil juridique.

Développé et maintenu par [Lexio Rent](https://lexio.rent/logiciel-location-voiture), logiciel de location de voiture et d'utilitaire pour les loueurs professionnels.
