# Story 1.5: Consultation de l'Historique Inaltérable

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an Admin,
I want pouvoir consulter l'historique de conservation des notes et scolarités des années précédentes pour n'importe quel élève,
so that je puisse répondre aux audits académiques, imprimantes de bulletins passés, ou vérifier la trajectoire scolaire d'un élève.

## Acceptance Criteria

1. **Given** qu'une année scolaire précédente est archivée (ex: `2024-2025`)
   **When** l'Admin accède au profil d'un élève
   **Then** il peut voir l'ensemble des années disponibles dans l'historique
   **And** les données de chaque année antérieure s'affichent en mode **lecture seule** (aucun champ éditable)

2. **Given** que l'Admin consulte l'historique d'un élève
   **When** il sélectionne une année passée
   **Then** il peut voir :
   - Les **notes** (`compositions` et `notes`) pour chaque trimestre de cette année
   - Les **absences** liées à cette année
   - La **classe** suivie cet année-là (`bolobi_class_history_$_ref_µ_classes`)
   - Le statut de **scolarité** (paiement `scolarity_fees_$_checkbox`)

3. **Given** un Enseignant connecté
   **When** il consulte une page de classe ou un profil d'élève
   **Then** la section Historique est **absente** ou masquée — seuls les Admins y accèdent
   **And** toute donnée financière (scolarité) s'affiche uniquement pour l'Admin (AC hérité de Story 1.3)

4. **Given** l'affichage de l'historique
   **When** le composant se charge
   **Then** aucun spinner global bloquant n'apparaît — utilisation de Skeleton Loaders ciblés si nécessaire
   **And** la page ne se recharge pas (Zero Render-Storm)

5. **Given** l'Admin visualise l'historique d'un élève qui a changé de classe entre deux années
   **When** il sélectionne chaque année
   **Then** la classe d'origine de l'élève (via `bolobi_class_history_$_ref_µ_classes`) est correctement affichée pour cette année

## Tasks / Subtasks

