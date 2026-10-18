// Tests de l'interface en ligne de commande : on lance le vrai binaire et on
// vérifie la sortie sur l'exemple du README.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../src/cli.ts", import.meta.url));

const contrat = (args: string[], entree?: string) =>
  spawnSync(process.execPath, [CLI, ...args], { input: entree, encoding: "utf8" });

const FORMULAIRE = {
  loueur: { denomination: "Garage Martin", formeJuridique: "SARL" },
  locataire: { prenom: "Jeanne", nom: "Dupont" },
  vehicule: { marque: "Renault", modele: "Clio V", immatriculation: "AB-123-CD" },
  location: { debutDate: "2026-09-01", debutHeure: "09:00", finDate: "2026-09-03", finHeure: "18:00" },
};

test("generer : contrat pro → particulier de l'exemple du README", () => {
  const r = contrat(["generer", "-"], JSON.stringify(FORMULAIRE));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^CONTRAT DE LOCATION DE VÉHICULE$/m);
  assert.match(r.stdout, /Véhicule : Renault Clio V — AB-123-CD/);
  assert.match(r.stdout, /Période : du 1 septembre 2026 à 09:00 au 3 septembre 2026 à 18:00/);
  assert.match(r.stdout, /le Loueur, Garage Martin, SARL/);
});

test("generer --json : articles numérotés sans trou", () => {
  const r = contrat(["generer", "-", "--json"], JSON.stringify(FORMULAIRE));
  assert.equal(r.status, 0);
  const clauses = JSON.parse(r.stdout);
  assert.ok(clauses.length > 10);
  clauses.forEach((c: { numero: number }, i: number) => assert.equal(c.numero, i + 1));
});

test("generer : une valeur de mauvais type est ignorée, pas imprimée", () => {
  const r = contrat(["generer", "-"], JSON.stringify({ ...FORMULAIRE, vehicule: { ...FORMULAIRE.vehicule, marque: 42 } }));
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.stdout, /Véhicule : 42/);
});

test("formulaire : JSON vierge du mode demandé", () => {
  const r = contrat(["formulaire", "--mode", "particuliers"]);
  assert.equal(r.status, 0);
  assert.equal(JSON.parse(r.stdout).mode, "particuliers");
});

test("etat-des-lieux : rubriques propres à l'utilitaire et zones moto", () => {
  const u = contrat(["etat-des-lieux", "--type", "utilitaire"]);
  assert.equal(u.status, 0);
  assert.match(u.stdout, /ZONE DE CHARGEMENT ET GABARIT/);
  const v = contrat(["etat-des-lieux"]);
  assert.doesNotMatch(v.stdout, /ZONE DE CHARGEMENT/);
  const m = contrat(["etat-des-lieux", "--type", "moto"]);
  assert.match(m.stdout, /Tête de fourche/);
});

test("verifier : renvois entre articles cohérents", () => {
  const r = contrat(["verifier"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /aucune incohérence/);
});

test("option invalide : code 2 et message explicite", () => {
  const r = contrat(["etat-des-lieux", "--type", "tracteur"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--type « tracteur » inconnu/);
});
