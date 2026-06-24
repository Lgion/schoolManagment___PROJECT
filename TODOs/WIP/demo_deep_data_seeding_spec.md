# 🧬 Spécification : Seeding de Données Profondes (Demo Ultra-Réaliste)

L'objectif de cette spécification est de définir les algorithmes et les données requises pour générer un environnement de démonstration "plus vrai que nature" couvrant 6 années scolaires (2020 à 2026). Ce réalisme est crucial pour déclencher l'effet "Wahou" chez les prospects.

## 1. Pédagogie : Notes, Compositions et Bulletins (`Eleve`, `Classe`, `ReportCard`)

### Données à générer :
- **Matières et Coefficients (`Classe.coefficients`)** : 
  - CP1/CP2 : Mathématiques (Coef 2), Français (Coef 3), Éveil (Coef 1).
  - CE1/CE2/CM1/CM2 : Mathématiques (Coef 3), Français (Coef 3), Histoire/Géo (Coef 2), Sciences (Coef 2).
- **Notes (`Eleve.notes`)** :
  - Génération de 3 trimestres complets par année.
  - Pour chaque trimestre, 3 types d'évaluations par matière : "Devoir Maison" (DM), "Interrogation Surprise" (IS), "Évaluation Finale" (EF).
  - Algorithme de progression : Un élève aura un profil aléatoire (Excellent, Moyen, Difficultés) qui influencera ses notes (ex: un excellent aura entre 14 et 19, un élève en difficulté entre 7 et 12).
- **Bulletins figés (`ReportCard`)** : 
  - Pour la dernière année (2025-2026), générer les bulletins officiels (`ReportCard`) du Trimestre 1 et 2 pour démontrer la fonctionnalité d'archivage des bulletins.

## 2. Administration et Suivi : Absences et Frais de Scolarité (`Eleve`, `AttendanceRecord`)

### Données à générer :
- **Frais de scolarité (`Eleve.scolarity_fees_$_checkbox`)** :
  - Simuler un historique de paiements.
  - Pour chaque année passée, l'élève a payé (valeur `true`).
  - Génération de `PointTransaction` (Reçus de paiement) avec des dates étalées sur les mois de Septembre à Décembre de chaque année.
- **Absences et Retards (`AttendanceRecord` & `Eleve.absences`)** :
  - Création de sessions d'appels (`AttendanceRecord`) aléatoires pour les classes.
  - Pour un élève moyen : 2 à 5 absences par an (mix entre "Maladie" justifiée et "Retard" non justifié).
  - Pour les 6 classes : Génération d'un appel complet pour "Aujourd'hui" (Date du jour) avec quelques absents.

## 3. Communication et Suivi Psychologique (`Eleve.commentaires`, `Classe.reports`)

### Données à générer :
- **Commentaires Individuels (`Eleve.commentaires`)** :
  - Au moins 2 commentaires rédigés par an par le professeur principal.
  - Exemples : *"Progression remarquable ce trimestre"*, *"Attention au bavardage"*, *"Travail sérieux mais manque de participation"*.
- **Rapports de Classe (`Classe.reports`)** :
  - Un compte-rendu du Conseil de Classe par trimestre.
  - Exemple : *"Bilan T1 : Une classe dynamique et motivée, malgré un niveau hétérogène en mathématiques."*

## 4. Organisation : Emplois du Temps Uniques (`Schedule`)

### Données à générer :
- Finis les EDT copiés-collés. Chaque classe doit avoir son propre `Schedule` avec :
  - Répartition des matières (`Subject`) logique sur la semaine (Lundi au Vendredi).
  - Des pauses intégrées (`BREAK`) : Récréation du matin (10h-10h15), Pause déjeuner (12h-14h).
  - Des volumes horaires cohérents (plus de français/maths, moins de sport).

## 5. Vie Sociale et Évènements (`Post`, `Group`, `GroupMessage`)

### Données à générer :
- **Le Mur de l'École (Global Posts)** :
  - 10 annonces globales réparties sur les 6 ans (Fête de l'école, Journées portes ouvertes, Alertes météo).
  - Sondages (Polls) : Ex: *"Où voulez-vous aller pour la sortie de fin d'année ?"*.
- **Le Blog Public** :
  - 3 à 4 articles de blog avec images (Carnaval, Compétition de sport, Projet Sciences).
- **Groupes de discussion (`Group`)** :
  - Un groupe "Parents & Profs" par année et par classe.
  - Historique de discussion de 5 à 10 messages par groupe.
- **Évènements Spéciaux (Agenda)** :
  - Réunions parents-professeurs, jours fériés, vacances scolaires.

## 6. Architecture d'Exécution (Refactoring du script)

Pour éviter un fichier `route.js` ingérable (plus de 1000 lignes), la logique de génération sera modularisée, potentiellement en utilisant des sous-fichiers ou des fonctions utilitaires au sein d'un répertoire `lib/seeding/` :
1. `generateAcademics()` : Notes, bulletins, coefficients.
2. `generateAttendance()` : Appels, retards, justifications.
3. `generateSocial()` : Groupes, messages, posts, blog.
4. `generateAdmin()` : Paiements, factures.
Ces fonctions s'exécuteront dans la boucle temporelle existante.
