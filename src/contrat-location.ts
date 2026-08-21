// ─────────────────────────────────────────────────────────────────────────────
// src/data/contrat-location.ts
// Corpus de clauses, constantes d'état des lieux et modèle de formulaire du
// générateur de contrat de location de véhicule.
//
// Pourquoi du TypeScript et pas un JSON (contrairement à tous les autres modules
// de src/data/) : le texte d'une clause est INTERPOLÉ avec la saisie de
// l'utilisateur. Une clause n'est donc pas une donnée, c'est une fonction
// `(f: Formulaire) => string[]`. Un JSON aurait imposé un mini-langage de
// substitution maison — plus de code, moins de sûreté de typage, et aucune
// vérification à la compilation que le champ interpolé existe encore.
//
// Pourquoi un SEUL module et pas deux (contrat + état des lieux) : les deux
// pièces sortent de la même impression et partagent le type `TypeVehicule`.
// Les séparer aurait créé un import circulaire ou un type dupliqué.
// ─────────────────────────────────────────────────────────────────────────────

export const META = {
  miseAJour: "2026-07-30",
  version: "1.0.0",
  /**
   * Sources citées en pied de page ET dans le JSON-LD (`citation[]`).
   * Règle du repo : aucun chiffre ni aucune référence légale n'est écrit en dur
   * dans la prose de la page — tout est dérivé d'ici, donc jamais de
   * contradiction entre le texte éditorial et le document produit.
   */
  sources: [
    {
      nom: "Code civil, art. 1708 à 1762 (louage de choses)",
      url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070721/LEGISCTA000006136341/",
    },
    {
      nom: "Code de la consommation, art. L212-1, R212-1 et R212-2 (clauses abusives)",
      url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006069565/LEGISCTA000032221304/",
    },
    {
      nom: "Arrêté du 17 mars 2015 relatif à l'information précontractuelle des consommateurs et à la publicité des prix des prestations de location de véhicules",
      url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000030375910/",
    },
    {
      nom: "Recommandation n° 96-02 de la Commission des clauses abusives (location de véhicules automobiles)",
      url: "https://www.clauses-abusives.fr/recommandation/locations-de-vehicules-automobiles/",
    },
    {
      nom: "Code de la route, art. L121-2, L121-3 et L121-6 (désignation du conducteur)",
      url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006074228/LEGISCTA000006159573/",
    },
    {
      nom: "Arrêté du 5 mai 2003 relatif à la location de véhicules destinés au transport routier de marchandises",
      url: "https://www.legifrance.gouv.fr/loda/id/LEGITEXT000005634423/",
    },
    {
      nom: "Arrêté du 9 novembre 1999 relatif à la location de véhicules industriels destinés au transport routier de marchandises",
      url: "https://www.legifrance.gouv.fr/loda/id/LEGITEXT000005628727/",
    },
    {
      nom: "Code des assurances, art. L211-1, L211-7-1, R211-10 et R211-13 (assurance obligatoire des véhicules terrestres à moteur)",
      url: "https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006073984/LEGISCTA000006157541/",
    },
  ],
} as const;

// ─── Énumérations du domaine ─────────────────────────────────────────────────

export type TypeVehicule = "voiture" | "utilitaire" | "camion" | "moto" | "camping-car";
export type Mode = "pro-conso" | "pro-pro" | "particuliers";
export type Energie = "essence" | "gazole" | "gpl" | "hybride" | "electrique";
export type PolitiqueKm = "illimite" | "forfait";
export type PolitiqueCarburant = "plein-plein" | "meme-niveau" | "forfait";
export type ModeSaisie = "rempli" | "vierge";
export type ModeDepot = "aucun" | "cheque" | "virement" | "empreinte";
export type Zone = "france" | "ue" | "personnalisee";
export type NaturePartie = "personne" | "societe";

/**
 * Le type de véhicule pilote quatre choses à la fois : la catégorie de permis
 * rappelée au contrat, les clauses spécifiques activées (C29/C30/C31), les
 * champs supplémentaires de la fiche véhicule et la silhouette du schéma de
 * carrosserie. D'où une table unique plutôt que quatre `switch` disséminés.
 */
export const TYPES_VEHICULE: ReadonlyArray<{
  id: TypeVehicule;
  label: string;
  permis: string;
  note: string;
  /** Silhouette du schéma d'état des lieux : quatre vues « auto » ou profil « moto ». */
  silhouette: "auto" | "moto";
}> = [
  {
    id: "voiture",
    label: "Voiture",
    permis: "B",
    note: "Véhicule particulier, moins de 3,5 t de PTAC.",
    silhouette: "auto",
  },
  {
    id: "utilitaire",
    label: "Utilitaire",
    permis: "B",
    note: "VUL ≤ 3,5 t : hauteur hors tout et charge utile à faire figurer.",
    silhouette: "auto",
  },
  {
    id: "camion",
    label: "Camion",
    permis: "C1 / C",
    note: "Plus de 3,5 t : feuille de location obligatoire à bord.",
    silhouette: "auto",
  },
  {
    id: "moto",
    label: "Moto / scooter",
    permis: "A1 / A2 / A",
    note: "Équipements de protection obligatoires (casque, gants CE).",
    silhouette: "moto",
  },
  {
    id: "camping-car",
    label: "Camping-car",
    permis: "B ou C1",
    note: "PTAC souvent > 3 500 kg : vérifier la catégorie de permis.",
    silhouette: "auto",
  },
];

export const MODES: ReadonlyArray<{ id: Mode; label: string; aide: string }> = [
  {
    id: "pro-conso",
    label: "Loueur professionnel → particulier",
    aide: "Régime le plus exigeant : information précontractuelle, devis, clauses abusives, médiation.",
  },
  {
    id: "pro-pro",
    label: "Loueur professionnel → professionnel",
    aide: "Auto-école, VTC, société : le Code de la consommation ne s'applique pas, le Code de commerce oui.",
  },
  {
    id: "particuliers",
    label: "Entre particuliers",
    aide: "Vérifiez d'abord que votre assurance couvre la location à titre onéreux.",
  },
];

export const ENERGIES: ReadonlyArray<{ id: Energie; label: string }> = [
  { id: "essence", label: "Essence" },
  { id: "gazole", label: "Gazole" },
  { id: "gpl", label: "GPL" },
  { id: "hybride", label: "Hybride" },
  { id: "electrique", label: "Électrique" },
];

export const POLITIQUES_KM: ReadonlyArray<{ id: PolitiqueKm; label: string }> = [
  { id: "illimite", label: "Kilométrage illimité" },
  { id: "forfait", label: "Forfait kilométrique + prix du km supplémentaire" },
];

export const POLITIQUES_CARBURANT: ReadonlyArray<{ id: PolitiqueCarburant; label: string }> = [
  { id: "plein-plein", label: "Plein / plein (départ plein, retour plein)" },
  { id: "meme-niveau", label: "Même niveau qu'au départ" },
  { id: "forfait", label: "Forfait carburant facturé au départ" },
];

export const MODES_DEPOT: ReadonlyArray<{ id: ModeDepot; label: string }> = [
  { id: "aucun", label: "Aucun dépôt de garantie" },
  { id: "cheque", label: "Chèque de caution non encaissé" },
  { id: "virement", label: "Virement / espèces (encaissé puis restitué)" },
  { id: "empreinte", label: "Empreinte de carte bancaire (pré-autorisation)" },
];

export const ZONES: ReadonlyArray<{ id: Zone; label: string }> = [
  { id: "france", label: "France métropolitaine uniquement" },
  { id: "ue", label: "France et Union européenne" },
  { id: "personnalisee", label: "Zone personnalisée (à préciser)" },
];

// ─── Modèle du formulaire ────────────────────────────────────────────────────

export type Partie = {
  nature: NaturePartie;
  denomination: string;
  nom: string;
  prenom: string;
  formeJuridique: string;
  capital: string;
  siren: string;
  tva: string;
  rcsVille: string;
  representant: string;
  qualite: string;
  adresse: string;
  cp: string;
  ville: string;
  tel: string;
  email: string;
  naissanceDate: string;
  naissanceLieu: string;
  pieceIdentite: string;
};

export type Conducteur = {
  nom: string;
  prenom: string;
  naissanceDate: string;
  permisNumero: string;
  permisCategorie: string;
  permisDate: string;
  permisAutorite: string;
};

export type Vehicule = {
  type: TypeVehicule;
  marque: string;
  modele: string;
  immatriculation: string;
  vin: string;
  premiereCirculation: string;
  energie: Energie;
  couleur: string;
  ptac: string;
  chargeUtile: string;
  hauteur: string;
  longueur: string;
  cylindree: string;
  placesCarteGrise: string;
  placesCouchage: string;
  kmDepart: string;
  niveauDepart: string;
  controleTechnique: string;
  permisRequis: string;
  cles: string;
  accessoires: string[];
  assureur: string;
  police: string;
};

export type LocationInfos = {
  reference: string;
  debutDate: string;
  debutHeure: string;
  finDate: string;
  finHeure: string;
  lieuDepart: string;
  lieuRestitution: string;
  zone: Zone;
  zoneTexte: string;
  usage: string;
};

export type BaremeLigne = { poste: string; montant: string };

export type Financier = {
  prixHT: string;
  tauxTva: string;
  prixTTC: string;
  modePaiement: string;
  politiqueKm: PolitiqueKm;
  kmInclus: string;
  prixKmSup: string;
  politiqueCarburant: PolitiqueCarburant;
  prixLitre: string;
  forfaitCarburant: string;
  /** Véhicule électrique : niveau de charge exigé à la restitution, en %. */
  chargeRestitution: string;
  depotMode: ModeDepot;
  depotMontant: string;
  depotDelaiJours: string;
  franchiseDommages: string;
  franchiseVol: string;
  rachatFranchise: string;
  retardTolerance: string;
  retardTarifHeure: string;
  retardTarifJour: string;
  fraisNettoyage: string;
  fraisDesignation: string;
  penalitesRetardPaiement: string;
};

export type Options = {
  animaux: boolean;
  tabac: boolean;
  remorquage: boolean;
  conduiteEtranger: boolean;
  transportMarchandises: boolean;
  /** Proposée UNIQUEMENT si `mode === "pro-pro"` : art. 48 CPC. */
  clauseAttributive: boolean;
  mediateurNom: string;
  mediateurUrl: string;
  /** C2C : référence de l'accord écrit de l'assureur du loueur particulier. */
  assuranceLoueurParticulier: string;
  /** AUCUN montant n'est pré-rempli : un barème chiffré par nos soins serait une
      valeur inventée, et un forfait sans rapport avec un préjudice réel est
      attaquable comme clause abusive (art. L212-1 C. consom.). */
  bareme: BaremeLigne[];
};

export type Formulaire = {
  mode: Mode;
  loueur: Partie;
  locataire: Partie;
  conducteurs: Conducteur[];
  vehicule: Vehicule;
  location: LocationInfos;
  financier: Financier;
  options: Options;
};

// ─── Formatage ───────────────────────────────────────────────────────────────

/**
 * Valeur saisie, ou pointillés à compléter à la main.
 *
 * `largeur` compte des CARACTÈRES imprimés, pas des caractères sources : on
 * répète « . » et non « … ». Le caractère de points de suspension occupe la
 * place de trois points ; avec la largeur par défaut de 18 il produisait des
 * lignes de 54 points qui faisaient exploser la mise en page des conditions
 * générales sur deux colonnes.
 */
export const val = (x: string | undefined, largeur = 18): string =>
  (x ?? "").trim() || ".".repeat(largeur);

/** Montant en euros, ou emplacement à remplir. Jamais de « 0 € » par défaut :
    un zéro imprimé est une stipulation, un blanc est une invitation à compléter. */
export const eur = (x: string | undefined): string =>
  (x ?? "").trim() ? `${(x ?? "").trim()} €` : "………… €";

