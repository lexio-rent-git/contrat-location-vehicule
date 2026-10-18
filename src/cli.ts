#!/usr/bin/env node
// Interface en ligne de commande du générateur de contrat de location.
// Aucune clause ici : le fichier lit un formulaire JSON, appelle le moteur
// (filtrage, numérotation, mise en texte) et imprime le résultat.
//
//   contrat formulaire --mode pro-conso > location.json
//   contrat generer location.json
//   contrat etat-des-lieux --type utilitaire
//   contrat verifier

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

import {
  ACCESSOIRES,
  CODES_DOMMAGE,
  CODES_GRAVITE,
  CODES_STATUT,
  MODES,
  NIVEAUX_JAUGE,
  RUBRIQUES_CAMPING_CAR,
  RUBRIQUES_EDL,
  RUBRIQUES_UTILITAIRE,
  TYPES_VEHICULE,
  ZONES_CARROSSERIE,
  ZONES_MOTO,
  clausesApplicables,
  contratEnTexte,
  formulaireVide,
  numeroter,
  verifierRenvois,
  type Formulaire,
  type Mode,
  type RubriqueEdl,
  type TypeVehicule,
} from "./contrat-location.ts";

const PAGE_CONTRAT = "https://lexio.rent/outils/modele-contrat-location-voiture";
const PAGE_EDL = "https://lexio.rent/outils/modele-etat-des-lieux-vehicule";

const ids = (t: ReadonlyArray<{ id: string }>): string => t.map((x) => x.id).join(" | ");

const AIDE = `Contrat de location de véhicule (voiture, utilitaire, camion, moto, camping-car)
et fiche d'état des lieux, à partir d'un formulaire JSON.

Usage
  contrat formulaire [--mode <m>]          formulaire JSON vierge à compléter
  contrat generer <formulaire.json | ->    contrat complet, articles numérotés
  contrat etat-des-lieux [--type <t>]      fiche d'état des lieux départ / retour à imprimer
  contrat verifier                         contrôle les renvois entre articles
  contrat --help | --version

Options
  --mode <m>         ${ids(MODES)} (défaut : pro-conso)
  --type <t>         ${ids(TYPES_VEHICULE)} (défaut : voiture)
  --sans <ids>       clauses facultatives à retirer, séparées par des virgules
  --json             « generer » : liste des clauses retenues au lieu du texte

Les champs non renseignés sont imprimés en pointillés : un formulaire vide donne
un contrat utilisable au stylo. Ce document ne constitue pas un conseil juridique.

Formulaire en ligne, avec export PDF et Word : ${PAGE_CONTRAT}
État des lieux en ligne : ${PAGE_EDL}
Code source : https://github.com/lexio-rent-git/contrat-location-vehicule
(licence source-available : voir LICENSE.md)`;

function echec(message: string): never {
  process.stderr.write(`contrat : ${message}\nAide : contrat --help\n`);
  process.exit(2);
}

function mode(brut: string | undefined): Mode {
  if (brut === undefined) return "pro-conso";
  if (!MODES.some((m) => m.id === brut)) echec(`--mode « ${brut} » inconnu (valeurs : ${ids(MODES)})`);
  return brut as Mode;
}

function typeVehicule(brut: string | undefined): TypeVehicule {
  if (brut === undefined) return "voiture";
  if (!TYPES_VEHICULE.some((t) => t.id === brut)) echec(`--type « ${brut} » inconnu (valeurs : ${ids(TYPES_VEHICULE)})`);
  return brut as TypeVehicule;
}

/** Recopie dans `base` les seules clés connues, du même type que le modèle
    vide. Un JSON fantaisiste dégrade le contrat (pointillés), il ne produit
    jamais un document incohérent. */
function fusionner(base: unknown, saisie: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(saisie) ? saisie : base;
  if (typeof base === "object" && base !== null) {
    if (typeof saisie !== "object" || saisie === null || Array.isArray(saisie)) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(saisie as Record<string, unknown>)) {
      if (k in out) out[k] = fusionner(out[k], v);
    }
    return out;
  }
  return typeof saisie === typeof base ? saisie : base;
}

function lireFormulaire(source: string | undefined, modeOption: string | undefined): Formulaire {
  if (!source) echec("« generer » attend un fichier JSON (ou « - » pour l'entrée standard)");
  let brut: unknown;
  try {
    brut = JSON.parse(readFileSync(source === "-" ? 0 : source, "utf8"));
  } catch (e) {
    echec(`lecture de « ${source} » impossible : ${(e as Error).message}`);
  }
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) echec("le formulaire doit être un objet JSON");
  const m = mode(modeOption ?? ((brut as { mode?: string }).mode));
  return fusionner(formulaireVide(m), { ...(brut as object), mode: m }) as Formulaire;
}

