# Story 1.4: Saisie Manuelle des Notes et Absences

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Teacher,
I want pouvoir saisir manuellement des notes et des absences dans une grille de classe standard (DataTable) et les publier définitivement,
so that je puisse gérer l'évaluation de ma classe de manière traditionnelle avant même d'utiliser l'IA.

## Acceptance Criteria

1. **Given** la DataTable de la classe (page `app/classes/[id]/page.jsx`)
   **When** l'enseignant édite une note manuellement
   **Then** l'indicateur de focus est clairement visible (accessibilité, tabulation au clavier)
   **And** la saisie est sauvegardée immédiatement (Optimistic UI ou auto-save)

2. **Given** une grille de notes remplie
   **When** l'enseignant clique sur « Publier »
   **Then** les notes sont verrouillées et enregistrées définitivement en base de données
   **And** aucun rechargement de page ne se produit (Zéro Render-Storm)

3. **Given** un Enseignant connecté
   **When** il accède à la page de sa classe assignée
   **Then** il peut voir et éditer les notes/absences de ses élèves
   **And** toute donnée financière reste masquée (AC hérité de Story 1.3)

4. **Given** une note publiée
   **When** l'enseignant tente de la modifier
   **Then** le champ est en lecture seule (verrouillé visuellement) avec un indicateur clair

## Tasks / Subtasks