/** Date ISO (`<input type="date">`) → date française en toutes lettres. */
export const dateFr = (iso: string | undefined): string => {
  if (!iso) return "…………………";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "…………………";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

/** Date + heure, pour les bornes de la location où l'heure est contractuelle. */
export const dateHeureFr = (iso: string | undefined, heure: string | undefined): string =>
  `${dateFr(iso)} à ${(heure ?? "").trim() || "……h……"}`;

/** Nom d'usage d'une partie : dénomination sociale ou « prénom nom ». */
export const nomPartie = (p: Partie, largeur = 24): string =>
  p.nature === "societe"
    ? val(p.denomination, largeur)
    : val(`${p.prenom} ${p.nom}`.trim(), largeur);

const libelle = <T extends string>(
  table: ReadonlyArray<{ id: T; label: string }>,
  id: T,
): string => table.find((x) => x.id === id)?.label ?? String(id);

export const libelleType = (t: TypeVehicule): string => libelle(TYPES_VEHICULE, t);
export const libelleMode = (m: Mode): string => libelle(MODES, m);
export const libelleEnergie = (e: Energie): string => libelle(ENERGIES, e);
/** Zone de circulation telle qu'elle doit être IMPRIMÉE.
 *
 *  La case « Conduite à l'étranger autorisée » et le sélecteur de zone sont deux
 *  réglages indépendants (voir C14). Le texte de C14 a été corrigé pour ne plus
 *  se contredire, mais le récapitulatif des conditions particulières appelle
 *  cette fonction DIRECTEMENT : sans la condition ci-dessous, la première page
 *  imprimait « France métropolitaine uniquement » pendant que les conditions
 *  générales du même contrat autorisaient la sortie du territoire. Corriger ici
 *  plutôt qu'au point d'appel garantit que les deux endroits disent la même
 *  chose, quel que soit le nombre de feuillets qui l'affichent un jour. */
export const libelleZone = (f: Formulaire): string =>
  f.options.conduiteEtranger && f.location.zone === "france"
    ? "À convenir par écrit avant le départ (sortie de France métropolitaine autorisée)"
    : f.location.zone === "personnalisee"
      ? val(f.location.zoneTexte, 30)
      : libelle(ZONES, f.location.zone);

/** Catégorie de permis rappelée au contrat : la saisie libre prime sur le
    rappel par défaut du type de véhicule (un utilitaire attelé peut exiger BE). */
export const permisRequis = (f: Formulaire): string =>
  f.vehicule.permisRequis.trim() ||
  TYPES_VEHICULE.find((t) => t.id === f.vehicule.type)?.permis ||
  "B";

// ─── Corpus de clauses ───────────────────────────────────────────────────────

export type Applicabilite = {
  modes: readonly Mode[];
  types?: readonly TypeVehicule[];
  si?: (f: Formulaire) => boolean;
};

/** Une clause = un intitulé, une base légale citée, et un texte INTERPOLÉ. */
export type Clause = {
  id: string;
  intitule: string;
  baseLegale: string;
  /** true = non décochable : le contrat serait juridiquement inutilisable sans. */
  obligatoire: boolean;
  applicabilite: Applicabilite;
  paragraphes: (f: Formulaire) => string[];
};

/**
 * Garde d'exhaustivité des modes. `Record<Mode, true>` est la SEULE construction
 * qui fasse ÉCHOUER LA COMPILATION (TS2741) quand un membre est ajouté à
 * l'union `Mode` : une annotation `readonly Mode[]` — et un `satisfies` — ne
 * vérifient que la VALIDITÉ des membres énumérés, jamais leur exhaustivité.
 * L'enjeu n'est pas cosmétique : une clause `modes: TOUS` privée d'un mode
 * disparaît EN SILENCE, et un mode absent de `TOUS` vide le contrat de ses 35
 * articles, dont les 21 obligatoires, sans lever la moindre erreur.
 */
const MODES_COUVERTS: Readonly<Record<Mode, true>> = {
  "pro-conso": true,
  "pro-pro": true,
  particuliers: true,
};

/** Tous les modes, DÉRIVÉS de la garde ci-dessus : plus aucune recopie de
    l'union à la main. Le cast ne fait que rendre à `Object.keys` le typage que
    TypeScript ne sait pas lui donner — les clés sont celles d'un `Record<Mode>`,
    donc exactement les membres de `Mode`, ni plus ni moins. */
const TOUS: readonly Mode[] = Object.keys(MODES_COUVERTS) as Mode[];

/**
 * ORDRE = ordre de numérotation des articles. Les identifiants C01→C35 sont
 * STABLES : ils servent de clé au stockage des clauses décochées
 * (`localStorage`), donc réordonner la liste est sans danger, la renommer non.
 */
export const CLAUSES: readonly Clause[] = [
  {
    id: "C01",
    intitule: "Identification des parties",
    baseLegale:
      "Art. 1709 et 1714 C. civ. ; art. L111-1 C. consom. ; art. L441-9 C. com. ; art. 2288 C. civ.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => [
      `Le présent contrat est conclu entre le Loueur, ${nomPartie(f.loueur)}${
        f.loueur.nature === "societe" && f.loueur.formeJuridique.trim()
          ? `, ${f.loueur.formeJuridique.trim()}${f.loueur.capital.trim() ? ` au capital de ${eur(f.loueur.capital)}` : ""}`
          : ""
      }, dont le siège social ou le domicile est situé ${val(f.loueur.adresse, 28)}, ${val(f.loueur.cp, 5)} ${val(f.loueur.ville, 14)}${
        f.loueur.siren.trim()
          ? `, immatriculé au registre du commerce et des sociétés de ${val(f.loueur.rcsVille, 10)} sous le numéro ${f.loueur.siren.trim()}`
          : ""
      }${f.loueur.tva.trim() ? `, numéro de TVA intracommunautaire ${f.loueur.tva.trim()}` : ""}, téléphone ${val(f.loueur.tel, 12)}, adresse électronique ${val(f.loueur.email, 20)}${
        f.loueur.representant.trim()
          ? `, représenté par ${f.loueur.representant.trim()}, ${val(f.loueur.qualite, 12)}`
          : ""
      }, ci-après « le Loueur »,`,
      `et le Locataire, ${nomPartie(f.locataire)}, né(e) le ${val(f.locataire.naissanceDate, 10)} à ${val(f.locataire.naissanceLieu, 12)}, demeurant ou dont le siège est situé ${val(f.locataire.adresse, 28)}, ${val(f.locataire.cp, 5)} ${val(f.locataire.ville, 14)}, téléphone ${val(f.locataire.tel, 12)}, adresse électronique ${val(f.locataire.email, 20)}${
        f.locataire.siren.trim() ? `, immatriculé sous le numéro ${f.locataire.siren.trim()}` : ""
      }${f.locataire.pieceIdentite.trim() ? `, titulaire de la pièce d'identité n° ${f.locataire.pieceIdentite.trim()} présentée et vérifiée à la signature` : ""}, ci-après « le Locataire ».`,
      "Le Locataire déclare que les informations qu'il communique sont exactes et s'engage à signaler au Loueur tout changement d'adresse ou de coordonnées survenant pendant la durée de la location.",
      "Lorsque le Locataire est une personne morale, la personne qui signe déclare disposer du pouvoir de l'engager ; elle ne contracte pas à titre personnel et n'est pas tenue solidairement des obligations du Locataire, sauf engagement de caution distinct et exprès conforme aux articles 2288 et suivants du Code civil.",
    ],
  },
  {
    id: "C02",
    intitule: "Objet, nature et qualification du contrat",
    baseLegale: "Art. 1708, 1709 et 1714 C. civ. ; a contrario art. L312-1 et s. C. consom.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: () => [
      "Le Loueur donne en location au Locataire, qui l'accepte, le véhicule désigné à l'article suivant, à l'exclusion de tout transfert de propriété. Le présent contrat est un contrat de louage de choses au sens des articles 1708 et suivants du Code civil. Il est conclu sans chauffeur et sans option d'achat : il ne constitue ni une location avec option d'achat, ni une location-vente, ni une opération de crédit au sens des articles L312-1 et suivants du Code de la consommation.",
      "Le Locataire n'acquiert aucun droit de propriété sur le véhicule. Il s'interdit de le vendre, de le gager, de le nantir, de le donner en garantie ou de le laisser saisir, et s'oblige à informer sans délai le Loueur de toute mesure conservatoire ou d'exécution portant sur le véhicule.",
    ],
  },
  {
    id: "C03",
    intitule: "Désignation du véhicule et des équipements",
    baseLegale: "Art. 1719 1° et 1720 C. civ. (délivrance et bon état) ; art. R322-1 C. route",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      const v = f.vehicule;
      const specifiques: string[] = [];
      if (v.type === "utilitaire" || v.type === "camion" || v.type === "camping-car") {
        specifiques.push(
          `hauteur hors tout ${val(v.hauteur, 6)} m`,
          `charge utile ${val(v.chargeUtile, 6)} kg`,
        );
      }
      if (v.type === "camion" || v.type === "camping-car") specifiques.push(`PTAC ${val(v.ptac, 6)} kg`);
      if (v.type === "camping-car") specifiques.push(`${val(v.placesCouchage, 2)} place(s) de couchage`);
      if (v.type === "moto") specifiques.push(`cylindrée ${val(v.cylindree, 5)} cm³`);
      return [
        `Le véhicule loué est un ${libelleType(v.type).toLowerCase()} de marque ${val(v.marque, 10)}, modèle ${val(v.modele, 14)}, immatriculé ${val(v.immatriculation, 9)}, numéro d'identification (VIN) ${val(v.vin, 17)}, de couleur ${val(v.couleur, 8)}, à énergie ${libelleEnergie(v.energie).toLowerCase()}, mis en circulation pour la première fois le ${val(v.premiereCirculation, 10)}, comportant ${val(v.placesCarteGrise, 2)} place(s) assise(s) au certificat d'immatriculation${specifiques.length ? `, ${specifiques.join(", ")}` : ""}.`,
        `Le véhicule est remis avec ${val(v.cles, 1)} clé(s) ou badge(s) et les documents de bord réglementaires. Prochain contrôle technique : ${val(v.controleTechnique, 10)}. Équipements et accessoires remis avec le véhicule : ${v.accessoires.length ? v.accessoires.join(", ") : "………………………………………………………………………"}.`,
        "La désignation ci-dessus et la fiche d'état des lieux de départ annexée forment ensemble la description contractuelle du véhicule. Le Loueur est tenu de le délivrer en bon état de réparations de toute espèce et en état de servir à l'usage convenu ; le Locataire s'oblige à le restituer dans l'état décrit à la fiche de départ, sous réserve de ce qui a péri ou s'est dégradé par vétusté, usure normale ou force majeure.",
      ];
    },
  },
  {
    id: "C04",
    intitule: "Conducteur principal et conducteurs autorisés",
    baseLegale:
      "Art. L221-2 et L223-1 C. route ; art. R211-10 C. assur. ; art. 1735 C. civ.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      const noms = f.conducteurs
        .map((c) => `${c.prenom} ${c.nom}`.trim())
        .filter((n) => n.length > 0);
      return [
        `Le véhicule ne peut être conduit que par le Locataire et par les conducteurs additionnels expressément désignés aux conditions particulières${noms.length ? ` : ${noms.join(", ")}` : ""}. Toute autre personne au volant est un conducteur non autorisé, y compris à titre gratuit et occasionnel.`,
        `Chaque conducteur doit être titulaire d'un permis de conduire de la catégorie ${permisRequis(f)} en cours de validité, présenté et vérifié avant la remise du véhicule, et satisfaire aux conditions d'âge et d'ancienneté de permis portées à la connaissance du Locataire avant la conclusion du contrat. La conduite sans permis valide constitue un délit puni par l'article L221-2 du Code de la route.`,
        "Le Locataire est informé que, conformément à l'article R211-10 du Code des assurances, l'assureur peut opposer une exclusion de garantie lorsque, au moment du sinistre, le conducteur n'a pas l'âge requis ou ne possède pas les certificats en état de validité exigés pour la conduite du véhicule. Le Locataire répond des personnes dont il répond et des conducteurs qu'il laisse prendre le volant.",
      ];
    },
  },
  {
    id: "C05",
    intitule: "Durée, prorogation expresse et restitution anticipée",
    baseLegale: "Art. 1736 et 1737 C. civ.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => [
      `La location est consentie pour une durée déterminée, du ${dateHeureFr(f.location.debutDate, f.location.debutHeure)} au ${dateHeureFr(f.location.finDate, f.location.finHeure)}. Le véhicule est remis à ${val(f.location.lieuDepart, 24)} et doit être restitué à ${val(f.location.lieuRestitution, 24)}, aux jours et heures convenus.`,
      "Conformément à l'article 1737 du Code civil, le contrat cesse de plein droit à l'expiration du terme, sans qu'aucun congé soit nécessaire. Toute prolongation doit faire l'objet d'un accord exprès et préalable du Loueur, formalisé par écrit ou par tout moyen laissant une trace ; à défaut, le maintien du véhicule au-delà du terme n'emporte aucune reconduction du contrat et constitue une détention sans droit ni titre, indemnisée dans les conditions de l'article relatif au retard de restitution.",
      "Le Locataire peut restituer le véhicule avant le terme convenu. La restitution anticipée n'ouvre droit à remboursement que dans la mesure où le prix a été calculé par unité de temps effectivement consommée ; le Loueur ne peut retenir de somme correspondant à une prestation non exécutée sans contrepartie. Le Loueur peut, dans les mêmes conditions, exiger la restitution anticipée en cas de manquement grave du Locataire, dans les termes de l'article relatif à la résiliation.",
    ],
  },
  {
    id: "C06",
    intitule: "Prix, paiement et facturation",
    baseLegale:
      "Art. 1728 2° C. civ. ; art. L112-1 C. consom. ; art. L441-9 et L441-10 C. com. (entre professionnels)",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      const p: string[] = [
        `Le prix de la location est fixé à ${eur(f.financier.prixHT)} hors taxes, soit ${eur(f.financier.prixTTC)} toutes taxes comprises au taux de TVA de ${val(f.financier.tauxTva, 4)} %. Ce prix couvre la mise à disposition du véhicule pour la durée et dans les conditions stipulées au présent contrat, à l'exclusion des sommes facturées séparément et énumérées ci-après.`,
        `Le paiement s'effectue par ${val(f.financier.modePaiement, 16)}. Sont facturés en sus, s'il y a lieu et sur justificatif : les kilomètres supplémentaires, le carburant ou l'énergie manquants, les frais de nettoyage spécial, les frais de traitement des contraventions, les péages et frais de stationnement, la remise en état des dommages non couverts, et les indemnités de retard de restitution.`,
      ];
      if (f.mode === "pro-pro") {
        p.push(
          `Le délai de paiement convenu ne peut excéder les plafonds de l'article L441-10 I du Code de commerce. Toute somme non réglée à l'échéance porte de plein droit, sans mise en demeure préalable, des pénalités de retard au taux de ${val(f.financier.penalitesRetardPaiement, 5)} % ainsi qu'une indemnité forfaitaire pour frais de recouvrement de 40 euros, conformément à l'article L441-10 II du Code de commerce et à l'article D441-5 du même code. Lorsque les frais de recouvrement exposés sont supérieurs à ce montant forfaitaire, le Loueur peut demander une indemnisation complémentaire sur justification.`,
        );
      } else {
        p.push(
          "Aucune somme ne peut être prélevée ou facturée au Locataire sans que la prestation correspondante ait été effectivement fournie et que son montant lui ait été communiqué. Le Loueur remet au Locataire une facture détaillée poste par poste.",
        );
      }
      return p;
    },
  },
  {
    id: "C07",
    intitule: "État des lieux contradictoire de départ et de retour",
    baseLegale:
      // Points VÉRIFIÉS sur le texte de la recommandation : 5 = clause faisant
      // reconnaître un « bon état » sans réserve des défauts non apparents ;
      // 43 = constat non contradictoire rendu opposable au locataire et remise
      // en état sur la seule estimation du bailleur. (Le point 21, cité par
      // erreur auparavant, porte sur les demandes en dommages-intérêts.)
      "Art. 1730, 1731 et 1732 C. civ. ; recommandation CCA n° 96-02, points 5 et 43",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: () => [
      "Un état des lieux contradictoire est établi au départ et au retour du véhicule, en présence des deux parties, sur les fiches annexées au présent contrat. Chaque fiche est remplie avant signature, discutée, signée par les deux parties, et un exemplaire en est immédiatement remis au Locataire.",
      "Conformément à l'article 1730 du Code civil, le Locataire doit rendre le véhicule tel qu'il l'a reçu suivant l'état des lieux de départ, excepté ce qui a péri ou a été dégradé par vétusté, usure normale ou force majeure. Le Locataire dispose d'un espace d'observations libres sur chaque fiche ; il n'est pas réputé avoir accepté un état qu'il n'a pas pu constater, et la signature de la fiche de départ ne vaut pas reconnaissance du bon état des éléments non apparents ou non vérifiables au moment de la remise.",
      "Lorsque la restitution intervient hors la présence du Loueur, ou hors la présence du Locataire, la partie absente en est informée sans délai et le constat lui est communiqué par écrit avec les photographies horodatées correspondantes, en l'invitant à venir contradictoirement constater. Un dommage constaté hors la présence du Locataire et sans cette information ne peut lui être imputé.",
      "Les photographies prises au départ et au retour, datées et référencées à la fiche correspondante, font partie de l'état des lieux et sont annexées au contrat.",
    ],
  },
  {
    id: "C08",
    intitule: "Kilométrage inclus et kilomètres supplémentaires",
    baseLegale: "Art. L112-1 C. consom. ; annexe A de l'arrêté du 17 mars 2015",
    obligatoire: false,
    applicabilite: { modes: TOUS, si: (f) => f.financier.politiqueKm === "forfait" },
    paragraphes: (f) => [
      `La location comprend un forfait de ${val(f.financier.kmInclus, 6)} kilomètres pour la durée convenue. Au-delà de ce forfait, chaque kilomètre supplémentaire est facturé ${eur(f.financier.prixKmSup)}.`,
      "Le kilométrage est relevé au compteur du véhicule au départ et au retour, contradictoirement, et reporté sur les fiches d'état des lieux. Le relevé de départ est photographié. Toute intervention sur le compteur kilométrique ou toute circulation avec un compteur inopérant non signalé au Loueur constitue un manquement grave.",
    ],
  },
  {
    id: "C09",
    intitule: "Carburant, énergie et niveau de restitution",
    // L'annexe A de l'arrêté du 17 mars 2015 n'est pas numérotée en degrés :
    // elle comporte trois rubriques (1. Prix et conditions de la prestation
    // principale, a) à g) ; 2. Assurances, a) à c) ; 3. Autres prestations
    // annexes, a) à b)). Le carburant relève de la rubrique 1. c).
    baseLegale: "Art. 1728 1° C. civ. ; annexe A, 1. c) de l'arrêté du 17 mars 2015",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      // Table INDEXÉE plutôt que cascade de ternaires : la branche finale d'une
      // cascade est une hypothèse non gardée (elle absorbe silencieusement toute
      // politique ajoutée demain et lui applique le texte du forfait). Un
      // `Record<PolitiqueCarburant, string>` fait échouer la compilation à
      // l'ajout d'un membre, ici, au lieu de laisser passer une clause fausse.
      const regles: Readonly<Record<PolitiqueCarburant, string>> = {
        "plein-plein":
          "Le véhicule est remis avec le plein d'énergie et doit être restitué avec le plein d'énergie, justificatif d'approvisionnement à l'appui.",
        "meme-niveau":
          "Le véhicule doit être restitué avec le même niveau d'énergie qu'au départ, tel que relevé et reporté sur la fiche d'état des lieux de départ.",
        forfait: `Un forfait d'énergie de ${eur(f.financier.forfaitCarburant)} est facturé au départ ; le véhicule peut alors être restitué à niveau libre, sans remboursement de l'énergie non consommée.`,
      };
      const regle = regles[f.financier.politiqueCarburant];
      // La refacturation de l'énergie manquante n'a de sens QUE si un niveau de
      // restitution est exigé. Sous forfait, la phrase précédente autorise la
      // restitution « à niveau libre » : y accoler « l'énergie manquante est
      // facturée » faisait se contredire le même article, dans le même bloc, sur
      // un document destiné à être signé. Une clause contradictoire s'interprète
      // contre celui qui l'a rédigée (art. 1190 du Code civil) — et ici c'est le
      // Loueur. La contrepartie du forfait est justement l'absence de relevé.
      const refacturation =
        f.financier.politiqueCarburant === "forfait"
          ? ""
          : ` L'énergie manquante est facturée au prix de ${eur(f.financier.prixLitre)} par litre ou par kilowattheure, sur la base du niveau constaté au retour. Ce prix est celui porté au contrat ; aucun coefficient ni frais de service n'est appliqué en sus sans stipulation expresse.`;
      return [
        `${regle}${refacturation}`,
        `Le Locataire fait son affaire du choix de l'énergie appropriée. Toute erreur de carburant, tout mélange et leurs conséquences (vidange, dépose du réservoir, remorquage, immobilisation) sont à sa charge, sauf si l'erreur résulte d'une indication erronée du Loueur ou d'un défaut de signalisation du véhicule. Le véhicule fonctionne à l'énergie suivante : ${libelleEnergie(f.vehicule.energie).toLowerCase()}.`,
      ];
    },
  },
  {
    id: "C10",
    intitule: "Dépôt de garantie et restitution",
    baseLegale:
      // Points VÉRIFIÉS : 7 = appropriation du dépôt sans mention du montant ni
      // motifs limitativement énumérés ; 44 = remboursement au-delà de huit
      // jours après la fin de la location. (Les points 14 à 17, cités par
      // erreur auparavant, portent sur l'usure, les contraventions et la
      // solidarité d'un conducteur agréé.) R212-1 5° visait l'exception
      // d'inexécution, sans rapport avec le dépôt : seul R212-2 3° est retenu.
      "Art. R212-2 3° C. consom. ; recommandation CCA n° 96-02, points 7 et 44",
    obligatoire: false,
    applicabilite: { modes: TOUS, si: (f) => f.financier.depotMode !== "aucun" },
    paragraphes: (f) => {
      // Table typée sur `Exclude<ModeDepot, "aucun">` et NON sur `ModeDepot` :
      // la garde `si` ci-dessus exclut déjà « aucun », lui écrire une phrase
      // réintroduirait du texte que le contrat ne peut pas contenir. Le repli
      // sur la chaîne vide n'existe que pour le typage, il est inatteignable ;
      // en revanche l'ajout d'un mode de dépôt casse la compilation ICI, au lieu
      // de retomber sur le texte « empreinte de carte bancaire » comme le
      // faisait la cascade de ternaires.
      const textesDepot: Readonly<Record<Exclude<ModeDepot, "aucun">, string>> = {
        cheque:
          "sous forme d'un chèque de caution non encaissé, conservé par le Loueur et restitué au Locataire",
        virement: "par virement ou en espèces, encaissé par le Loueur et remboursé au Locataire",
        empreinte:
          "sous forme d'une empreinte de carte bancaire, c'est-à-dire d'une pré-autorisation non débitée, libérée par le Loueur",
      };
      const modeTexte =
        f.financier.depotMode === "aucun" ? "" : textesDepot[f.financier.depotMode];
      return [
        `Un dépôt de garantie de ${eur(f.financier.depotMontant)} est constitué ${modeTexte} au plus tard ${val(f.financier.depotDelaiJours, 2)} jours après la restitution du véhicule et l'établissement de la fiche d'état des lieux de retour.`,
        "Le dépôt de garantie garantit l'exécution des obligations du Locataire. Le Loueur ne peut en retenir tout ou partie qu'à raison de sommes effectivement dues, justifiées et chiffrées, portées à la connaissance du Locataire par écrit avec le détail des postes retenus et les pièces correspondantes. Aucune retenue ne peut être opérée à titre forfaitaire ou provisionnel sans justification. Le solde est restitué dans le délai ci-dessus.",
        "Le dépôt de garantie n'est ni une avance sur loyers, ni une franchise, ni un plafond, ni une limitation de la responsabilité du Locataire : il ne préjuge ni de l'existence ni du montant d'un dommage. Il peut en revanche servir à imputer les sommes dues par le Locataire, y compris la franchise d'assurance restée à sa charge, dans les conditions et avec les justificatifs ci-dessus.",
      ];
    },
  },
  {
    id: "C11",
    intitule: "Assurance, garanties et franchises",
    // Assurances = rubrique 2 de l'annexe A de l'arrêté du 17 mars 2015 (pas de
    // « 8° » : l'annexe n'est pas numérotée en degrés).
    baseLegale:
      "Art. L211-1, L211-7-1, R211-10 et R211-13 C. assur. ; annexe A, 2. de l'arrêté du 17 mars 2015",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      const p: string[] = [
        `Le véhicule est assuré au titre de la responsabilité civile obligatoire prévue à l'article L211-1 du Code des assurances auprès de ${val(f.vehicule.assureur, 16)}, police n° ${val(f.vehicule.police, 12)}. Conformément à l'article L211-1, cette garantie couvre la responsabilité civile de toute personne ayant la garde ou la conduite du véhicule, y compris lorsque cette personne n'était pas autorisée à le conduire ; les exclusions applicables au conducteur non autorisé ne jouent que dans les rapports entre le Loueur et son assureur et ouvrent un recours contre le Locataire. Depuis le 1er avril 2024, la carte verte et la vignette d'assurance sont supprimées : la preuve de l'assurance résulte du fichier des véhicules assurés, consultable par les forces de l'ordre.`,
        `Les garanties facultatives souscrites, leur étendue, leurs exclusions et leurs franchises sont portées aux conditions particulières. La franchise applicable aux dommages est de ${eur(f.financier.franchiseDommages)} et la franchise applicable au vol de ${eur(f.financier.franchiseVol)}. ${
          f.financier.rachatFranchise.trim()
            ? `Un rachat partiel ou total de franchise est proposé au prix de ${eur(f.financier.rachatFranchise)} ; il ne couvre que les événements garantis et ne s'applique pas aux exclusions ci-après.`
            : "Aucun rachat de franchise n'est souscrit au présent contrat."
        }`,
        // Le renvoi nominatif « prévus à l'article relatif au dépôt de garantie »
        // était MORT dans toutes les configurations sans dépôt (« aucun » est le
        // défaut) et dans celles où l'utilisateur décoche C10 : le contrat signé
        // renvoyait à un article absent. La phrase est hypothétique (« lorsqu'il
        // en a été constitué un ») et la franchise reste due au titre de la
        // phrase précédente : supprimer le renvoi ne retire aucune protection,
        // et on n'ajoute PAS de branche alternative, qui créerait une obligation
        // de communication préalable absente du corpus validé.
        "En cas de sinistre garanti, le Locataire supporte la franchise contractuelle, dans la limite du montant stipulé ci-dessus et par événement. Cette somme peut être imputée sur le dépôt de garantie lorsqu'il en a été constitué un, dans les conditions et avec les justificatifs prévus au présent contrat. La franchise est la part du dommage que l'assureur ne prend pas en charge ; le dépôt de garantie n'est ni une franchise, ni un plafond d'indemnisation. Aucune franchise n'est due lorsque le sinistre est intégralement imputable à un tiers identifié et que le recours du Loueur aboutit ; dans ce cas, la somme retenue est restituée au Locataire dès l'issue du recours.",
        "Le Locataire est informé que les nullités du contrat d'assurance ne sont pas opposables aux victimes (art. L211-7-1 du Code des assurances), pas plus que les franchises, déchéances et exclusions mentionnées à l'article R211-13 du même code. Dans tous ces cas, l'assureur indemnise la victime, puis exerce son recours subrogatoire contre le responsable. Ce recours peut donc être dirigé contre le Locataire ou le conducteur fautif, pour la totalité des sommes versées, indépendamment de toute franchise.",
      ];
      return p;
    },
  },
  {
    id: "C12",
    intitule: "Sinistre, vol, panne, assistance et immobilisation",
    baseLegale: "Art. 1719 3° et 1721 C. civ. ; art. L113-2 2° C. assur.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      const p: string[] = [
        "En cas d'accident, même sans tiers identifié, le Locataire établit un constat amiable sur place, relève l'identité et l'assurance des personnes impliquées ainsi que les coordonnées des témoins, et en informe le Loueur immédiatement, puis par écrit dans les cinq jours ouvrés. En cas de vol, de tentative de vol, d'incendie ou de dégradation volontaire, il dépose plainte sans délai, remet le récépissé au Loueur et lui restitue les clés du véhicule.",
        "Le Locataire ne peut ni reconnaître de responsabilité au nom du Loueur, ni faire procéder à des réparations sans l'accord préalable de celui-ci, sauf réparation d'urgence nécessaire à la sécurité, dont il conserve les justificatifs et dont il est remboursé sur présentation de la facture.",
        "En cas de panne ou d'immobilisation qui n'est pas imputable au Locataire, le Loueur, tenu de faire jouir paisiblement le Locataire du véhicule pendant la durée du bail, met en œuvre l'assistance et propose une solution de remplacement ou, à défaut, la réduction du prix à proportion de la période d'indisponibilité, conformément aux articles 1719 et 1722 du Code civil. Le Locataire ne supporte pas le coût des réparations rendues nécessaires par l'usure ou par un vice du véhicule.",
      ];
      if (f.options.remorquage) {
        p.push(
          "Le remorquage et l'assistance sont assurés selon les modalités portées aux conditions particulières. Le remorquage rendu nécessaire par une faute du Locataire, notamment une erreur de carburant, une panne d'énergie, un enlisement ou le franchissement d'un obstacle de hauteur, reste à sa charge.",
        );
      }
      return p;
    },
  },
  {
    id: "C13",
    intitule: "Usage autorisé du véhicule",
    baseLegale: "Art. 1728 1° C. civ. ; recommandation CCA n° 96-02, point 8",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => [
      `Le véhicule est destiné à un usage normal de circulation routière sur voies ouvertes à la circulation publique, dans le respect du Code de la route, des limitations de charge et de gabarit du véhicule et de sa notice d'utilisation. L'usage convenu est le suivant : ${val(f.location.usage, 30)}.`,
      "Sont exclus de l'usage convenu, parce qu'ils excèdent la destination ci-dessus : le transport de personnes ou de marchandises à titre onéreux lorsqu'il n'a pas été expressément stipulé, l'apprentissage de la conduite hors autorisation écrite, la participation à des compétitions, essais, rallyes ou entraînements, la circulation hors des voies ouvertes à la circulation publique et sur pistes non carrossables, la surcharge au-delà du poids total autorisé, le remorquage ou le poussage d'un autre véhicule hors dispositif d'attelage homologué, et le transport de matières inflammables, explosives, corrosives ou dangereuses.",
      "L'énumération qui précède éclaire la destination convenue ; elle ne dispense pas le Loueur d'établir en quoi l'usage reproché a effectivement excédé cette destination et a causé le dommage invoqué.",
    ],
  },
  {
    id: "C14",
    intitule: "Zone géographique de circulation",
    baseLegale: "Art. 1728 1° C. civ. ; art. L211-4 C. assur. (étendue territoriale de la garantie)",
    obligatoire: false,
    applicabilite: { modes: TOUS, si: (f) => f.location.zone !== "france" || f.options.conduiteEtranger },
    paragraphes: (f) => [
      // La case « Conduite à l'étranger autorisée » et le sélecteur de zone sont
      // DEUX réglages indépendants. Cocher la première en laissant la zone sur
      // « france » (le défaut) déclenchait cet article et lui faisait écrire
      // « ne peut circuler que dans la zone suivante : France métropolitaine
      // uniquement » — le contrat disait donc le contraire de la case cochée.
      // On ne recale surtout PAS `zone` depuis la case : ce serait une mutation
      // d'état invisible pour l'utilisateur, et « ue » serait faux pour la
      // Suisse, le Royaume-Uni, le Maroc ou Andorre. On écrit la phrase qui
      // correspond réellement à l'état saisi, et on renvoie la délimitation à
      // l'écrit préalable, seul support qui puisse être exact.
      f.options.conduiteEtranger && f.location.zone === "france"
        ? "La conduite hors de France métropolitaine est autorisée dans son principe. La zone exacte de circulation et les pays traversés sont convenus par écrit entre les parties, préalablement au départ ; à défaut d'écrit avant le départ, la zone autorisée est la France métropolitaine."
        : `Le véhicule ne peut circuler que dans la zone suivante : ${libelleZone(f)}. Toute sortie de cette zone doit être autorisée par écrit par le Loueur, préalablement au départ.`,
      "La circulation hors de la zone convenue peut priver le Locataire du bénéfice de certaines garanties d'assurance et de l'assistance, et engage sa responsabilité pour l'ensemble des conséquences qui en résultent, y compris les frais de rapatriement du véhicule. Le Loueur remet au Locataire les justificatifs nécessaires à la circulation à l'étranger.",
    ],
  },
  {
    id: "C15",
    intitule: "Interdiction de sous-location et de cession",
    baseLegale: "Art. 1717 C. civ.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: () => [
      "Par dérogation expresse à l'article 1717 du Code civil, qui autorise le preneur à sous-louer et à céder son bail lorsque cette faculté ne lui a pas été interdite, le Locataire s'interdit de sous-louer le véhicule, de céder le présent contrat, de le mettre à disposition d'un tiers à titre onéreux ou gratuit, et d'en confier la conduite à une personne non désignée aux conditions particulières.",
      "Cette interdiction est stipulée expressément parce qu'elle ne se présume pas. Sa méconnaissance constitue un manquement grave autorisant la résiliation de plein droit et la reprise immédiate du véhicule.",
    ],
  },
  {
    id: "C16",
    intitule: "Entretien, réparations et obligations du Loueur",
    baseLegale: "Art. 1719, 1720, 1721 et 1722 C. civ. ; art. 1170 C. civ.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: () => [
      "Le Loueur est tenu de délivrer le véhicule en bon état de réparations de toute espèce, de l'entretenir en état de servir à l'usage convenu, et d'en faire jouir paisiblement le Locataire pendant la durée du bail. Il garantit le Locataire contre les vices et défauts qui en empêchent l'usage, même s'il ne les connaissait pas lors de la conclusion du contrat, et l'indemnise du préjudice qui en résulte.",
      "Le Locataire assure la surveillance courante du véhicule : contrôle des niveaux, de la pression des pneumatiques, réaction immédiate à l'allumage d'un voyant d'alerte. Il ne poursuit pas la circulation lorsqu'un voyant impose l'arrêt. Les réparations et remplacements rendus nécessaires par l'usure normale, la vétusté ou un vice du véhicule sont à la charge du Loueur ; ceux rendus nécessaires par une faute du Locataire sont à sa charge.",
      "Toute clause qui exonérerait le Loueur de son obligation essentielle de délivrance conforme serait réputée non écrite en application de l'article 1170 du Code civil.",
    ],
  },
  {
    id: "C17",
    intitule: "Contraventions et désignation du conducteur",
    baseLegale: "Art. L121-2, L121-3, L121-6 et L130-9 C. route ; art. 529-10 CPP",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    // Le discriminant n'est PAS le mode de location mais la NATURE du titulaire
    // du certificat d'immatriculation. L'article L121-6 ne vise que les
    // personnes morales : la Cour de cassation en a écarté à plusieurs reprises
    // l'entrepreneur individuel exerçant en nom propre comme le professionnel
    // libéral. Étendre l'obligation à tout « professionnel » ferait croire à un
    // loueur en entreprise individuelle qu'il est pénalement tenu de désigner,
    // et fournirait au contrat un fondement de refacturation sans objet.
    paragraphes: (f) => [
      "Le Locataire supporte les conséquences pécuniaires et administratives de toutes les infractions commises pendant la durée de la location, à compter de la remise du véhicule et jusqu'à sa restitution effective, ainsi que des consignations et immobilisations qui en découlent.",
      f.loueur.nature === "societe"
        ? `Le Loueur étant une personne morale titulaire du certificat d'immatriculation, son représentant légal est tenu, pour les infractions constatées selon les modalités de l'article L130-9 du Code de la route (contrôle automatisé, sans interception du conducteur), de désigner le conducteur dans le délai de quarante-cinq jours prévu à l'article L121-6 du même code, à peine de l'amende prévue pour les contraventions de la quatrième classe. Pour les autres infractions, notamment celles relevées avec interception ou en matière de stationnement, le Loueur reste redevable pécuniairement sur le fondement des articles L121-2 et L121-3 et s'exonère par la requête en exonération de l'article 529-10 du Code de procédure pénale. Dans tous les cas, le Locataire autorise expressément la désignation et communique sans délai au Loueur l'identité, l'adresse et la référence du permis du conducteur. Des frais de traitement de ${eur(f.financier.fraisDesignation)} par avis peuvent être facturés au Locataire, à condition de correspondre au coût réel du traitement et non à une pénalité.`
        : `Le Loueur, personne physique titulaire du certificat d'immatriculation — qu'il loue à titre professionnel en entreprise individuelle ou en profession libérale, ou à titre privé —, n'entre pas dans le champ de l'article L121-6 du Code de la route, qui ne vise que les personnes morales : aucune obligation pénale de désignation ne pèse donc sur lui. Il demeure en revanche redevable pécuniairement des amendes encourues sur le fondement des articles L121-2 et L121-3 du Code de la route. Pour s'en exonérer, il transmet à l'autorité compétente, dans le cadre de la requête en exonération prévue à l'article 529-10 du Code de procédure pénale, l'identité et l'adresse du conducteur ainsi que la référence de son permis de conduire. Le Locataire l'y autorise expressément et lui communique sans délai les informations nécessaires. Des frais de traitement de ${eur(f.financier.fraisDesignation)} par avis peuvent être facturés au Locataire, à condition de correspondre au coût réel du traitement et non à une pénalité.`,
      "Le Loueur informe le Locataire de chaque avis reçu et lui en communique une copie, afin qu'il puisse exercer ses droits, notamment le droit de contester l'infraction.",
    ],
  },
  {
    id: "C18",
    intitule: "Péages, stationnement et frais accessoires",
    baseLegale: "Art. 1728 2° C. civ.",
    obligatoire: false,
    applicabilite: { modes: TOUS },
    paragraphes: () => [
      "Les péages, frais de stationnement, frais de fourrière, taxes de circulation et frais d'accès aux zones réglementées engagés pendant la durée de la location sont à la charge du Locataire. Lorsqu'un badge de télépéage est remis avec le véhicule, il est mentionné à la fiche d'état des lieux ; les passages effectués sont refacturés au Locataire sur relevé détaillé, au tarif du concessionnaire, sans majoration autre que les frais de traitement stipulés au contrat.",
    ],
  },
  {
    id: "C19",
    intitule: "Retard de restitution et indemnité",
    baseLegale: "Art. 1231-5 C. civ. (clause pénale) ; art. R212-2 3° C. consom.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => [
      `Le véhicule doit être restitué au lieu, au jour et à l'heure convenus. Une tolérance de ${val(f.financier.retardTolerance, 3)} minutes est accordée. Au-delà, chaque heure entamée est facturée ${eur(f.financier.retardTarifHeure)} et chaque journée entamée ${eur(f.financier.retardTarifJour)}, sans que le total puisse excéder le préjudice réellement subi par le Loueur.`,
      "Cette indemnité constitue une clause pénale au sens de l'article 1231-5 du Code civil : elle peut être modérée par le juge si elle est manifestement excessive, et augmentée si elle est dérisoire. Réciproquement, lorsque le Loueur ne met pas le véhicule à disposition à la date et à l'heure convenues, le Locataire peut prétendre à une indemnité équivalente.",
      "Le défaut de restitution du véhicule à l'expiration du contrat, malgré une mise en demeure restée sans effet, autorise le Loueur à en exiger la restitution immédiate et à engager toute action utile.",
    ],
  },
  {
    id: "C20",
    intitule: "Dommages, remise en état et barème",
    baseLegale:
      // Point 43 (constat non contradictoire opposable, remise en état sur la
      // seule estimation du bailleur) : c'est le seul point de la
      // recommandation qui porte sur l'objet de cette clause. Les points 20 à
      // 24, cités auparavant, visent la réparation imposée au garage du loueur,
      // les exonérations du loueur et la facturation forfaitaire au compteur.
      "Art. 1730 et 1732 C. civ. ; art. 1353 C. civ. ; art. L212-1 C. consom. ; recommandation CCA n° 96-02, point 43",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      const p: string[] = [
        "Les dommages constatés au retour et absents de la fiche d'état des lieux de départ sont réputés survenus pendant la location. Le Locataire en répond, à moins qu'il ne prouve qu'ils ont eu lieu sans sa faute. Les dégradations résultant de la vétusté, de l'usure normale ou de la force majeure ne peuvent lui être facturées.",
        "La remise en état est facturée sur la base du coût réel de la réparation, justifié par un devis détaillé ou une facture communiquée au Locataire. Le Loueur ne peut facturer une réparation qu'il ne fait pas exécuter que dans la limite de la dépréciation effectivement subie par le véhicule, qu'il lui appartient d'établir.",
      ];
      if (f.options.bareme.length > 0) {
        p.push(
          "Un barème indicatif de remise en état est annexé au présent contrat et porté à la connaissance du Locataire avant sa signature. Ce barème est indicatif : il ne dispense pas le Loueur de justifier du coût réellement exposé, et le Locataire conserve le droit d'en discuter le montant. Un barème communiqué après la signature, ou seulement « consultable sur demande », est inopposable.",
        );
      }
      return p;
    },
  },
  {
    id: "C21",
    intitule: "Propreté et nettoyage spécial",
    baseLegale: "Art. 1728 1° C. civ. ; art. R212-2 3° C. consom.",
    obligatoire: false,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => [
      `Le véhicule est restitué dans un état de propreté comparable à celui de la remise. Un nettoyage spécial n'est facturé, à hauteur de ${eur(f.financier.fraisNettoyage)}, que lorsque l'état de saleté excède l'usage normal et impose une prestation qui ne relève pas du nettoyage courant entre deux locations : sable, boue, poils d'animaux, déchets, taches ou odeurs incrustées. L'état constaté est décrit et photographié à la fiche d'état des lieux de retour.`,
    ],
  },
  {
    id: "C22",
    intitule: "Animaux et tabac",
    baseLegale: "Art. 1728 1° C. civ.",
    obligatoire: false,
    // La garde `si: animaux || tabac` couplait deux réglages sans rapport :
    // décocher « Interdiction de fumer » (coché par défaut) faisait disparaître
    // AUSSI la règle sur les animaux, y compris l'interdiction par défaut. Les
    // deux prédicats sont découplés à l'intérieur de `paragraphes`, qui émet
    // toujours au moins la règle « animaux » : la clause n'est donc jamais vide
    // et n'a plus besoin de garde. Elle reste décochable par l'utilisateur.
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      const p: string[] = [];
      if (f.options.animaux) {
        p.push(
          "Le transport d'animaux est autorisé à condition que l'animal soit maintenu dans un dispositif de transport adapté et que le véhicule soit restitué exempt de poils, d'odeurs et de salissures. À défaut, un nettoyage spécial est facturé dans les conditions de l'article correspondant.",
        );
      } else {
        p.push(
          "Le transport d'animaux est interdit dans le véhicule, sauf autorisation écrite et préalable du Loueur.",
        );
      }
      if (f.options.tabac) {
        p.push(
          "Il est interdit de fumer et de vapoter dans le véhicule. Toute brûlure, tache ou odeur de tabac constatée au retour est traitée comme un dommage et donne lieu à facturation de la remise en état sur justificatif.",
        );
      }
      return p;
    },
  },
  {
    id: "C23",
    intitule: "Résiliation et manquements",
    baseLegale: "Art. 1224 à 1230 C. civ. ; art. R212-1 8° et R212-2 5° C. consom.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: () => [
      "Chacune des parties peut résilier le contrat en cas de manquement grave de l'autre à ses obligations, après mise en demeure demeurée sans effet pendant un délai raisonnable, sauf urgence caractérisée tenant à la sécurité des personnes ou à la préservation du véhicule.",
      "Constituent notamment des manquements graves du Locataire : la conduite par une personne non autorisée, la sous-location, la conduite sous l'empire d'un état alcoolique ou de stupéfiants, l'usage exclu par le présent contrat, la sortie non autorisée de la zone de circulation, la fausse déclaration sur l'identité ou le permis, et le défaut de paiement.",
      "Constituent notamment des manquements graves du Loueur : le défaut de délivrance du véhicule convenu, la délivrance d'un véhicule non conforme ou non entretenu, et le défaut d'assurance. La faculté de résiliation est réciproque, et son exercice ne prive aucune des parties du droit de demander réparation du préjudice subi.",
    ],
  },
  {
    id: "C24",
    intitule: "Responsabilité du Locataire et des personnes dont il répond",
    baseLegale: "Art. 1732 et 1735 C. civ.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: () => [
      "Le Locataire répond des dégradations et des pertes survenues pendant sa jouissance du véhicule, à moins qu'il ne prouve qu'elles ont eu lieu sans sa faute. Il répond également, dans les mêmes conditions, des dégradations et des pertes causées par les personnes de sa maison et par les conducteurs autorisés.",
      "Le Locataire assume la garde juridique du véhicule pendant toute la durée de la location, depuis sa remise effective jusqu'à sa restitution effective entre les mains du Loueur ou de son préposé, ou jusqu'au constat contradictoire de restitution.",
    ],
  },
  {
    id: "C25",
    intitule: "Information précontractuelle et devis",
    baseLegale:
      "Art. L111-1, L111-5 et L112-1 C. consom. ; arrêté du 17 mars 2015, annexes A et B",
    obligatoire: false,
    applicabilite: {
      modes: ["pro-conso"],
      // L'arrêté du 17 mars 2015 ne couvre QUE les véhicules de moins de 3,5 t de
      // PTAC : l'invoquer pour un camion serait une citation fausse.
      types: ["voiture", "utilitaire", "moto", "camping-car"],
    },
    // PAS de clause de reconnaissance. L'article L111-5 C. consom. met sur le
    // professionnel la charge de prouver qu'il a exécuté ses obligations
    // d'information : faire « reconnaître » au consommateur qu'il les a reçues
    // inverse cette charge et tombe sous R212-1 12° (liste NOIRE,
    // irréfragablement abusive), et sous R212-1 1° pour l'adhésion à des
    // documents absents de l'écrit signé. On renvoie donc à des pièces
    // matériellement annexées, vérifiables, plutôt qu'à un aveu pré-imprimé.
    paragraphes: () => [
      `Le devis gratuit établi le ${val("", 10)} sur support durable, conforme à l'annexe B de l'arrêté du 17 mars 2015 (date d'établissement, coordonnées du Loueur, durée et période de location, prix total toutes taxes comprises détaillé prestation par prestation, lieux de remise et de restitution), et la notice d'information précontractuelle conforme à l'annexe A du même arrêté sont annexés au présent contrat et en font partie intégrante.`,
      "La notice annexée porte les informations exigées par l'annexe A : prix unitaires tout compris des éléments de la prestation, surcharges éventuelles, modalités et prix de facturation du carburant, montant du dépôt de garantie et conditions de sa restitution, avances de loyer exigées, frais d'annulation et de retard, conditions d'âge et d'ancienneté du permis, assurances incluses et facultatives avec leurs franchises et exclusions, prestations annexes, et obligations du Loueur en matière d'entretien et d'assistance. Conformément à l'article L111-5 du Code de la consommation, la preuve de l'exécution de ces obligations d'information incombe au Loueur.",
    ],
  },
  {
    id: "C26",
    intitule: "Absence de droit de rétractation",
    baseLegale: "Art. L221-18 et L221-28 12° C. consom.",
    obligatoire: false,
    applicabilite: {
      modes: ["pro-conso"],
      // L'exception du 12° vise littéralement les « locations de voitures » et ne
      // joue que pour une prestation fournie à une date ou une période
      // déterminée. Deux garde-fous, donc : le contrat doit avoir un terme et le
      // véhicule doit être un véhicule automobile.
      types: ["voiture", "utilitaire", "camion", "camping-car"],
      si: (f) => f.location.debutDate.trim() !== "" && f.location.finDate.trim() !== "",
    },
    paragraphes: () => [
      "Le Locataire est informé que, s'agissant d'une prestation de location de voiture devant être fournie à une date ou pendant une période déterminée, le droit de rétractation de quatorze jours applicable aux contrats conclus à distance ou hors établissement est exclu par l'article L221-28 12° du Code de la consommation. Le contrat est donc ferme dès sa conclusion.",
      "Les conditions et les frais d'annulation commerciale éventuellement consentis par le Loueur sont portés aux conditions particulières ; ils s'appliquent de façon réciproque et leur montant ne peut être manifestement disproportionné au préjudice.",
    ],
  },
  {
    id: "C27",
    intitule: "Médiation de la consommation",
    baseLegale: "Art. L612-1, L616-1 et R616-1 C. consom.",
    obligatoire: false,
    applicabilite: { modes: ["pro-conso"] },
    paragraphes: (f) => [
      `Conformément aux articles L612-1 et suivants du Code de la consommation, le Locataire consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d'un litige l'opposant au Loueur, après avoir tenté de le résoudre directement par une réclamation écrite. Le médiateur compétent est ${val(f.options.mediateurNom, 20)}${f.options.mediateurUrl.trim() ? `, dont le site est accessible à l'adresse ${f.options.mediateurUrl.trim()}` : ""}.`,
      // AUCUNE mention de la plateforme européenne de RLL : le règlement (UE)
      // 2024/3228 du 19 décembre 2024 a abrogé le règlement (UE) n° 524/2013.
      // Dépôt de nouvelles plaintes fermé le 20 mars 2025, fermeture définitive
      // et suppression des données le 20 juillet 2025 ; l'obligation de faire
      // figurer le lien ODR dans les CGV a disparu avec elle. Seul le médiateur
      // nommément désigné est exigé par les articles L616-1 et R616-1.
      "La saisine du médiateur ne prive le Locataire d'aucun recours juridictionnel.",
    ],
  },
  {
    id: "C28",
    intitule: "Données personnelles",
    baseLegale:
      "Règlement (UE) 2016/679, art. 5, 6, 13 et 15 à 21 ; loi n° 78-17 du 6 janvier 1978 modifiée",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => [
      `Le Loueur traite les données d'identité, de contact, de permis de conduire et de paiement du Locataire et des conducteurs autorisés aux seules fins de conclure et d'exécuter le présent contrat, d'établir la facturation, de gérer les sinistres et les contraventions, et de satisfaire à ses obligations légales. La base légale de ces traitements est l'exécution du contrat et le respect d'obligations légales.`,
      "Les données sont conservées pendant la durée nécessaire à ces finalités puis pendant les délais de prescription et de conservation comptable applicables, avant d'être supprimées. Le numéro de la pièce d'identité et celui du permis de conduire ne sont relevés que pour vérifier le droit de conduire et l'identité ; leur copie n'est conservée que si une obligation légale l'impose.",
      `Le Locataire et les conducteurs autorisés disposent d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité, qu'ils exercent auprès du Loueur à l'adresse ${val(f.loueur.email, 20)}. Ils peuvent introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés.`,
    ],
  },
  {
    id: "C29",
    intitule: "Feuille de location — transport routier de marchandises",
    baseLegale:
      "Arrêté du 9 novembre 1999 ; arrêté du 5 mai 2003 relatif à la location de véhicules destinés au transport routier de marchandises",
    obligatoire: false,
    applicabilite: {
      modes: TOUS,
      types: ["camion", "utilitaire"],
      si: (f) => f.vehicule.type === "camion" || f.options.transportMarchandises,
    },
    paragraphes: (f) => [
      `Le véhicule étant destiné au transport routier de marchandises, une feuille de location doit se trouver à bord pendant toute la durée de la mise à disposition et être présentée à toute réquisition des agents chargés du contrôle. Un exemplaire du présent contrat en tient lieu dès lors qu'il porte les mentions suivantes : date d'établissement, dates prévues de début et de fin de mise à disposition, nom, adresse et numéro SIREN du Loueur et du Locataire, numéro d'immatriculation du véhicule moteur (${val(f.vehicule.immatriculation, 9)}), et régime de la location, ici sans conducteur.`,
      "Le Locataire fait son affaire du respect de la réglementation applicable au transport pour lequel il utilise le véhicule, notamment des règles de chargement, d'arrimage, de poids et de dimensions, ainsi que, le cas échéant, de l'inscription au registre des transporteurs et des règles relatives aux temps de conduite et de repos.",
    ],
  },
  {
    id: "C30",
    intitule: "Gabarit, parties hautes et équipements du camping-car",
    baseLegale: "Art. 1728 1° C. civ. ; avis CCA n° 12-02 du 14 mars 2013",
    obligatoire: false,
    applicabilite: { modes: TOUS, types: ["camping-car"] },
    paragraphes: (f) => [
      `La hauteur hors tout du véhicule est de ${val(f.vehicule.hauteur, 5)} mètres et son poids total autorisé en charge de ${val(f.vehicule.ptac, 6)} kilogrammes. Le Locataire vérifie ces valeurs avant tout franchissement d'ouvrage, d'auvent, de barre de hauteur, de porche ou de parc de stationnement couvert, et avant tout chargement.`,
      "Les dommages aux parties hautes du véhicule s'entendent, sans ambiguïté possible, des dommages affectant le pavillon, la capucine, les lanterneaux, la climatisation de toit, l'antenne, le porte-vélos de toit et l'auvent, à l'exclusion des éléments situés sous la ligne de ceinture de caisse. La franchise applicable à ces dommages, ainsi que son montant, sont portés aux conditions particulières ; en cas de doute sur la portée de cette délimitation, elle s'interprète en faveur du Locataire consommateur.",
      "Les équipements spécifiques (bouteilles de gaz et leur détendeur, réservoirs d'eau propre et d'eaux usées, cassette de toilettes, auvent, marchepied, porte-vélos, câbles et adaptateurs de raccordement) sont inventoriés à la fiche d'état des lieux. Le Locataire les utilise conformément à la notice, vidange les eaux usées et la cassette avant restitution dans les installations prévues à cet effet, et coupe l'alimentation en gaz pendant la circulation.",
    ],
  },
  {
    id: "C31",
    intitule: "Équipements de protection et conduite d'un deux-roues",
    baseLegale: "Art. R431-1 et R431-1-1 C. route ; art. L221-2 C. route",
    obligatoire: false,
    applicabilite: { modes: TOUS, types: ["moto"] },
    paragraphes: (f) => [
      `Le conducteur et, le cas échéant, le passager doivent porter un casque homologué correctement attaché et des gants conformes à la réglementation, conformément aux articles R431-1 et R431-1-1 du Code de la route. Le Loueur indique à la fiche d'état des lieux les équipements de protection mis à disposition et leur taille ; le Locataire vérifie leur état et leur adaptation avant le départ.`,
      `La conduite du véhicule, de ${val(f.vehicule.cylindree, 4)} cm³, requiert un permis de catégorie ${permisRequis(f)} en cours de validité. Le Locataire est informé que la conduite d'une motocyclette légère de 125 cm³ avec un permis B suppose deux ans d'ancienneté de ce permis et le suivi de la formation de sept heures prévue par le Code de la route.`,
      "La chute sans tiers impliqué est un sinistre à part entière : elle est déclarée dans les mêmes conditions et selon les mêmes délais qu'un accident avec tiers, et donne lieu à un constat photographique contradictoire.",
    ],
  },
  {
    id: "C32",
    intitule: "Véhicule électrique : charge, câbles, badge et panne d'énergie",
    baseLegale: "Art. 1719 et 1728 C. civ.",
    obligatoire: false,
    applicabilite: { modes: TOUS, si: (f) => f.vehicule.energie === "electrique" },
    paragraphes: (f) => [
      // CONTRADICTION INTERNE CORRIGÉE : sous politique « forfait », C09 stipule
      // que le véhicule « peut être restitué à niveau libre » ; exiger ici une
      // charge minimale chiffrée faisait porter au MÊME contrat deux obligations
      // opposées sur le même objet. Le relevé contradictoire du niveau, lui,
      // reste utile dans toutes les politiques : il documente l'énergie
      // consommée et sert au litige. Seuls la charge minimale et le rappel de
      // facturation sont conditionnés. Les deux autres paragraphes de l'article
      // (câbles/badges, panne d'énergie) restent inconditionnels.
      f.financier.politiqueCarburant === "forfait"
        ? "Le niveau de charge de la batterie est relevé au départ et au retour et reporté sur les fiches d'état des lieux. Le forfait d'énergie stipulé à l'article relatif à l'énergie couvrant la consommation de la location, le véhicule peut être restitué à niveau de charge libre, sans remboursement de l'énergie non consommée."
        : `Le niveau de charge de la batterie est relevé au départ et au retour et reporté sur les fiches d'état des lieux. Le véhicule doit être restitué avec un niveau de charge au moins égal à ${val(f.financier.chargeRestitution, 3)} %. L'énergie manquante est facturée dans les conditions de l'article relatif à l'énergie, sans majoration autre que celle stipulée au contrat.`,
      "Les câbles de recharge, adaptateurs et badges d'accès aux réseaux de recharge remis avec le véhicule sont inventoriés à la fiche d'état des lieux et restitués avec lui. Leur perte ou leur détérioration est facturée au coût réel de remplacement, sur justificatif.",
      "La panne d'énergie par épuisement de la batterie n'est pas une panne mécanique : le remorquage et l'immobilisation qui en résultent sont à la charge du Locataire, sauf si l'autonomie affichée au départ était manifestement erronée ou si un défaut du véhicule ou de son système de charge est établi.",
    ],
  },
  {
    id: "C33",
    intitule: "Réclamation, loi applicable et juridiction compétente",
    baseLegale:
      "Art. 48 et 750-1 CPC ; art. R631-3 C. consom. ; art. 1103 et 1104 C. civ.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: (f) => {
      const commun =
        "Le présent contrat est soumis au droit français. Toute réclamation est adressée au Loueur par écrit ; les parties s'efforcent de résoudre amiablement leur différend avant toute action.";
      if (f.mode === "pro-pro" && f.options.clauseAttributive) {
        return [
          commun,
          "PAR DÉROGATION EXPRESSE, ET LES DEUX PARTIES AYANT LA QUALITÉ DE COMMERÇANT AU SENS DE L'ARTICLE 48 DU CODE DE PROCÉDURE CIVILE, TOUT LITIGE RELATIF À LA FORMATION, À L'EXÉCUTION, À L'INTERPRÉTATION OU À LA RUPTURE DU PRÉSENT CONTRAT EST DE LA COMPÉTENCE EXCLUSIVE DU TRIBUNAL DE COMMERCE DANS LE RESSORT DUQUEL EST SITUÉ LE SIÈGE SOCIAL DU LOUEUR, Y COMPRIS EN CAS DE PLURALITÉ DE DÉFENDEURS, D'APPEL EN GARANTIE OU DE PROCÉDURE D'URGENCE.",
          "Les parties reconnaissent que cette clause a été spécifiée de façon très apparente dans l'engagement de la partie à laquelle elle est opposée. Elle est réputée non écrite si l'une des parties n'a pas la qualité de commerçant.",
        ];
      }
      if (f.mode === "pro-pro") {
        return [
          commun,
          "À défaut d'accord amiable, le litige est porté devant la juridiction territorialement compétente selon les règles du Code de procédure civile. Les parties n'ont pas convenu de clause attributive de compétence.",
        ];
      }
      return [
        commun,
        "Pour les demandes n'excédant pas 5 000 euros, une tentative préalable de règlement amiable est obligatoire, à peine d'irrecevabilité, en application de l'article 750-1 du Code de procédure civile.",
        f.mode === "pro-conso"
          ? "À défaut d'accord, le Locataire peut saisir, à son choix, l'une des juridictions territorialement compétentes en vertu du Code de procédure civile ou la juridiction du lieu où il demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable, conformément à l'article R631-3 du Code de la consommation. Aucune clause attributive de compétence territoriale n'est stipulée : une telle clause serait réputée non écrite en application de l'article 48 du Code de procédure civile."
          : "À défaut d'accord, le litige est porté devant la juridiction du lieu où demeure le défendeur ou, au choix du demandeur, devant celle du lieu d'exécution de la prestation. Aucune clause attributive de compétence territoriale n'est stipulée : une telle clause serait réputée non écrite en application de l'article 48 du Code de procédure civile, les parties n'ayant pas la qualité de commerçant.",
      ];
    },
  },
  {
    id: "C34",
    intitule: "Assurance du véhicule loué par un particulier",
    baseLegale: "Art. L113-8 et L211-1 C. assur. ; art. L110-1 4° C. com.",
    obligatoire: false,
    applicabilite: { modes: ["particuliers"] },
    paragraphes: (f) => [
      `Le Loueur déclare que le véhicule est assuré auprès de ${val(f.vehicule.assureur, 16)}, police n° ${val(f.vehicule.police, 12)}, et que son assureur a été informé de la mise à disposition du véhicule à titre onéreux et l'a expressément acceptée. Référence de cet accord écrit : ${val(f.options.assuranceLoueurParticulier, 18)}.`,
      "Cette déclaration est déterminante du consentement du Locataire. Les contrats d'assurance automobile souscrits par des particuliers couvrent le prêt du volant à titre gratuit mais excluent le plus souvent la mise à disposition à titre onéreux ; louer sans l'accord de l'assureur expose le Loueur à un défaut de garantie, au recours de l'assureur et, en cas de fausse déclaration intentionnelle, à la nullité du contrat d'assurance en application de l'article L113-8 du Code des assurances.",
      "Le Loueur est également informé que la location de meubles exercée à titre habituel constitue un acte de commerce au sens de l'article L110-1 4° du Code de commerce : la répétition des locations peut emporter requalification en activité professionnelle, avec les obligations d'immatriculation, de déclaration sociale et de fiscalité qui en découlent, et l'application intégrale du droit de la consommation.",
    ],
  },
  {
    id: "C35",
    intitule: "Signature, exemplaires et annexes",
    baseLegale: "Art. 1375 C. civ. ; art. 1112-1 C. civ.",
    obligatoire: true,
    applicabilite: { modes: TOUS },
    paragraphes: () => [
      "Le présent contrat est établi en deux exemplaires originaux, un pour chaque partie, chacune reconnaissant avoir reçu le sien au moment de la signature. Chaque page est paraphée par les deux parties.",
      // Remise MATÉRIELLE constatée, et non « reconnaissance » de lecture : une
      // clause d'aveu pré-imprimée déplace la charge de la preuve vers le
      // consommateur (R212-1 12°). Les conditions générales figurent au
      // document lui-même, il suffit donc de le dire.
      "Les annexes suivantes font partie intégrante du contrat : la fiche d'état des lieux de départ, la fiche d'état des lieux de retour, et, le cas échéant, le barème indicatif de remise en état. Les présentes conditions générales figurent au document signé par les parties ; chacune en reçoit un exemplaire complet, annexes comprises, au moment de la signature.",
      "Toute modification du contrat fait l'objet d'un avenant écrit et signé par les deux parties.",
    ],
  },
];