function ficheEtatDesLieux(type: TypeVehicule): string {
  const libelleType = TYPES_VEHICULE.find((t) => t.id === type)?.label ?? type;
  const rubriques: RubriqueEdl[] = [
    ...RUBRIQUES_EDL,
    ...(type === "utilitaire" || type === "camion" ? RUBRIQUES_UTILITAIRE : []),
    ...(type === "camping-car" ? RUBRIQUES_CAMPING_CAR : []),
  ];
  const zones = type === "moto" ? ZONES_MOTO : ZONES_CARROSSERIE;
  const l: string[] = [];
  l.push(`ÉTAT DES LIEUX DU VÉHICULE — ${libelleType.toUpperCase()}`);
  l.push("Départ ☐   Retour ☐        Date : ............  Heure : ......");
  l.push("Contrat n° ............  Immatriculation : ............  Kilométrage : ............");
  l.push("");
  for (const r of rubriques) {
    l.push(r.titre.toUpperCase());
    for (const ligne of r.lignes) l.push(`  ☐ conforme  ☐ réserve   ${ligne}`);
    l.push("");
  }
  l.push(`CARBURANT / CHARGE : ${NIVEAUX_JAUGE.join("  ☐ ")}`);
  l.push("");
  l.push("CARROSSERIE — tour du véhicule (zone : nature, gravité, statut)");
  for (const z of zones) l.push(`  ${z.padEnd(42, ".")} ______  ______  ______`);
  l.push("");
  l.push("Nature : " + CODES_DOMMAGE.map((c) => `${c.code} = ${c.libelle.split(" — ")[0]}`).join(" ; "));
  l.push("Gravité : " + CODES_GRAVITE.map((c) => `${c.code} = ${c.libelle.split(" — ")[0]}`).join(" ; "));
  l.push("Statut : " + CODES_STATUT.map((c) => `${c.code} = ${c.libelle.split(" — ")[0]}`).join(" ; "));
  l.push("");
  l.push("ACCESSOIRES REMIS");
  for (const a of ACCESSOIRES) l.push(`  ☐ ${a}`);
  l.push("");
  l.push("Signature du loueur                         Signature du locataire");
  l.push("");
  l.push(`Version en ligne, avec photos et schéma : ${PAGE_EDL}`);
  return l.join("\n");
}

function main(argv: string[]): void {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
      json: { type: "boolean" },
      mode: { type: "string" },
      type: { type: "string" },
      sans: { type: "string" },
    },
  });

  const [commande, ...reste] = positionals;
  if (values.version) {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    process.stdout.write(`${pkg.version}\n`);
    return;
  }
  if (values.help || commande === undefined || commande === "aide") {
    process.stdout.write(AIDE + "\n");
    return;
  }

  switch (commande) {
    case "formulaire": {
      process.stdout.write(JSON.stringify(formulaireVide(mode(values.mode)), null, 2) + "\n");
      return;
    }
    case "generer": {
      const f = lireFormulaire(reste[0], values.mode);
      const sans = new Set((values.sans ?? "").split(",").map((x) => x.trim()).filter(Boolean));
      const clauses = numeroter(clausesApplicables(f, sans));
      if (values.json) {
        process.stdout.write(JSON.stringify(clauses.map((c) => ({ numero: c.numero, id: c.id, intitule: c.intitule, baseLegale: c.baseLegale })), null, 2) + "\n");
      } else {
        process.stdout.write(contratEnTexte(f, clauses) + "\n");
      }
      return;
    }
    case "etat-des-lieux": {
      process.stdout.write(ficheEtatDesLieux(typeVehicule(values.type)) + "\n");
      return;
    }
    case "verifier": {
      const erreurs = verifierRenvois();
      if (erreurs.length) {
        process.stderr.write(`${erreurs.length} renvoi(s) cassé(s) :\n${erreurs.join("\n")}\n`);
        process.exit(1);
      }
      process.stdout.write("Renvois entre articles : OK, aucune incohérence.\n");
      return;
    }
    default:
      echec(`commande « ${commande} » inconnue`);
  }
}

try {
  main(process.argv.slice(2));
} catch (e) {
  echec((e as Error).message);
}