- [x] Task 1 : API — Endpoint pour la saisie et la publication de notes (AC: #1, #2, #4)
  - [x] 1.1 Créer ou modifier `app/api/school_ai/classes/[id]/notes/route.js` (ou PATCH sur `/api/school_ai/classes`) pour accepter une mise à jour des `compositions` d'une classe.
  - [x] 1.2 Vérifier l'accès RBAC : seuls le Teacher assigné à la classe ou l'Admin peuvent appeler cet endpoint. Utiliser le pattern `await auth()` unique (cf. Story 1.3).
  - [x] 1.3 Valider les données côté serveur : notes entre 0 et 20, type Number, absences entier ≥ 0.
  - [x] 1.4 Implémenter la logique de verrouillage : ajouter un champ `published: Boolean` (ou `locked_at: Date`) dans le schéma ou la structure `compositions` ; une fois `published=true`, l'update est refusé avec 403.

- [x] Task 2 : Frontend — DataTable de notes interactive (AC: #1, #2, #3)
  - [x] 2.1 Dans `app/classes/[id]/page.jsx`, ajouter une section de saisie de notes sous forme de tableau (par matière/trimestre).
  - [x] 2.2 Chaque cellule de note doit être un `<input type="number">` natif avec `min=0 max=20 step=0.25`, avec un style de focus fortement visible (outline Sass, pas de hardcoded hex).
  - [x] 2.3 Auto-save ou bouton « Sauvegarder » via Optimistic UI : mettre à jour le store local (`ai_adminContext`) avant la résolution de la promesse réseau.
  - [x] 2.4 Bouton « Publier » déclenche l'appel API de verrouillage ; utiliser `PermissionGate roles={['admin', 'prof']}` pour n'afficher le bouton qu'aux rôles autorisés.
  - [x] 2.5 Afficher un état « verrouillé » visuellement (cellules grises, icône cadenas) quand `published=true`.

- [x] Task 3 : Frontend — Saisie des absences (AC: #1, #3)
  - [x] 3.1 Ajouter une colonne « Absences » par élève dans la DataTable (champ `absences` sur le modèle `Eleve`).
  - [x] 3.2 Input numérique entier ≥ 0 avec le même pattern de focus accessible.
  - [x] 3.3 Save via PATCH `/api/school_ai/eleves/[id]` (endpoint existant) avec Optimistic UI.

- [x] Task 4 : UI/UX — Conformité Design System (AC: #1, #2)
  - [x] 4.1 Respecter les Design Tokens Sass (`$primary-navy`, `$accent-orange`, `_colors.scss`) pour l'état de focus, les cellules verrouillées et le bouton Publier.
  - [x] 4.2 Aucun spinner global bloquant : pendant la sauvegarde, afficher un Skeleton ou indicateur ciblé sur la ligne modifiée.
  - [x] 4.3 Toast de succès non bloquant après validation/publication (pattern existant dans le projet).

## Dev Notes

### Architecture Compliance (CRITIQUE — ne pas déroger)

- **RBAC**: Utiliser `const { userId, sessionClaims } = await auth();` une seule fois par handler (pattern Story 1.3 établi). Ne jamais appeler `checkRole()` deux fois dans le même handler.
- **Hub API**: Tous les appels réseau passent par `/api/school_ai/`. Ne pas créer d'endpoint hors de ce hub.
- **Optimistic UI**: Mettre à jour le store `ai_adminContext` *avant* l'appel réseau; rollback en cas d'échec (toast d'erreur discret).
- **Zero Debug Logs**: Aucun `console.log("debugstring")` ou `console.log(variable)` non informationnel en production. Seuls les `console.error` dans les blocs `catch` sont acceptables.
- **Sass Only**: Toutes les couleurs DOIVENT provenir de `app/assets/scss/_variables.scss` ou `_colors.scss`. Aucune couleur hex `#xxx` inline dans les `.jsx`.

### Schéma de données — Référence critique

**`Classe` (modèle: `ai_Ecole_St_Martin`)** — `app/api/_/models/ai/Classe.js`
```js
compositions: { default: [], type: Array }   // tableau libre de sessions de notes
coefficients: { default: {}, type: Object }   // coefficients par matière {"0": 4, "1": 4, ...}
moyenne_trimetriel: { default: ["","",""], type: [String] }  // 3 valeurs (3 trimestres)
```

**`Eleve` (modèle: `ai_Eleves_Ecole_St_Martin`)** — `app/api/_/models/ai/Eleve.js`
```js
compositions: { type: Object }   // structure: { "annee": { matiere: note, ... } }
absences: { type: Object }        // structure: { "annee": { count: Number, ... } }
```

> ⚠️ **Attention**: La structure exacte des `compositions` sur `Eleve` est un Object libre. Consulter les données existantes en base via le composant `CompositionsBlock` (`app/components/EntityModal.jsx`) avant d'écrire le nouvel endpoint pour rester compatible.

### Composants existants à réutiliser (Zero-Waste)

| Composant | Chemin | Usage prévu |
|-----------|--------|-------------|
| `CompositionsBlock` | `app/components/EntityModal.jsx` | Affichage existant des notes par élève — s'en inspirer pour la DataTable éditable |
| `AbsencesBlock` | `app/components/EntityModal.jsx` | Affichage existant des absences — réutiliser ou adapter |
| `PermissionGate` | `app/components/PermissionGate.jsx` | Conditionner boutons Publier/Éditer selon le rôle |
| `ai_adminContext` | `stores/ai_adminContext.js` | Store de données — y ajouter les actions de mise à jour des notes/absences avec Optimistic UI |

### Pattern de route authentifiée — Modèle à suivre (Story 1.3)

```js
// Pattern OBLIGATOIRE — single auth() call
export async function PATCH(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const userRole = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;
    const isAdmin = userRole === Roles.ADMIN;
    const isTeacher = userRole === Roles.TEACHER;

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    await dbConnect();
    // ...
  } catch (error) {
    return NextResponse.json({ error: '...', details: error.message }, { status: 500 });
  }
}
```

### Vérification d'appartenance Teacher → Classe

Avant toute écriture par un Teacher, vérifier que la classe lui est bien assignée :
```js
const user = await User.findOne({ clerkId: userId }).populate('roleData.teacherRef');
const isOwner = user?.roleData?.teacherRef?.current_classes
  ?.some(id => id.toString() === params.id);
if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
```

### Verrouillage — Design de la structure `published`

Deux approches possibles selon la granularité choisie :
- **Option A (recommandée)** : Ajouter `published_at: Date | null` dans la structure `compositions` de chaque session. Si non null → refus de modification.
- **Option B** : Flag booléen `compositions_locked: Boolean` sur le document Classe. Plus simple mais moins granulaire (verrouille toutes les sessions).

Choisir l'option selon l'avis de l'équipe ; documenter le choix dans les Completion Notes.

### Project Structure Notes

- **Page principale à modifier**: `app/classes/[id]/page.jsx` (159 lignes existantes — la section notes/compositions est dans la moitié basse)
- **API à créer ou étendre**: soit PATCH sur `/api/school_ai/classes/route.js` (en passant l'`_id` dans le body), soit nouvelle route `/api/school_ai/classes/[id]/route.js`
- **Store**: `stores/ai_adminContext.js` — ajouter `saveNotes(classeId, compositions)` et `publishNotes(classeId)` avec Optimistic UI

### Testing Requirements

- **Backend**: Tester que :
  - Un Teacher ne peut pas modifier les notes d'une classe qui ne lui est pas assignée (403)
  - Un Teacher ne peut pas modifier des notes déjà publiées (403)
  - Les notes hors-range (< 0 ou > 20) sont rejetées (400)
  - Un Admin peut modifier/publier n'importe quelle classe
- **Frontend**: Vérifier que le focus visible est présent sur chaque cellule au clavier, et que le Optimistic UI se déclenche avant la résolution réseau

### Previous Story Intelligence

**Story 1.3 — Leçons critiques:**
- ❌ Piège évité: `auth()` sans `await` retourne une Promise, pas le userId → `userId` sera toujours truthy → l'accès ne sera jamais bloqué. **Toujours mettre `await`.**
- ❌ Piège évité: Appeler `checkRole()` deux fois dans le même handler = 2 round-trips Clerk inutiles. Utiliser le pattern `sessionClaims?.metadata?.role` après un unique `await auth()`.
- ✅ Pattern établi: `PermissionGate role="admin"` pour masquer les données financières.
- ✅ Pattern établi: Calculs sensibles déplacés à l'intérieur du rendu conditionnel admin.

**Story 1.2 — Leçons critiques:**
- ✅ Optimistic UI: Store mis à jour avant résolution réseau, rollback sur erreur.
- ✅ Render-Storm free: Composants définis hors des Providers ; `useMemo` sur le contexte.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md#Story-1-4`] — User story et ACs
- [Source: `_bmad-output/planning-artifacts/architecture.md#Optimistic-UI`] — Pattern mutation optimiste
- [Source: `_bmad-output/planning-artifacts/architecture.md#Styling-Tokenization`] — Règle Sass Design Tokens
- [Source: `app/api/_/models/ai/Classe.js`] — Schéma `compositions`, `coefficients`
- [Source: `app/api/_/models/ai/Eleve.js`] — Schéma `compositions`, `absences`
- [Source: `app/api/school_ai/classes/route.js`] — Pattern RBAC single-auth établi en Story 1.3
- [Source: `app/components/EntityModal.jsx`] — `CompositionsBlock`, `AbsencesBlock` existants
- [Source: `app/components/PermissionGate.jsx`] — Composant RBAC frontend

## Dev Agent Record

### Agent Model Used

gemini-2.5-pro

### Debug Log References

N/A

### Completion Notes List

- ✅ Task 1: Créé `PATCH /api/school_ai/eleves/[id]/route.js` — single `await auth()`, ownership check Teacher→Classe, validation notes (0 à `sur`), validation absences (entier ≥ 0).
- ✅ Task 1.4 (locking): Vérification server-side du verrouillage `_locked` sur le trimestre — reject 400 si Teacher, Admin peut override.
- ✅ Task 2: Créé `NotesEntryBlock.jsx` — DataTable éditable, inputs `type="number"` avec focus visible, bouton `Enreg.` par ligne (Optimistic UI via `saveEleveNotes`), bouton `Publier et verrouiller` global.
- ✅ Task 2.5: État verrouillé visuellement — notice 🔒 avec message, formulaire masqué quand `_locked=true`.
- ✅ Task 3: Colonne Absences intégrée dans `NotesEntryBlock`, sauvegardée via `saveEleveAbsences` (PATCH même endpoint).
- ✅ Task 4: Sass `notesEntry.scss` — 100% CSS custom properties, focus outline 3px primary-light (accessible), transitions douces sur boutons, row highlight success/error, aucun hex inline.
- ✅ Contexte: `saveEleveNotes` et `saveEleveAbsences` ajoutés à `ai_adminContext.js` avec Optimistic UI complet (update avant réseau, revert sur erreur).
- ✅ Nettoyage: Tous les `console.log` de debug retirés de `app/classes/[id]/page.jsx` (conformité Zero Debug Logs).

**Code Review Fixes Applied (8 issues):**
- Fix #1: Remplacé `PermissionGate` dans `<tr>`/`<thead>` par `useUserRole()` conditionnel (HTML invalide)
- Fix #2: Ajouté vérification `_locked` server-side dans l'API route (AC #4)
- Fix #3: Ajouté état verrouillé visuellement avec notice 🔒 (AC #4)
- Fix #4: Remplacé lecture stale de `errorMap` par résultats directs de `Promise.all`
- Fix #5: Retiré imports inutilisés (`Classe`, `checkRole`) dans l'API route
- Fix #6: Remplacé styles inline par classes Sass (`--entry`, `--sm`)
- Fix #7: Timestamp de session généré une seule fois via `useRef` (idempotence)
- Fix #8: Retiré `isCurrentOrFutureYear` (code mort)

### File List

- `app/api/school_ai/eleves/[id]/route.js` [NEW] — PATCH endpoint RBAC pour notes et absences d'un élève (à jo avec locking)
- `stores/ai_adminContext.js` — Ajout `saveEleveNotes`, `saveEleveAbsences` (Optimistic UI)
- `app/components/NotesEntryBlock.jsx` [NEW] — DataTable de saisie manuelle des notes et absences (rewritten post-review)
- `app/assets/scss/components/NOTES/notesEntry.scss` [NEW] — Styles NotesEntryBlock + locked-notice (Design Tokens CSS)
- `app/assets/scss/index.scss` — `@use`, `--entry` block, `--sm` subtitle
- `app/classes/[id]/page.jsx` — Import + intégration `NotesEntryBlock`, dead code et inline styles retirés