// ─── Renvois d'un article vers un autre ──────────────────────────────────────

/**
 * RENVOIS ÉCRITS EN TOUTES LETTRES d'un article vers un autre. Un `paragraphes`
 * ne reçoit que `f` : il ne peut pas savoir si sa cible a été décochée dans la
 * liste des articles. Décocher la cible laissait donc, dans le contrat SIGNÉ,
 * une phrase renvoyant à un article absent — le corpus grandissant, rustiner
 * les phrases une à une aurait rejoué le piège à chaque ajout.
 *
 * Seules les cibles `obligatoire: false` peuvent devenir mortes ; les renvois
 * vers C09 (énergie), C19 (retard) et C23 (résiliation) sont ici pour mémoire et
 * pour que `verifierRenvois()` les surveille, pas parce qu'ils risquent quoi que
 * ce soit. `si` reproduit la condition INTERNE au paragraphe quand le renvoi
 * n'est écrit que dans une branche : C22 ne cite C21 que si les animaux sont
 * autorisés.
 */
export const RENVOIS: ReadonlyArray<{
  source: string;
  cible: string;
  si?: (f: Formulaire) => boolean;
  motif: string;
}> = [
  {
    source: "C06",
    cible: "C19",
    motif: "la durée renvoie à l'indemnité de retard de restitution",
  },
  {
    source: "C06",
    cible: "C23",
    motif: "la restitution anticipée renvoie aux conditions de résiliation",
  },
  {
    source: "C22",
    cible: "C21",
    si: (f) => f.options.animaux,
    motif:
      "l'article « Animaux et tabac » facture le nettoyage « dans les conditions de l'article correspondant » : le retirer laisserait un renvoi sans article.",
  },
  {
    source: "C32",
    cible: "C09",
    motif: "le véhicule électrique renvoie à la facturation de l'énergie manquante",
  },
];

