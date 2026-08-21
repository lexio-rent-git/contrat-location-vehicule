import { test } from "node:test";
import assert from "node:assert/strict";

import {
  CLAUSES,
  type Mode,
  ciblesVerrouillees,
  clausesApplicables,
  contratEnTexte,
  formulaireVide,
  numeroter,
  verifierRenvois,
} from "../src/index.ts";

const MODES: readonly Mode[] = ["pro-conso", "pro-pro", "particuliers"];

/** Pipeline complet : formulaire vide → clauses → numérotation → texte. */
const genere = (mode: Mode, desactivees: ReadonlySet<string> = new Set()) => {
  const f = formulaireVide(mode);
  const clauses = clausesApplicables(f, desactivees);
  const numerotees = numeroter(clauses);
  return { f, clauses, numerotees, texte: contratEnTexte(f, numerotees) };
};

// ─── 1. Intégrité du corpus ──────────────────────────────────────────────────

test("verifierRenvois() ne signale aucune divergence", () => {
  assert.deepEqual(verifierRenvois(), []);
});

test("le corpus compte 35 clauses aux identifiants uniques", () => {
  assert.equal(CLAUSES.length, 35);
  assert.equal(new Set(CLAUSES.map((c) => c.id)).size, 35);
});

// ─── 2. Génération dans les trois modes ──────────────────────────────────────

for (const mode of MODES) {
  test(`mode ${mode} : le pipeline produit un contrat non vide et numéroté sans trou`, () => {
    const { clauses, numerotees, texte } = genere(mode);

    assert.ok(clauses.length > 0, "au moins une clause applicable");
    // Toutes les clauses obligatoires du mode sont retenues.
    for (const c of CLAUSES) {
      if (c.obligatoire && c.applicabilite.modes.includes(mode)) {
        assert.ok(
          clauses.some((x) => x.id === c.id),
          `clause obligatoire ${c.id} présente en ${mode}`,
        );
      }
    }

    // Numérotation positionnelle : 1, 2, 3, … sans trou ni doublon.
    assert.deepEqual(
      numerotees.map((c) => c.numero),
      clauses.map((_, i) => i + 1),
    );

    // Le texte contient l'en-tête et exactement un titre par clause, dans l'ordre.
    assert.ok(texte.length > 0);
    assert.ok(texte.startsWith("CONTRAT DE LOCATION DE VÉHICULE"));
    const titres = texte.split("\n").filter((l) => l.startsWith("ARTICLE "));
    assert.equal(titres.length, clauses.length);
    numerotees.forEach((c, i) => {
      assert.equal(titres[i], `ARTICLE ${c.numero} — ${c.intitule.toUpperCase()}`);
    });
  });
}

// ─── 3. Clauses discriminantes entre modes (vérifiées par exécution) ─────────

test("les clauses consuméristes (C25, C27) sont présentes en pro-conso et absentes ailleurs", () => {
  const ids = (m: Mode) => genere(m).clauses.map((c) => c.id);
  for (const id of ["C25", "C27"]) {
    assert.ok(ids("pro-conso").includes(id), `${id} en pro-conso`);
    assert.ok(!ids("pro-pro").includes(id), `${id} absente en pro-pro`);
    assert.ok(!ids("particuliers").includes(id), `${id} absente entre particuliers`);
  }
});

test("le texte pro-conso porte la médiation de la consommation et l'art. R631-3, pas les autres", () => {
  const t = Object.fromEntries(MODES.map((m) => [m, genere(m).texte]));
  assert.match(t["pro-conso"]!, /médiateur de la consommation/);
  assert.match(t["pro-conso"]!, /R631-3/);
  assert.doesNotMatch(t["pro-pro"]!, /médiateur de la consommation/);
  assert.doesNotMatch(t["pro-pro"]!, /R631-3/);
  assert.doesNotMatch(t["particuliers"]!, /médiateur de la consommation/);
  assert.doesNotMatch(t["particuliers"]!, /R631-3/);
});

