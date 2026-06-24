# Spécification Technique : Architecture Multi-Tenant, Onboarding et Mode Bac à Sable Isolé

## 1. Vision et Objectifs
Cette spécification définit la transformation de l'application de gestion scolaire en un produit SaaS (Software as a Service) multi-tenant robuste, sécurisé et attractif. 

L'architecture repose sur trois piliers :
1. **Isolation stricte des données de test :** Utilisation d'une base de données MongoDB séparée (`school_erp_sandboxes`) pour toutes les données factices afin de protéger la base de production (`school_erp`) de toute pollution ou dégradation de performance.
2. **Stratégie de croissance axée sur le produit (PLG) :** Une landing page compétitive avec un mode démonstration immersif incluant un **sélecteur de rôles** et des **fenêtres d'upsell** (IA et Scanner visibles mais bloqués).
3. **Flux d'Onboarding et d'Approbation contrôlé :** Un processus d'inscription fluide pour les utilisateurs du bac à sable, combiné à un système d'approbation par e-mail pour le Super-Admin avant l'ouverture d'une école réelle.

---

## 2. Architecture des Bases de Données (Multi-Tenancy)

Pour garantir la sécurité et les performances, l'application se connectera dynamiquement à deux bases de données distinctes sur le même cluster MongoDB (ou des clusters différents selon la configuration du `.env`).

```
                              [ Navigateur Client ]
                                        |
                    (Requête avec x-school-key & x-tenant-mode)
                                        v
                                 [ API Next.js ]
                                        |
                            [ Connection Resolver ]
                                   /        \
                    (Mode Production)      (Mode Sandbox)
                                 /            \
                                v              v
                     [( MongoDB: school_erp )]  [( MongoDB: school_erp_sandboxes )]
```

### A. Connexions MongoDB Dynamiques
Deux variables de connexion seront définies dans le fichier `.env` :
*   `MONGODB_URI` : Pointe vers la base de production `school_erp`.
*   `MONGODB_SANDBOX_URI` : Pointe vers la base isolée `school_erp_sandboxes` (ex: `mongodb+srv://.../school_erp_sandboxes?...`).

Le connecteur de base de données backend (`dbConnect.js`) sera mis à jour pour renvoyer la connexion appropriée en fonction du mode demandé par le client (passé via les en-têtes HTTP `x-tenant-mode` ou déduit de la clé `schoolKey`).

### B. Évolution des Schémas de Données
Tous les schémas existants (`Classe`, `Eleve`, `Teacher`, `Event`, `Message`, etc.) intègrent le champ suivant :
```javascript
schoolKey: { 
  type: String, 
  required: true, 
  index: true 
}
```
*   **Indexation :** Un index composé `{ schoolKey: 1, ... }` est créé sur chaque collection pour garantir des requêtes ultra-rapides, même si le nombre d'écoles grandit.
*   **Rétrocompatibilité :** Pour l'école historique "École Saint-Martin", la clé par défaut sera `"ecole_st_martin"`.

---

## 3. Gestion des Comptes et Propriété (Clerk & DB)

L'appartenance et la gestion des rôles ne sont plus définies de manière rigide dans le fichier `.env`. Elles sont persistées en base de données pour permettre une dynamicité complète.

### A. Le Modèle `Institution` (ou `School`)
Un nouveau modèle représente un établissement physique ou virtuel :
```javascript
const schoolSchema = new mongoose.Schema({
  schoolKey: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  logo: { type: String, default: "/school/logo.webp" },
  ownerClerkId: { type: String, required: true, index: true }, // Liaison avec le propriétaire
  isReal: { type: Boolean, default: false }, // true = Production, false = Sandbox
  createdAt: { type: Date, default: Date.now }
});
```

### B. Gestion des Admins Historiques (Saint-Martin)
Pour préserver le fonctionnement actuel sans perturbation, les adresses e-mails listées dans la variable d'environnement `NEXT_PUBLIC_EMAIL_ADMIN` (ex: `hi.cyril@gmail.com`, `puissancedamour@yahoo.fr`, `legion.athenienne@gmail.com`) seront automatiquement associées à l'école `"ecole_st_martin"` lors de leur première connexion, leur octroyant le rôle `admin` sur cette école réelle.

---

## 4. Parcours Utilisateur & Expérience Produit (PLG)

```
[ Visiteur Anonyme ] ──( 1. Découvrir la Démo )──> [ Landing Page ]
                                                        │
                                           ( 2. Génère école factice )
                                                        │
                                                        v
[ S'inscrit via Clerk ] <──( 4. Sauvegarde )── [ Dashboard Sandbox ] <──( 3. Teste Rôles via sélecteur )
          │
  ( 5. Demande école réelle )
          │
          v
  [ Super-Admin (Moi) ] ──( 6. Email: Accepter/Refuser )──> [ Approuvé ]
                                                                 │
                                                   ( 7. Bouton "Créer école" )
                                                                 │
                                                                 v
                                                     [ Tunnel /onboarding ]
```

### A. La Nouvelle Landing Page
La landing page sera entièrement reconstruite pour présenter les fonctionnalités avancées ajoutées récemment (cahier de texte, bulletins, messagerie, système de points, visio). Elle intègrera des appels à l'action (CTA) clairs :
1.  **"Visiter la Démo Générale" :** Connecte instantanément l'utilisateur à une école bac à sable pré-remplie standard (ex: *École des Sorciers*).
2.  **"Créer ma propre démo personnalisée" :** Ouvre un formulaire rapide (Nom de l'école fictive, logo, textes d'accueil) pour générer une simulation sur-mesure.