/** Applicabilité STRUCTURELLE d'une clause : mode, type de véhicule, garde `si`.
    Ne tient pas compte des clauses décochées — c'est volontaire, le verrouillage
    des renvois a besoin de cette question-là séparément. */
const applicable = (c: Clause, f: Formulaire): boolean =>
  c.applicabilite.modes.includes(f.mode) &&
  (!c.applicabilite.types || c.applicabilite.types.includes(f.vehicule.type)) &&
  (!c.applicabilite.si || c.applicabilite.si(f));

/**
 * Clauses qu'on ne peut pas retirer sans créer un renvoi mort, compte tenu de la
 * saisie courante — identifiant de la cible → motif à afficher. Fonction PURE.
 * Sert à deux endroits : `clausesApplicables` (qui réintègre la cible même
 * décochée, pour qu'un `localStorage` bricolé ne puisse pas non plus produire le
 * renvoi mort) et l'interface (qui grise la case et affiche le motif).
 */
export function ciblesVerrouillees(
  f: Formulaire,
  desactivees: ReadonlySet<string>,
): ReadonlyMap<string, string> {
  const verrous = new Map<string, string>();
  for (const r of RENVOIS) {
    const source = CLAUSES.find((c) => c.id === r.source);
    // La source n'écrit son renvoi que si elle est elle-même retenue…
    if (!source || !applicable(source, f)) continue;
    if (!source.obligatoire && desactivees.has(source.id)) continue;
    // …et, le cas échéant, que dans la branche de texte qui le contient.
    if (r.si && !r.si(f)) continue;
    verrous.set(r.cible, r.motif);
  }
  return verrous;
}