test("C06 : pénalités B2B (L441-10) seulement en pro-pro ; facture détaillée dans les deux autres modes", () => {
  const t = Object.fromEntries(MODES.map((m) => [m, genere(m).texte]));
  assert.match(t["pro-pro"]!, /L441-10/);
  assert.match(t["pro-pro"]!, /indemnité forfaitaire pour frais de recouvrement de 40 euros/);
  assert.doesNotMatch(t["pro-pro"]!, /facture détaillée poste par poste/);
  for (const m of ["pro-conso", "particuliers"] as const) {
    assert.doesNotMatch(t[m]!, /L441-10/);
    assert.match(t[m]!, /facture détaillée poste par poste/);
  }
});

test("C34 (assurance du loueur particulier) n'existe qu'entre particuliers", () => {
  assert.ok(genere("particuliers").clauses.some((c) => c.id === "C34"));
  assert.match(
    genere("particuliers").texte,
    /mise à disposition du véhicule à titre onéreux/,
  );
  for (const m of ["pro-conso", "pro-pro"] as const) {
    assert.ok(!genere(m).clauses.some((c) => c.id === "C34"));
    assert.doesNotMatch(genere(m).texte, /mise à disposition du véhicule à titre onéreux/);
  }
});

test("C33 : la tentative amiable de l'art. 750-1 CPC vise pro-conso et particuliers, jamais pro-pro", () => {
  assert.match(genere("pro-conso").texte, /750-1/);
  assert.match(genere("particuliers").texte, /750-1/);
  assert.doesNotMatch(genere("pro-pro").texte, /750-1/);
});

test("C26 (absence de rétractation) exige un terme : absente sans dates, présente en pro-conso daté", () => {
  assert.ok(!genere("pro-conso").clauses.some((c) => c.id === "C26"));

  const f = formulaireVide("pro-conso");
  f.location.debutDate = "2026-09-01";
  f.location.finDate = "2026-09-03";
  const clauses = clausesApplicables(f, new Set());
  assert.ok(clauses.some((c) => c.id === "C26"));
  assert.match(contratEnTexte(f, numeroter(clauses)), /L221-28 12°/);

  // Même datée, elle reste hors des modes non consuméristes.
  const fPro = formulaireVide("pro-pro");
  fPro.location.debutDate = "2026-09-01";
  fPro.location.finDate = "2026-09-03";
  assert.ok(!clausesApplicables(fPro, new Set()).some((c) => c.id === "C26"));
});

// ─── 4. ciblesVerrouillees ───────────────────────────────────────────────────

test("ciblesVerrouillees : les renvois des clauses obligatoires C06 verrouillent C19 et C23", () => {
  const f = formulaireVide("pro-conso");
  const verrous = ciblesVerrouillees(f, new Set());
  assert.deepEqual([...verrous.keys()].sort(), ["C19", "C23"]);
  // Chaque verrou porte un motif lisible.
  for (const motif of verrous.values()) assert.ok(motif.length > 0);
});

test("ciblesVerrouillees : le renvoi C22 → C21 ne joue que si les animaux sont autorisés", () => {
  const f = formulaireVide("pro-conso");
  assert.ok(!ciblesVerrouillees(f, new Set()).has("C21"), "animaux interdits : C21 libre");

  f.options.animaux = true;
  assert.ok(ciblesVerrouillees(f, new Set()).has("C21"), "animaux autorisés : C21 verrouillée");

  // Décocher la SOURCE (C22, facultative) libère la cible.
  assert.ok(!ciblesVerrouillees(f, new Set(["C22"])).has("C21"));
});

test("ciblesVerrouillees : le renvoi C32 → C09 ne joue que pour un véhicule électrique", () => {
  const f = formulaireVide("pro-conso");
  assert.ok(!ciblesVerrouillees(f, new Set()).has("C09"));
  f.vehicule.energie = "electrique";
  assert.ok(ciblesVerrouillees(f, new Set()).has("C09"));
});

test("clausesApplicables réintègre une cible verrouillée malgré son décochage", () => {
  const f = formulaireVide("pro-conso");
  f.options.animaux = true;
  // C21 est décochée mais cible du renvoi actif C22 → C21 : elle reste.
  const avecVerrou = clausesApplicables(f, new Set(["C21"])).map((c) => c.id);
  assert.ok(avecVerrou.includes("C21"));

  // Sans le renvoi actif (animaux interdits), le décochage de C21 est respecté.
  const fLibre = formulaireVide("pro-conso");
  const sansVerrou = clausesApplicables(fLibre, new Set(["C21"])).map((c) => c.id);
  assert.ok(!sansVerrou.includes("C21"));
});