### B. Le Sélecteur de Rôles (Sandbox)
Dans le mode Bac à Sable, une barre flottante (Widget) est visible en bas ou en haut de l'écran. Elle permet en un clic de basculer d'identité sans reconnexion :
*   **Simuler un Élève :** Voir ses devoirs, ses bons points, son espace de travail.
*   **Simuler un Parent :** Voir le suivi des enfants, payer fictivement les frais.
*   **Simuler un Enseignant :** Faire l'appel, remplir le cahier de texte, attribuer des points.
*   **Simuler un Administrateur :** Configurer les frais, gérer le personnel.

### C. Inscription & Conversion
*   **Transition Fluide :** Si un utilisateur anonyme s'inscrit via Clerk *pendant* sa session de test, la clé `schoolKey` de son école bac à sable (présente dans sa session) est immédiatement écrite dans son document `User` en base de données. Son école fictive lui appartient désormais officiellement.
*   **Utilisateur déjà connecté :** S'il crée une démo alors qu'il est déjà connecté, elle est instantanément rattachée à son compte.

---

## 5. Flux de Demande d'École Réelle & Approbation

Un utilisateur possédant une école Sandbox peut demander à passer en production pour son véritable établissement.

### A. La Demande (/myaccount)
Sur la page `/myaccount` (accessible à tous les utilisateurs connectés), si l'utilisateur ne possède pas encore d'école réelle, un formulaire simplifié est affiché :
*   *Champs :* Nom officiel de l'école, nombre d'élèves prévu, adresse physique, téléphone, message de motivation.
*   *Action :* La soumission enregistre la demande en base de données et déclenche l'envoi d'un e-mail structuré au Super-Admin.

### B. L'E-mail d'Approbation pour le Super-Admin
L'e-mail envoyé au Super-Admin contient les détails de la demande et deux liens d'action rapide :
1.  **Lien d'Approbation :** `https://.../api/admin/approve-school?userId=USR_ID`
2.  **Lien de Refus :** `https://.../api/admin/decline-school?userId=USR_ID`

Ces API sécurisées (réservées au Super-Admin) mettent à jour le statut de l'utilisateur en base de données (ex: `realSchoolStatus: 'approved' | 'declined'`).

### C. Le Déclenchement de l'Onboarding
Dès que le statut passe à `'approved'`, lors de la prochaine connexion de l'utilisateur :
1.  Un bouton fixe bien visible apparaît sur son écran : **"Créer mon établissement officiel"**.
2.  Ce bouton le redirige vers `/onboarding` pour configurer la véritable école (cette fois enregistrée dans la base de données de production `school_erp`).
3.  L'utilisateur obtient le rôle `admin` sur cette nouvelle école réelle.

---

## 6. Restrictions et Upselling dans le Bac à Sable

Pour encourager la conversion vers une école réelle tout en limitant les coûts d'infrastructure (API Gemini, stockage Cloudinary), certaines fonctionnalités sont restreintes dans la Sandbox.

### A. Fonctionnalités Désactivées
*   **Le Scanner de Documents :** Impossible de téléverser et d'analyser des documents (comme les grilles d'emploi du temps ou les bilans).
*   **L'Intelligence Artificielle (Gemini) :** Désactivation de la génération de jeux pédagogiques personnalisés ou d'analyses IA.

### B. Règle d'Or de l'UX (L'effet de vitrine)
*   **Ne pas masquer les boutons :** Les boutons de ces fonctionnalités restent parfaitement visibles et esthétiques.
*   **Le Modal d'Upsell :** Au clic sur un bouton restreint, un modal premium s'ouvre :
    > *"Cette fonctionnalité utilise notre technologie d'intelligence artificielle et d'analyse de documents. Elle est réservée aux établissements officiels. [Faire une demande d'école réelle]"*

---

## 7. Plan de Nettoyage de la Sandbox

Pour éviter l'accumulation de données inutiles dans `school_erp_sandboxes` (surtout pour les démos créées par des utilisateurs anonymes qui ne s'inscrivent jamais) :
*   Un **script de nettoyage automatique (Cron Job)** s'exécute toutes les nuits.
*   Il supprime toutes les données (élèves, classes, etc.) associées à des `schoolKey` de type `sandbox_*` créées depuis plus de 48 heures, **sauf** si la clé est rattachée à un compte utilisateur Clerk enregistré.

---

## 8. Plan de Vérification (QA)

### A. Tests Automatisés (Playwright)
*   **Test du Sélecteur de Rôles :** Vérifier qu'un clic sur "Professeur" dans la barre flottante adapte instantanément le menu et les permissions sans nécessiter de login Clerk.
*   **Test d'Isolation :** S'assurer qu'une requête effectuée avec la clé `sandbox_A` ne retourne aucun élève appartenant à `sandbox_B` ou à `ecole_st_martin`.
*   **Test des Modals d'Upsell :** Simuler un clic sur "Générer un jeu par IA" en mode Sandbox et vérifier l'apparition du modal bloquant.

### B. Tests Manuels
*   Soumettre une demande d'école réelle depuis un compte test, vérifier la réception de l'e-mail par le Super-Admin, cliquer sur le lien d'approbation et valider l'accès au tunnel `/onboarding`.