/** Filtre le corpus selon le mode, le type de véhicule, les options et les
    clauses volontairement décochées par l'utilisateur. Une clause `obligatoire`
    ignore la liste des décochées : elle n'est pas décochable dans l'interface,
    mais un `localStorage` bricolé à la main ne doit pas pouvoir la retirer. Une
    clause CIBLE D'UN RENVOI ACTIF est protégée de la même façon. */
export function clausesApplicables(f: Formulaire, desactivees: ReadonlySet<string>): Clause[] {
  const verrous = ciblesVerrouillees(f, desactivees);
  return CLAUSES.filter((c) => {
    if (!applicable(c, f)) return false;
    if (!c.obligatoire && desactivees.has(c.id) && !verrous.has(c.id)) return false;
    return true;
  });
}

/**
 * Contrôle de cohérence des renvois, sur le modèle de `verifierBaremes()` du
 * simulateur TVS : une divergence doit casser le build, pas atterrir dans un
 * contrat signé. Un identifiant mal recopié dans `RENVOIS` désactiverait en
 * silence la protection ci-dessus — c'est précisément le genre d'erreur que
 * personne ne voit à la relecture.
 */
export function verifierRenvois(): string[] {
  const ids = new Set(CLAUSES.map((c) => c.id));
  const pb: string[] = [];
  for (const r of RENVOIS) {
    if (!ids.has(r.source)) pb.push(`renvoi source inconnue : ${r.source}`);
    if (!ids.has(r.cible)) pb.push(`renvoi cible inconnue : ${r.cible} (depuis ${r.source})`);
  }
  return pb;
}

