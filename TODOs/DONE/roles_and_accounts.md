# Spécification Technique : Gestion des Comptes (Parents & Élèves) et Rôles Utilisateurs

## 1. Objectifs de la Fonctionnalité

L'objectif est de structurer précisément comment les familles s'authentifient sur l'application, en définissant des accès différenciés entre un parent et un élève, le tout sans alourdir la base de données avec de nouvelles collections redondantes (comme une collection `Parents`).

**Principes clés :**
- **Simplicité pour les familles (Fratrie) :** Un parent utilisant son adresse email pour s'inscrire verra automatiquement tous ses enfants rattachés à son compte (via une correspondance d'email).
- **Autonomie de l'élève :** Si un élève (collège, fin de primaire) possède son propre contact, il peut avoir son propre espace, totalement indépendant du compte parent, favorisant sa responsabilité.
- **Automatisation :** Le rôle de l'utilisateur (`parent` ou `eleve`) et ses permissions sont déterminés automatiquement lors de son inscription/connexion via le Webhook Clerk.

---

## 2. Modèle de Données (Base de Données)

L'architecture s'appuie sur une évolution des modèles existants.

### A. Évolution du Modèle `Eleve` (`app/api/_/models/ai/Eleve.js`)
L'élève centralise les clés de correspondance (emails) :
1. **Emails des Parents :** Le champ existant `parents: { mere: "", pere: "", phone: "" }` (Ligne 19) doit être enrichi en ajoutant le sous-champ `email: ""`. 
   *Exemple : `parents: { mere: "", pere: "", phone: "", email: "" }`*
2. **Contact propre de l'Élève :** Ajout des champs à la racine du modèle pour gérer l'élève autonome.
   * `studentEmail: { type: String, default: "" }`
   * `studentPhone: { type: String, default: "" }`

### B. Évolution du Modèle `User` (`app/api/_/models/ai/User.js`)
Le modèle Utilisateur est adapté pour gérer nativement les parents :
1. **Nouveau Rôle :** L'énumération du champ `role` est mise à jour : `['admin', 'prof', 'eleve', 'parent', 'public']`.
2. **Liaison des enfants :** Dans le sous-objet `roleData`, on ajoute un tableau de références :
   * `childrenRefs: [{ type: Schema.Types.ObjectId, ref: 'ai_Eleves_Ecole_St_Martin' }]`

---

## 3. Logique d'Authentification (Webhook Clerk)

Le fichier `app/api/webhooks/clerk/route.js` centralise l'intelligence de la distribution des rôles. La fonction `determineUserRole(identifier)` (l'identifiant pouvant être un **email** ou un **numéro de téléphone**) suivra cet algorithme strict :

1. **Vérification Admin :** L'identifiant figure dans la variable d'environnement Admin ? ➡️ Rôle `admin`.
2. **Vérification Professeur :** L'identifiant est trouvé dans la collection `Teacher` ? ➡️ Rôle `prof` avec `teacherRef`.
3. **Vérification Élève (Compte autonome) :** L'identifiant correspond-il au champ `studentEmail` ou `studentPhone` d'un document `Eleve` ? 
   ➡️ Rôle `eleve`, et `roleData.eleveRef` est assigné.
4. **Vérification Parent (Compte famille) :** L'identifiant correspond-il au champ `parents.email` ou `parents.phone` de documents `Eleve` ?
   - L'API effectue un `find` pour récupérer **TOUS** les élèves ayant cet identifiant parent (gérant ainsi naturellement les fratries).
   - ➡️ Rôle `parent`. Les IDs des élèves trouvés sont injectés dans `roleData.childrenRefs`.
5. **Défaut :** ➡️ Rôle `public`.

---

## 4. Workflow de Création de Compte (Tâche L34)

La création de compte (particulièrement pour un élève) peut se faire de deux façons :
1. **Automatiquement à la création (API Backend) :** Lors de la création d'un document `Eleve` (via le formulaire d'ajout), si un `studentEmail` ou `studentPhone` est fourni, le backend exécutera un appel direct à l'API Backend de Clerk (`clerkClient.users.createUser()`) pour instancier le compte Clerk de l'élève avec l'identifiant fourni, permettant par la suite l'envoi d'une invitation. (Il en sera de même pour le Parent s'il est renseigné à la création).
2. **Postérieurement via l'UI (Page Profil) :** Un bouton "Activer l'accès autonome" sera présent sur la page de profil d'un élève. En cliquant dessus, l'Admin ou le Professeur pourra renseigner un formulaire contenant `studentEmail` ou `studentPhone` (si non fournis initialement). À la validation, cela mettra à jour le document `Eleve` en BDD et fera l'appel à l'API Clerk pour générer le compte.

---

## 5. Impact Interface et Redirection (UI)

*   **Pour le Parent (`role: 'parent'`) :** À la connexion (via email ou téléphone), il arrive sur un tableau de bord listant la fratrie. Il accède aux communications officielles, factures, et suivi global.
*   **Pour l'Élève (`role: 'eleve'`) :** À la connexion (via email ou téléphone), il arrive sur son espace de travail (Devoirs, Jeux pédagogiques, Communication directe avec le prof).

---

## 6. Étapes d'Implémentation Recommandées

1. **Mise à jour des Modèles :** Modifier `Eleve.js` (ajout `email` dans `parents` et `studentEmail`) et `User.js` (rôle parent et `childrenRefs`).
2. **Mise à jour du Webhook :** Refactoriser `route.js` pour intégrer la nouvelle logique de détection et la gestion des correspondances multiples (fratrie).
3. **Interface Utilisateur :** Adapter le composant `RoleIndicator` et les `PermissionGate` dans le Frontend pour reconnaître et gérer l'affichage spécifique du rôle `parent`.
