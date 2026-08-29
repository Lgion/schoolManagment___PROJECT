# 🎓 SPEC — Évolution vers une solution « Collège & Lycée »

> Extrait de `TODOdesign.md` (§6) : chantier produit majeur, séparé des retouches UI.
> **Objectif :** faire évoluer cet ERP (actuellement taillé pour le Primaire) vers le Secondaire.

---

## Différences fondamentales à modéliser

Dans le primaire, une classe a généralement un seul enseignant principal qui dispense toutes les matières. Au collège et au lycée, la classe dispose d'un **corps enseignant pluridisciplinaire** (un enseignant différent par matière) et d'un système d'évaluation basé sur des **coefficients** et des moyennes pondérées complexes.

## État actuel du code (référence)

- `app/api/_/models/ai/Classe.js` possède déjà un champ `coefficients` (Object libre `{ matiereId: coeff }`), consommé par `NotesEntryBlock` et le détail classe (onglet Notes & Devoirs). **Point de départ à structurer**, pas à créer.
- Pas de notion de « corps enseignant par matière » : les enseignants sont liés via `current_classes` (tableau d'ids de classes), sans matière associée.
- Pas de modèle `Salle` (prérequis pour la détection de conflits d'emploi du temps).
- Les bulletins (`ReportCardsPanel` / ReportCard) calculent des moyennes simples.

---

## Phase 1 — Modèle de données

### 1.1 Schéma des classes (`Classe.js`)
Remplacer/compléter le lien enseignant-référent par un tableau d'enseignants associés à leurs matières, et structurer les coefficients :

```javascript
const matiereCoefficientSchema = new mongoose.Schema({
  matiereId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  coefficient: { type: Number, default: 1, min: 1 }
}, { _id: false });

const classeEnseignantSchema = new mongoose.Schema({
  enseignantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  matiereId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true }
}, { _id: false });

// Ajout au schéma Classe :
// matieresCoefficients: [matiereCoefficientSchema]  // migration depuis l'Object `coefficients` existant
// corpsEnseignant: [classeEnseignantSchema]
```

**Migration :** script de conversion `coefficients` (Object) → `matieresCoefficients` (tableau typé), avec rétro-compatibilité en lecture pendant la transition.

### 1.2 Modèle `Salle` (nouveau)
Nécessaire pour la Phase 3 : `{ nom, capacite, equipements[] }`.

## Phase 2 — Moteur de bulletins (`ReportCard`)

Adapter le calcul pour prendre en compte les coefficients :

- Moyenne de l'élève par matière : `MoyenneMatière = Σ(notes de compositions) / nombre de notes` (ou pondérée selon devoirs de classe / devoirs communs).
- Moyenne générale du trimestre/semestre :
  `MoyenneGénérale = Σ(MoyenneMatière × Coefficient) / Σ(Coefficients)`
- PDF du bulletin : moyenne de la classe par matière, note min, note max, rang de l'élève dans la matière, appréciations individualisées de chaque enseignant.

## Phase 3 — Emplois du temps avancés (Scheduling)

- **Validation à l'ajout d'un cours :** vérifier que l'enseignant n'est pas déjà assigné à une autre classe sur ce créneau, et que la salle est libre (dépend du modèle `Salle`, Phase 1.2).
- **Demi-groupes :** gérer les cours en demi-groupes (Langues Vivantes, TP de Sciences).

## Phase 4 — Espaces de travail Parent & Élève (approfondissement)

> Les interfaces parent/élève de base existent déjà (dashboard unifié par rôle). Cette phase ajoute l'autonomie propre au secondaire :

- **Espace Élève :** cahier de texte personnel, téléchargement des cours PDF des profs, rendu des devoirs en ligne, messagerie directe avec ses enseignants.
- **Espace Parent :** suivi des absences et sanctions en temps réel, signature électronique des bulletins trimestriels, messagerie avec le professeur principal et l'administration, paiement en ligne des frais de scolarité.

---

## Ordre de mise en œuvre recommandé

1. Phase 1.1 (schéma + migration) — débloque tout le reste.
2. Phase 2 (bulletins pondérés) — valeur visible immédiate.
3. Phase 1.2 + Phase 3 (salles + conflits EDT).
4. Phase 4 (autonomie élève/parent) — incrémental, feature par feature.