// Exécuté à l'import CÔTÉ SERVEUR uniquement : la page qui consomme ce module
// est `force-static`, l'import a donc lieu pendant `next build`, où une erreur
// est exactement ce qu'on veut. Côté navigateur on ne fait rien : un utilisateur
// n'a pas à payer un contrôle d'intégrité du corpus, ni à voir sa page blanchir
// pour une faute de frappe de développeur.
if (typeof window === "undefined") {
  const divergences = verifierRenvois();
  if (divergences.length) {
    throw new Error("Renvois du contrat incohérents : " + divergences.join(" | "));
  }
}

export type ClauseNumerotee = Clause & { numero: number };

/** La numérotation est POSITIONNELLE et recalculée à chaque changement : retirer
    une clause facultative ne doit pas laisser un trou dans les articles. */
export function numeroter(clauses: readonly Clause[]): ClauseNumerotee[] {
  return clauses.map((c, i) => ({ ...c, numero: i + 1 }));
}

/** Version texte brut du contrat, pour le bouton « Copier le texte » (→ Word).
    Répond aux requêtes « modèle de contrat de location gratuit word » sans
    produire de .docx : l'utilisateur colle dans son traitement de texte. */
export function contratEnTexte(f: Formulaire, clauses: readonly ClauseNumerotee[]): string {
  const l: string[] = [
    "CONTRAT DE LOCATION DE VÉHICULE",
    `Référence : ${val(f.location.reference, 10)}`,
    `Véhicule : ${val(f.vehicule.marque, 8)} ${val(f.vehicule.modele, 10)} — ${val(f.vehicule.immatriculation, 9)}`,
    `Période : du ${dateHeureFr(f.location.debutDate, f.location.debutHeure)} au ${dateHeureFr(f.location.finDate, f.location.finHeure)}`,
    "",
  ];
  for (const c of clauses) {
    l.push(`ARTICLE ${c.numero} — ${c.intitule.toUpperCase()}`, "");
    for (const p of c.paragraphes(f)) l.push(p, "");
  }
  l.push(
    "Fait en deux exemplaires originaux, à ……………………, le ……………………",
    "",
    "Le Loueur (signature précédée de « lu et approuvé »)      Le Locataire (idem)",
    "",
    `Document produit avec le générateur gratuit de Lexio — modèle mis à jour le ${META.miseAJour}.`,
    "Ce modèle ne remplace pas l'avis d'un professionnel du droit : faites-le relire avant usage.",
  );
  return l.join("\n");
}