- [x] Task 1 : API — Endpoint GET pour l'historique d'un élève (AC: #1, #2, #5)
  - [x] 1.1 Créé `app/api/school_ai/eleves/[id]/history/route.js` — route GET retournant toutes les données historiques (compositions, notes, absences, school_history, bolobi_class_history, scolarity_fees)
  - [x] 1.2 RBAC strict : Admin uniquement — `await auth()` unique, 403 pour tout autre rôle
  - [x] 1.3 Données financières exclues pour les non-Admins (endpoint Admin-only, défense en profondeur)
  - [x] 1.4 Populate `bolobi_class_history` avec noms de classes (Classe lookup), non-bloquant en cas d'échec

- [x] Task 2 : Frontend — Composant `HistoriqueBlock` (AC: #1, #2, #4)
  - [x] 2.1 Créé `app/components/HistoriqueBlock.jsx` — composant de visualisation de l'historique complet d'un élève
  - [x] 2.2 Sélecteur d'année : onglets dérivés de toutes les clés de compositions/notes/school_history, tri décroissant
  - [x] 2.3 Pour l'année sélectionnée : classe résolue, notes par trimestre/matière, absences, statut scolarité
  - [x] 2.4 Tous les champs en lecture seule — aucun `<input>` éditable
  - [x] 2.5 Skeleton Loader ciblé pendant le chargement initial (pas de spinner global)

- [x] Task 3 : RBAC Frontend — Intégration dans le profil élève (AC: #3)
  - [x] 3.1 Intégré `HistoriqueBlock` dans `app/components/EleveDetailContent.jsx`
  - [x] 3.2 Conditionné par `<PermissionGate roles={['admin']}>` — bloc absent pour les Enseignants
  - [x] 3.3 `scolarity_fees` non rendu côté frontend pour les non-Admins (endpoint Admin-only + PermissionGate)

- [x] Task 4 : UI/UX — Conformité Design System (AC: #4)
  - [x] 4.1 Créé `app/assets/scss/components/NOTES/historiqueBlock.scss` — 100% CSS custom properties, skeleton animation
  - [x] 4.2 Enregistré dans `app/assets/scss/index.scss` via `@use`
  - [x] 4.3 Classes BEM cohérentes : `.historique-block__year-selector`, `.historique-block__table`, etc.
  - [x] 4.4 États vides et d'erreur avec messages élégants

## Dev Notes

### Architecture Compliance (CRITIQUE — ne pas déroger)

- **RBAC**: Utiliser le pattern `const { userId, sessionClaims } = await auth();` une seule fois par handler. Rôle extrait via `sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role`. **Jamais** appeler `checkRole()` deux fois.
- **Hub API**: Nouvel endpoint dans `/api/school_ai/eleves/[id]/history/route.js` — cohérent avec le hub school_ai. NE PAS créer d'endpoint hors de ce hub.
- **Sass Only**: Toutes les couleurs via `app/assets/scss/_variables.scss` ou `_colors.scss`. Aucune couleur hex `#xxx` inline dans les `.jsx`.
- **Zero Debug Logs**: Aucun `console.log("debug...")` en production. Seuls les `console.error` dans les blocs `catch` sont acceptables.
- **Zero Render-Storm**: Pas de spinner global. Skeleton Loaders ciblés uniquement.
- **Read-Only**: Cette story est **consultation pure** — aucune mutation de données, aucun Optimistic UI nécessaire.
- **PermissionGate dans les tableaux**: Ne JAMAIS utiliser `<PermissionGate>` directement dans un `<tr>` ou `<thead>` (injecte un `<div>` dans DOM, HTML invalide). Utiliser `useUserRole()` + rendu conditionnel direct.

### Schéma de données — Référence critique

**`Eleve` (modèle: `ai_Eleves_Ecole_St_Martin`)** — `app/api/_/models/ai/Eleve.js`

```js
school_history:                    { [annee]: "" }         // Nom de l'école par année
bolobi_class_history_$_ref_µ_classes: { [annee]: ObjectId }  // Référence classe par année
scolarity_fees_$_checkbox:         { [annee]: Boolean }    // Scolarité payée par année (ADMIN ONLY)
notes:                             { [annee]: {} }         // Notes libres par année
compositions:                      { type: Object }        // Structure: { annee: [trim0, trim1, trim2] }
absences:                          [{ annee, trimestre, count }]  // Liste absences (Story 1.4 format)
```

> ⚠️ **Important**: `compositions` est un Object libre. Story 1.4 a établi la structure:
> `compositions[annee][trimestreIndex]` = `{ officiel: { timestamp: { matiere: { note, sur } } }, _locked: true }`
> Mais les **données plus anciennes** peuvent avoir un format différent — le composant `HistoriqueBlock` doit être défensif face à des structures inattendues (checker `typeof`, utiliser `?.`).

> ⚠️ **Note**: `absences` est stocké comme `[Object]` (Array) dans le schéma Eleve — format Story 1.4: `[{ annee, trimestre, count }]`. Les données plus anciennes peuvent avoir un format différent (Object plat). S'en prémunir.

### Composants existants à réutiliser (Zero-Waste)

| Composant | Chemin | Usage |
|-----------|--------|-------|
| `NotesBlock` | `app/components/NotesBlock.jsx` | Affichage **read-only** des notes — à réutiliser ou s'en inspirer directement pour l'affichage des notes historiques |
| `PermissionGate` | `app/components/PermissionGate.jsx` | Wrapper Admin-only pour `HistoriqueBlock` |
| `useUserRole` | `stores/useUserRole.js` | Pour conditionner l'affichage de `scolarity_fees` dans le tableau |
| `ai_adminContext` | `stores/ai_adminContext.js` | État global — si l'historique doit être paginé depuis le store, y ajouter `fetchEleveHistory(eleveId)` |

> ⚠️ Vérifier si `NotesBlock` accepte déjà un prop `annee` ou `trimestreIndex` avant de dupliquer la logique d'affichage.

### Pattern de route authentifiée — Modèle à suivre (Story 1.3 / 1.4)

```js
// GET /api/school_ai/eleves/[id]/history
import dbConnect from '../../../../lib/dbConnect';
import Eleve from '../../../../_/models/ai/Eleve';
import { NextResponse } from 'next/server';
import { Roles } from '../../../../../../utils/roles';
import { auth } from '@clerk/nextjs/server';

export async function GET(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const userRole = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
    // Histoire = Admin ONLY
    if (userRole !== Roles.ADMIN) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await dbConnect();
    const { id } = params;

    const eleve = await Eleve.findById(id).lean();
    if (!eleve) return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });

    // Retourner uniquement les champs historiques
    return NextResponse.json({
      _id: eleve._id,
      nom: eleve.nom,
      prenoms: eleve.prenoms,
      compositions: eleve.compositions,
      notes: eleve.notes,
      absences: eleve.absences,
      school_history: eleve.school_history,
      bolobi_class_history: eleve['bolobi_class_history_$_ref_µ_classes'],
      scolarity_fees: eleve['scolarity_fees_$_checkbox'], // Admin-only data
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}
```

> ⚠️ **Chemin d'import `Eleve.js`** : depuis `app/api/school_ai/eleves/[id]/history/route.js`, le chemin relatif vers les modèles est `'../../../../_/models/ai/Eleve'` — vérifier avec la structure réelle car le dossier de modèles est `app/api/_/models/ai/`.

### Identification de la page d'intégration

Avant d'intégrer `HistoriqueBlock`, identifier **où** les profils d'élèves sont consultés :

```bash
# Chercher où un élève individuel est affiché en détail
grep -r "eleve\._id\|eleveId\|eleve\.nom" app --include="*.jsx" -l
```

Candidats probables :
- `app/eleves/[id]/page.jsx` — page dédiée profil élève (si elle existe)
- `app/components/EntityModal.jsx` — modale utilisée pour l'affichage des détails élèves depuis les listes

> 🔑 **Action critique**: Avant de commencer Task 3, lire le composant `EntityModal.jsx` pour déterminer si c'est lui qui gère les détails d'un élève et où insérer `HistoriqueBlock`.

### Structure de fichiers à créer / modifier

```
app/
├── api/
│   └── school_ai/
│       └── eleves/
│           └── [id]/
│               └── history/
│                   └── route.js              [NEW] — GET endpoint historique Admin
├── components/
│   └── HistoriqueBlock.jsx                   [NEW] — Composant de consultation historique
└── assets/
    └── scss/
        └── components/
            └── NOTES/
                └── historiqueBlock.scss       [NEW] — Styles HistoriqueBlock
                └── notesEntry.scss            [EXISTING]
        └── index.scss                         [MODIFY] — @use historiqueBlock
```

### Données de test / scénarios limites

Le composant doit gérer défensivement :
- `compositions` vide ou null → afficher "Aucune note enregistrée"
- `absences` en format Object (ancien) plutôt qu'Array (nouveau) → ne pas crasher, logger en `console.warn`
- Élève sans `bolobi_class_history` pour une année → afficher "—"
- Élève actuel (année courante) → inclure ou exclure selon le besoin (préférablement exclure — l'année en cours est déjà visible dans la vue principale)

### Previous Story Intelligence

**Story 1.4 — Leçons critiques pour Story 1.5:**

- ✅ **Pattern `_locked`**: Story 1.4 a ajouté `_locked: true` sur les trimestres publiés dans `compositions`. Story 1.5 peut l'utiliser pour afficher visuellement un badge "📌 Publié" dans l'historique.
- ✅ **Format absences Story 1.4**: `[{ annee, trimestre: Number, count: Number }]` — c'est le format à cibler. Les données plus anciennes peuvent différer.
- ⚠️ **Résidu Eleve.js**: `Eleve.js` contient un `console.log("iii")` à la ligne 6 (debug résiduel non supprimé) — à nettoyer dans cette story si le fichier est touché.
- ⚠️ **PermissionGate dans `<tr>`**: Éviter d'utiliser `<PermissionGate>` dans les tableaux HTML (injecte un `<div>` invisible causant un HTML invalide). Utiliser `useUserRole()` directement.
- ✅ **Pattern Sass tokenisé**: `app/assets/scss/components/NOTES/notesEntry.scss` est un modèle à suivre pour `historiqueBlock.scss` — 100% CSS custom properties.

**Story 1.3 — Leçons critiques:**
- ❌ Piège: `auth()` sans `await` = Promise truthy = sécurité absente. **Toujours `await auth()`.**
- ✅ Pattern établi: données financières masquées côté frontend avec `PermissionGate roles={['admin']}` et côté API en n'incluant pas le champ pour les non-Admins.

### Git Intelligence

Derniers commits:
- `699b6d4` — sprint planning, pas de changements de code
- `f693706` — module report (app/report probablement) — si `HistoriqueBlock` ressemble au module rapport, s'en inspirer pour l'affichage des données historiques

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-1-5`] — User story et ACs
- [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication-Security`] — Pattern RBAC mono-auth
- [Source: `_bmad-output/planning-artifacts/architecture.md#Asynchronous-UI`] — Règle Skeleton Loaders
- [Source: `app/api/_/models/ai/Eleve.js`] — Schéma élève, champs historiques
- [Source: `app/api/school_ai/eleves/[id]/route.js`] — Pattern PATCH établi en Story 1.4 (structure du dossier)
- [Source: `app/components/NotesBlock.jsx`] — Composant read-only de notes existant à réutiliser
- [Source: `app/components/PermissionGate.jsx`] — Composant RBAC frontend
- [Source: `app/assets/scss/components/NOTES/notesEntry.scss`] — Modèle Sass Design Token à suivre
- [Source: `_bmad-output/implementation-artifacts/1-4-saisie-manuelle-des-notes-et-absences.md#Dev-Notes`] — Leçons Story 1.4

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro (Antigravity)

### Debug Log References

N/A

### Completion Notes List

- ✅ Task 1: Créé `GET /api/school_ai/eleves/[id]/history/route.js` — Admin-only (403 pour Enseignant), lookup Classe pour bolobi_class_history, retourne toutes les données historiques
- ✅ Task 2: Créé `HistoriqueBlock.jsx` — lecture seule, skeleton loader, onglets année/trimestre, format composition défensif (Story 1.4 + legacy), absences par trimestre, badge scolarité
- ✅ Task 3: Intégré dans `EleveDetailContent.jsx` avec `<PermissionGate roles={['admin']}>`. Retiré `alert('okkkk')` debug existant.
- ✅ Task 4: `historiqueBlock.scss` créé — 100% CSS custom properties, skeleton animation, responsive, classes BEM. `@use` enregistré dans `index.scss`.
- ✅ Bonus: Nettoyé `console.log("iii")` dans `Eleve.js` (mentionné dans les Dev Notes)
- ✅ Tests E2E: `tests/e2e/story-1-5-historique.spec.ts` — couvre 401 non-auth, 403 Enseignant, 200/404 Admin, et validation du shape de réponse

### AI Code Review Fixes (Post-Implementation)
- ✅ **Fix #1 (HIGH):** Restructuré `getCompositionsForTrimestre` pour garantir l'atteignabilité de la logique legacy de compositions.
- ✅ **Fix #2 (HIGH):** Corrigé la logique de validation des paiements (`scolarityFee?.paid`) pour gérer correctement les données au format booléen et les sous-objets structurés.
- ✅ **Fix #3 & #4 (MEDIUM):** Remplacé les 5 inline styles résiduels (`style={{...}}`) restants dans `EleveDetailContent.jsx` par des classes CSS BEM correspondantes, et supprimé la duplication du modificateur CSS `--historique`.
- ✅ **Fix #5 (MEDIUM):** Ajout de la sortie correcte de l'état "loading" (`setLoading(false)`) lorsque `eleveId` est null/indéfini, pour prévenir le Skeleton infini.
- ✅ **Fix #6 (MEDIUM):** Ajout de la réinitialisation de `selectedYear` lors du changement d'`eleveId` pour s'assurer que la timeline sélectionnée se synchronise avec les données de l'étudiant.
- ✅ **Fix #7 & #8 (LOW):** Correction de la typo dans les notes ("skel eton") et suppression de l'appel `String()` redondant pour la vérification du numéro de trimestre.

### File List

- `app/api/school_ai/eleves/[id]/history/route.js` [NEW] — GET endpoint historique Admin-only
- `app/components/HistoriqueBlock.jsx` [NEW] — Composant lecture seule historique complet
- `app/assets/scss/components/NOTES/historiqueBlock.scss` [NEW] — Styles HistoriqueBlock (Design Tokens CSS)
- `app/assets/scss/index.scss` [MODIFY] — `@use historiqueBlock.scss` ajouté
- `app/components/EleveDetailContent.jsx` [MODIFY] — Import + intégration `HistoriqueBlock`, `alert('okkkk')` retiré, inline styles remplacés par classes Sass
- `app/api/_/models/ai/Eleve.js` [MODIFY] — `console.log("iii")` debug retiré
- `tests/e2e/story-1-5-historique.spec.ts` [NEW] — Tests E2E RBAC pour l'endpoint historique
