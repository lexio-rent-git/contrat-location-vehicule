# Générateur de contrat de location de véhicule

Développé et maintenu par [Lexio](https://lexio.rent), le logiciel de location de voiture et d'utilitaire pour loueurs professionnels.

## Ce que fait l'outil

Ce package TypeScript contient le moteur et le corpus de clauses juridiques d'un générateur de contrat de location de véhicule **sans chauffeur, en droit français**. Chaque clause cite sa base légale (Code civil, Code de la consommation, Code de la route, Code des assurances, arrêté du 17 mars 2015, recommandation CCA n° 96-02…) et n'est retenue que lorsqu'elle s'applique réellement à la situation saisie.

- **Trois modes de location**, chacun avec son régime juridique :
  - **loueur professionnel → particulier** (information précontractuelle, devis, médiation de la consommation, clauses abusives) ;
  - **loueur professionnel → professionnel** (pénalités de retard de paiement du Code de commerce, clause attributive de compétence optionnelle) ;
  - **entre particuliers** (déclaration d'assurance du loueur particulier, avertissement sur la requalification en activité commerciale).
- **Cinq types de véhicules** : voiture, utilitaire, camion, moto/scooter, camping-car — avec les clauses spécifiques à chacun (feuille de location du transport de marchandises, gabarit du camping-car, équipements du deux-roues, véhicule électrique).
- **Options contractuelles** : kilométrage illimité ou forfait + prix du km supplémentaire, politique carburant/énergie (plein-plein, même niveau, forfait), dépôt de garantie (chèque, virement, empreinte CB), zones de circulation (France, UE, zone personnalisée), animaux, tabac, conduite à l'étranger, barème de remise en état.
- **Génération en texte prêt à imprimer** : contrat numéroté article par article, à coller dans un traitement de texte, avec mode « vierge » pour imprimer des contrats papier à remplir à la main. Le package fournit aussi les constantes de la **fiche d'état des lieux** (zones de carrosserie, codes de dommage, gravité, statut, rubriques de contrôle).

> ### ⚠️ Licence
>
> Ce dépôt est **source-available**, il n'est **PAS open source** au sens classique. Vous pouvez consulter le code, générer des contrats et les utiliser pour votre propre activité de location (personnelle ou professionnelle), et contribuer via issues et pull requests. En revanche, **la republication des modèles de clauses est interdite** sans autorisation écrite : pas de redistribution, de revente ni d'intégration dans un produit, service ou site concurrent. Détails dans [LICENSE.md](./LICENSE.md).

> ### ⚡ Version en ligne
>
> Le générateur complet, avec formulaire, aperçu et fiches d'état des lieux, est utilisable gratuitement sur
> **[https://lexio.rent/outils/modele-contrat-location-voiture](https://lexio.rent/outils/modele-contrat-location-voiture)**.

## Installation

Le package s'exécute directement avec **Node.js ≥ 24** (type stripping natif, aucune compilation nécessaire) :

```bash
git clone https://github.com/lexio-rent-git/contrat-location-vehicule
cd contrat-location-vehicule
node --test "tests/**/*.test.ts"   # ou : npm test
```

## Exemple d'usage

Créez un fichier `exemple.ts` à la racine du dépôt :

```ts
import {
  clausesApplicables,
  contratEnTexte,
  formulaireVide,
  numeroter,
} from "./src/index.ts";

// Contrat pro → consommateur minimal
const f = formulaireVide("pro-conso");
f.loueur.denomination = "Garage Martin";
f.loueur.formeJuridique = "SARL";
f.locataire.prenom = "Jeanne";
f.locataire.nom = "Dupont";
f.vehicule.marque = "Renault";
f.vehicule.modele = "Clio V";
f.vehicule.immatriculation = "AB-123-CD";
f.location.debutDate = "2026-09-01";
f.location.debutHeure = "09:00";
f.location.finDate = "2026-09-03";
f.location.finHeure = "18:00";

const clauses = numeroter(clausesApplicables(f, new Set()));
console.log(contratEnTexte(f, clauses));
```

Puis exécutez-le :

```bash
node exemple.ts
```

Extrait de la sortie (les champs non renseignés deviennent des pointillés à compléter à la main) :

```text
CONTRAT DE LOCATION DE VÉHICULE
Référence : ..........
Véhicule : Renault Clio V — AB-123-CD
Période : du 1 septembre 2026 à 09:00 au 3 septembre 2026 à 18:00

ARTICLE 1 — IDENTIFICATION DES PARTIES

Le présent contrat est conclu entre le Loueur, Garage Martin, SARL, dont le
siège social ou le domicile est situé ............................, [...]

et le Locataire, Jeanne Dupont, né(e) le .......... à ............, [...]
```

## API

| Export | Rôle |
| --- | --- |
| `formulaireVide(mode?)` | Formulaire vierge typé (`Formulaire`), aucun montant pré-rempli ; mode par défaut : `"pro-conso"`. |
| `viderFormulaire(f)` | Version « contrat vierge à imprimer » : conserve la structure (mode, type, options), efface toutes les saisies. |
| `clausesApplicables(f, desactivees)` | Filtre le corpus selon le mode, le type de véhicule, les options et les clauses décochées ; les clauses obligatoires et les cibles de renvois actifs sont protégées. |
| `ciblesVerrouillees(f, desactivees)` | Clauses non décochables sans créer un renvoi mort, avec le motif à afficher (`Map<id, motif>`). |
| `numeroter(clauses)` | Numérotation positionnelle 1…n, recalculée à chaque changement (jamais de trou). |
| `contratEnTexte(f, clausesNumerotees)` | Contrat complet en texte brut, prêt à coller dans un traitement de texte. |
| `verifierRenvois()` | Contrôle d'intégrité des renvois inter-articles ; retourne la liste des divergences (vide si tout est cohérent). |
| `CLAUSES`, `RENVOIS`, `META` | Corpus des 35 clauses (id, intitulé, base légale, applicabilité), renvois inter-articles, sources citées. |
| `MODES`, `TYPES_VEHICULE`, `ENERGIES`, `POLITIQUES_KM`, `POLITIQUES_CARBURANT`, `MODES_DEPOT`, `ZONES` | Énumérations du domaine avec libellés pour l'interface. |
| `val`, `eur`, `dateFr`, `dateHeureFr`, `nomPartie`, `libelleZone`, `permisRequis` | Formatage : valeur ou pointillés, montants, dates françaises, zone de circulation imprimable, catégorie de permis. |
| `ZONES_CARROSSERIE`, `ZONES_MOTO`, `CODES_DOMMAGE`, `CODES_GRAVITE`, `CODES_STATUT`, `RUBRIQUES_EDL`, `RUBRIQUES_CAMPING_CAR`, `RUBRIQUES_UTILITAIRE`, `ACCESSOIRES`, `NIVEAUX_JAUGE` | Constantes de la fiche d'état des lieux (départ et retour). |

## Avertissement

Ce générateur produit un **modèle type**. Il est rédigé avec soin et cite ses sources, mais il ne remplace pas l'avis d'un avocat ou d'un professionnel du droit pour les cas particuliers (flottes, LLD, clauses spécifiques, situations transfrontalières…). Faites relire vos contrats avant usage.

## À propos de Lexio

[Lexio](https://lexio.rent) est un logiciel de location de voiture et d'utilitaire pour les loueurs professionnels : planning, contrats, état des lieux photo, facturation. Essai gratuit de 14 jours, sans carte bancaire.