// ─── Formulaire vide ─────────────────────────────────────────────────────────

const partieVide = (nature: NaturePartie): Partie => ({
  nature,
  denomination: "",
  nom: "",
  prenom: "",
  formeJuridique: "",
  capital: "",
  siren: "",
  tva: "",
  rcsVille: "",
  representant: "",
  qualite: "",
  adresse: "",
  cp: "",
  ville: "",
  tel: "",
  email: "",
  naissanceDate: "",
  naissanceLieu: "",
  pieceIdentite: "",
});

export const conducteurVide = (): Conducteur => ({
  nom: "",
  prenom: "",
  naissanceDate: "",
  permisNumero: "",
  permisCategorie: "",
  permisDate: "",
  permisAutorite: "",
});

export const baremeLigneVide = (): BaremeLigne => ({ poste: "", montant: "" });

/**
 * Modèle vide. Toutes les valeurs textuelles sont à `""` — AUCUN montant, aucun
 * délai, aucun taux n'est pré-rempli. Un chiffre par défaut dans un document
 * juridique serait une stipulation que personne n'a voulue ; et un barème
 * forfaitaire sans rapport avec un préjudice réel est attaquable comme clause
 * abusive (art. L212-1 C. consom.).
 *
 * Le mode par défaut est `pro-conso` : c'est le régime le plus protecteur, donc
 * celui dont l'oubli coûte le plus cher.
 */
export function formulaireVide(mode: Mode = "pro-conso"): Formulaire {
  return {
    mode,
    loueur: partieVide("societe"),
    locataire: partieVide("personne"),
    conducteurs: [],
    vehicule: {
      type: "voiture",
      marque: "",
      modele: "",
      immatriculation: "",
      vin: "",
      premiereCirculation: "",
      energie: "essence",
      couleur: "",
      ptac: "",
      chargeUtile: "",
      hauteur: "",
      longueur: "",
      cylindree: "",
      placesCarteGrise: "",
      placesCouchage: "",
      kmDepart: "",
      niveauDepart: "",
      controleTechnique: "",
      permisRequis: "",
      cles: "",
      accessoires: [],
      assureur: "",
      police: "",
    },
    location: {
      reference: "",
      debutDate: "",
      debutHeure: "",
      finDate: "",
      finHeure: "",
      lieuDepart: "",
      lieuRestitution: "",
      zone: "france",
      zoneTexte: "",
      usage: "",
    },
    financier: {
      prixHT: "",
      tauxTva: "",
      prixTTC: "",
      modePaiement: "",
      politiqueKm: "illimite",
      kmInclus: "",
      prixKmSup: "",
      politiqueCarburant: "plein-plein",
      prixLitre: "",
      forfaitCarburant: "",
      chargeRestitution: "",
      depotMode: "aucun",
      depotMontant: "",
      depotDelaiJours: "",
      franchiseDommages: "",
      franchiseVol: "",
      rachatFranchise: "",
      retardTolerance: "",
      retardTarifHeure: "",
      retardTarifJour: "",
      fraisNettoyage: "",
      fraisDesignation: "",
      penalitesRetardPaiement: "",
    },
    options: {
      animaux: false,
      tabac: true,
      remorquage: false,
      conduiteEtranger: false,
      transportMarchandises: false,
      clauseAttributive: false,
      mediateurNom: "",
      mediateurUrl: "",
      assuranceLoueurParticulier: "",
      bareme: [],
    },
  };
}

/**
 * Mode « vierge » : on ne bricole pas le rendu clause par clause, on repart du
 * formulaire VIDE en ne conservant QUE les commutateurs de structure (mode,
 * type, énergie, politiques, options, nombre de conducteurs et de lignes de
 * barème). Toutes les interpolations retombent alors automatiquement sur les
 * pointillés de `val()` — aucune clause n'a besoin de connaître ce mode.
 *
 * C'est la réponse exacte à « contrat de location voiture vierge gratuit » :
 * le loueur imprime un stock de contrats papier à remplir à la main.
 */
export function viderFormulaire(f: Formulaire): Formulaire {
  const v = formulaireVide(f.mode);
  return {
    ...v,
    loueur: { ...v.loueur, nature: f.loueur.nature },
    locataire: { ...v.locataire, nature: f.locataire.nature },
    conducteurs: f.conducteurs.map(() => conducteurVide()),
    vehicule: { ...v.vehicule, type: f.vehicule.type, energie: f.vehicule.energie },
    location: { ...v.location, zone: f.location.zone },
    financier: {
      ...v.financier,
      politiqueKm: f.financier.politiqueKm,
      politiqueCarburant: f.financier.politiqueCarburant,
      depotMode: f.financier.depotMode,
    },
    options: {
      ...v.options,
      animaux: f.options.animaux,
      tabac: f.options.tabac,
      remorquage: f.options.remorquage,
      conduiteEtranger: f.options.conduiteEtranger,
      transportMarchandises: f.options.transportMarchandises,
      clauseAttributive: f.options.clauseAttributive,
      bareme: f.options.bareme.map(() => baremeLigneVide()),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fiche d'état des lieux — constantes
//
// Les deux fiches (départ et retour) partagent la même grille : c'est ce qui
// rend la comparaison possible au sens de l'article 1730 du Code civil. On ne
// définit donc qu'UNE structure, rendue deux fois.
// ─────────────────────────────────────────────────────────────────────────────

export type CodeDommage = { code: string; libelle: string };

/** Codes de NATURE du dommage, reportés sur le schéma et dans le tableau. */
export const CODES_DOMMAGE: readonly CodeDommage[] = [
  { code: "R", libelle: "Rayure — trace linéaire dans la peinture, sans déformation" },
  { code: "E", libelle: "Éraflure / frottement — peinture arrachée sur une surface" },
  { code: "I", libelle: "Impact / éclat — point de choc localisé, éclat de peinture ou de vitrage" },
  { code: "C", libelle: "Choc / enfoncement — déformation de tôle" },
  { code: "F", libelle: "Fissure / fêlure — vitrage fendu, plastique craquelé" },
  { code: "B", libelle: "Bris / casse — élément cassé, percé ou hors service" },
  { code: "M", libelle: "Manquant — élément absent (enjoliveur, bouchon, antenne, tapis)" },
  { code: "P", libelle: "Peinture — écaillage, retouche visible, réparation antérieure apparente" },
  { code: "O", libelle: "Oxydation / corrosion — rouille, piqûres" },
  { code: "T", libelle: "Tache incrustée — sellerie, moquette, ciel de toit, coffre" },
  { code: "U", libelle: "Brûlure — trou ou marque de brûlure sur sellerie, moquette, ciel de toit" },
  { code: "D", libelle: "Déchirure / accroc — sellerie, moquette, bâche, soufflet, joint" },
  { code: "S", libelle: "Saleté au-delà de l'usage normal — sable, boue, poils, déchets" },
  { code: "N", libelle: "Non fonctionnel — élément présent mais hors service" },
];

/** Gravité : c'est elle, et non la seule nature, qui détermine si l'on retouche,
    débosselle ou remplace — donc l'ordre de grandeur du chiffrage. */
export const CODES_GRAVITE: readonly CodeDommage[] = [
  { code: "G1", libelle: "Léger — superficiel, moins de 5 cm, ni sécurité ni étanchéité en cause" },
  { code: "G2", libelle: "Moyen — 5 à 20 cm, ou jusqu'à l'apprêt, ou déformation légère" },
  { code: "G3", libelle: "Important — plus de 20 cm, tôle déformée, élément percé ou brisé" },
];

/**
 * Statut : la colonne la plus importante de toute la fiche. C'est elle qui
 * sépare ce qui est facturable de ce qui ne l'est pas (art. 1730 C. civ. :
 * « excepté ce qui a péri ou a été dégradé par vétusté »).
 */
export const CODES_STATUT: readonly CodeDommage[] = [
  { code: "PRE", libelle: "Préexistant — constaté et accepté au départ, non imputable au locataire" },
  { code: "NEW", libelle: "Nouveau — absent de la fiche de départ, constaté au retour" },
  { code: "USU", libelle: "Usure normale — vétusté ou usage normal, exclue de la facturation" },
];

/** Zones de carrosserie d'un véhicule à quatre roues, dans l'ordre d'un tour du
    véhicule : avant, flancs, arrière, dessous, roues. Suivre cet ordre à la
    main évite d'oublier une face — c'est la raison de ce tri. */
export const ZONES_CARROSSERIE: readonly string[] = [
  "Pare-chocs avant",
  "Calandre / grille de calandre",
  "Capot",
  "Optique de phare avant gauche",
  "Optique de phare avant droit",
  "Feux antibrouillard / clignotants avant",
  "Plaque d'immatriculation avant + support",
  "Pare-brise",
  "Balais d'essuie-glace avant",
  "Rétroviseur extérieur gauche (coque + glace)",
  "Rétroviseur extérieur droit (coque + glace)",
  "Aile avant gauche",
  "Aile avant droite",
  "Porte avant gauche (panneau + poignée + joint)",
  "Porte avant droite (panneau + poignée + joint)",
  "Porte arrière gauche (panneau + poignée + joint)",
  "Porte arrière droite (panneau + poignée + joint)",
  "Vitre avant gauche",
  "Vitre avant droite",
  "Vitre arrière gauche",
  "Vitre arrière droite",
  "Custode / vitre de custode gauche",
  "Custode / vitre de custode droite",
  "Bas de caisse gauche + seuil de porte",
  "Bas de caisse droit + seuil de porte",
  "Marchepied / bavolet gauche et droit (si équipé)",
  "Passages de roue avant et arrière",
  "Aile arrière gauche",
  "Aile arrière droite",
  "Pavillon / toit",
  "Toit ouvrant ou panoramique (vitrage + joint)",
  "Barres de toit / galerie / antenne",
  "Lunette arrière",
  "Essuie-glace arrière",
  "Hayon ou coffre (panneau + serrure + joint)",
  "Becquet / aileron",
  "Pare-chocs arrière",
  "Feu arrière gauche",
  "Feu arrière droit",
  "Troisième feu stop",
  "Plaque d'immatriculation arrière + support",
  "Ligne d'échappement visible",
  "Attelage / boule de remorquage (si équipé)",
  "Bouchon et trappe de réservoir (ou trappe de charge)",
  "Soubassement visible / sabot moteur",
  "Jante + pneu avant gauche",
  "Jante + pneu avant droit",
  "Jante + pneu arrière gauche",
  "Jante + pneu arrière droit",
  "Enjoliveurs (x4) et cache-écrous",
  "Roue de secours ou kit anti-crevaison",
];

/** Un deux-roues n'a ni portes, ni ailes, ni custodes : réutiliser la grille
    « auto » produirait une fiche aux trois quarts sans objet, donc bâclée. */
export const ZONES_MOTO: readonly string[] = [
  "Tête de fourche / bulle / saute-vent",
  "Optique de phare avant",
  "Clignotants avant gauche et droit",
  "Rétroviseur gauche",
  "Rétroviseur droit",
  "Guidon, leviers et poignées",
  "Compteur / tableau de bord",
  "Carénage avant gauche",
  "Carénage avant droit",
  "Garde-boue avant",
  "Fourche, tubes et soufflets",
  "Étriers et disques de frein avant",
  "Réservoir (peinture, bouchon, serrure)",
  "Selle conducteur et selle passager",
  "Flanc de carénage gauche",
  "Flanc de carénage droit",
  "Cadre et berceau",
  "Repose-pieds conducteur et passager",
  "Béquille latérale et béquille centrale",
  "Sélecteur de vitesses et pédale de frein",
  "Chaîne, couronne, carter de chaîne",
  "Bras oscillant",
  "Amortisseur arrière",
  "Ligne et silencieux d'échappement",
  "Garde-boue arrière / passage de roue",
  "Feu arrière et clignotants arrière",
  "Plaque d'immatriculation + support",
  "Porte-bagages, top-case et valises",
  "Jante et pneu avant",
  "Jante et pneu arrière",
  "Casques remis (nombre, taille, état)",
  "Gants et équipements de protection remis",
  "Antivol, câble et clé",
];

/** Équipements et accessoires : proposés en cases à cocher pour éviter la saisie
    libre, parce que le nombre de clés remises et la présence du kit de sécurité
    sont deux litiges classiques que l'oubli d'une ligne suffit à faire naître. */
export const ACCESSOIRES: readonly string[] = [
  "Carte grise (copie)",
  "Constat amiable vierge",
  "Notice d'utilisation",
  "Gilet de sécurité",
  "Triangle de présignalisation",
  "Kit anti-crevaison ou roue de secours",
  "Cric, manivelle et clé démonte-roue",
  "Antivol de roue + douille",
  "Tapis de sol",
  "Cache-bagages",
  "Badge de télépéage",
  "Câble de recharge (mode 2)",
  "Câble de recharge (mode 3)",
  "Badge de recharge",
  "Porte-vélos",
  "Barres de toit",
  "Chaînes ou chaussettes à neige",
  "Sangles d'arrimage",
  "Diable ou couverture de déménagement",
  "Rehausseur ou siège enfant",
  "Support de téléphone / GPS",
];

/** Niveaux de jauge en huitièmes : une jauge se lit en huitièmes, pas en
    pourcentage. Le relevé doit être reportable tel quel depuis le combiné. */
export const NIVEAUX_JAUGE: readonly string[] = [
  "0/8",
  "1/8",
  "2/8",
  "3/8",
  "4/8",
  "5/8",
  "6/8",
  "7/8",
  "8/8",
];

export type RubriqueEdl = {
  id: string;
  titre: string;
  lignes: readonly string[];
};

/**
 * Rubriques communes aux deux fiches, hors carrosserie (traitée à part avec son
 * schéma). Chaque ligne est un point à cocher CONFORME / RÉSERVE : une fiche
 * qui ne propose qu'un champ « observations » libre finit vide, donc sans
 * valeur probante.
 */
export const RUBRIQUES_EDL: readonly RubriqueEdl[] = [
  {
    id: "conditions",
    titre: "Conditions matérielles du constat",
    lignes: [
      "Constat réalisé de jour / de nuit sous éclairage artificiel",
      "Météo : temps sec / pluie",
      "Véhicule propre et sec au moment du constat",
      "Constat réalisé en présence du locataire",
      "Un exemplaire de la présente fiche a été remis au locataire",
    ],
  },
  {
    id: "compteurs",
    titre: "Compteur, énergie et niveaux",
    lignes: [
      "Kilométrage au compteur (relevé chiffré + photo du combiné)",
      "Niveau de carburant en huitièmes ou état de charge en %",
      "Autonomie affichée (véhicule électrique)",
      "Niveau d'AdBlue (si équipé)",
      "Voyants allumés au tableau de bord (aucun / lesquels)",
      "Témoin de pression des pneumatiques",
      "Niveau d'huile et de liquide de refroidissement",
    ],
  },
  {
    id: "pneus",
    titre: "Pneumatiques, jantes et roue de secours",
    lignes: [
      "Avant gauche : usure, pression, coupure ou hernie, état de jante",
      "Avant droit : usure, pression, coupure ou hernie, état de jante",
      "Arrière gauche : usure, pression, coupure ou hernie, état de jante",
      "Arrière droit : usure, pression, coupure ou hernie, état de jante",
      "Type de pneumatiques (été / hiver / 4 saisons)",
      "Roue de secours ou galette : présence, état, pression",
      "Kit anti-crevaison : présence, date de péremption de la cartouche",
      "Cric, manivelle, clé démonte-roue, antivol et sa douille",
    ],
  },
  {
    id: "eclairage",
    titre: "Éclairage, signalisation et vitrage",
    lignes: [
      "Feux de position, de croisement et de route",
      "Clignotants, feux de détresse et feux stop",
      "Feux de recul, antibrouillards et éclairage de plaque",
      "Essuie-glaces avant et arrière, lave-glace",
      "Pare-brise : impacts, fissures, rayures d'essuie-glace",
      "Lunette arrière, vitres latérales et lève-vitres",
    ],
  },
  {
    id: "interieur",
    titre: "Habitacle et propreté",
    lignes: [
      "Sièges, sellerie et ceintures de sécurité",
      "Tableau de bord, commandes et écran multimédia",
      "Climatisation, chauffage et ventilation",
      "Moquettes, tapis, ciel de toit et coffre",
      "Odeurs (tabac, animaux, humidité)",
      "Propreté générale intérieure et extérieure",
    ],
  },
  {
    id: "documents",
    titre: "Documents, clés et accessoires",
    lignes: [
      "Nombre de clés ou de badges remis et restitués",
      "Certificat d'immatriculation ou sa copie",
      "Constat amiable vierge à bord",
      "Gilet de sécurité et triangle de présignalisation",
      "Badge de télépéage, câbles et badge de recharge",
      "Accessoires listés au contrat (détail au verso si nécessaire)",
    ],
  },
];

/** Rubriques ajoutées pour un camping-car : gaz, eaux et cellule. Ne pas les
    inventorier, c'est laisser sortir une cassette pleine et un auvent déchiré. */
export const RUBRIQUES_CAMPING_CAR: readonly RubriqueEdl[] = [
  {
    id: "cellule",
    titre: "Cellule, gaz et eaux (camping-car)",
    lignes: [
      "Bouteilles de gaz : nombre, niveau, détendeur et flexible",
      "Réservoir d'eau propre : niveau et état",
      "Réservoir d'eaux grises et cassette de toilettes : vidangés",
      "Réfrigérateur, chauffage et chauffe-eau : fonctionnement",
      "Auvent, store et lanterneaux : manœuvre et état",
      "Marchepied, porte-vélos et coffre de soute",
      "Batterie cellule, panneau solaire et câble 230 V",
      "Vaisselle, literie et mobilier inventoriés",
    ],
  },
];

/** Rubriques ajoutées pour un utilitaire ou un camion : c'est le gabarit et la
    zone de chargement qui font les litiges, pas la carrosserie avant. */
export const RUBRIQUES_UTILITAIRE: readonly RubriqueEdl[] = [
  {
    id: "chargement",
    titre: "Zone de chargement et gabarit (utilitaire, camion)",
    lignes: [
      "Hauteur hors tout rappelée au conducteur et affichée en cabine",
      "Plancher, parois et pavillon de la zone de chargement",
      "Portes arrière, porte latérale et leurs joints",
      "Hayon élévateur : fonctionnement, sécurité, béquilles",
      "Points et sangles d'arrimage",
      "Cloison de séparation et protections intérieures",
      "Feuille de location présente à bord (transport de marchandises)",
    ],
  },
];
