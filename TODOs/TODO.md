# TODO List - Projet School Management

Cette liste regroupe et catégorise les tâches définies dans le projet.

## 🎓 Gestion Pédagogique et Classe
- [ ] Permettre un système de bons points.
- [ ] Rendre fonctionnel l'ajout de fichiers PDF par le prof à sa classe.
- [ ] Permettre de faire l'appel (façon Klassly).
- [ ] Permettre au prof de remplir le cahier de texte des élèves (le cahier de texte aura les clés représentant le timestamp du jour).
- [ ] Sur la page d'une classe, ajouter un bouton permettant de générer les bulletins scolaires de chaque élève, ainsi qu'un bouton pour le bilan annuel.
- [ ] Dans les pages d'une classe, en plus de pouvoir scanner le bilan d'une composition, pouvoir générer la feuille de bilan vierge en PDF.
- [ ] Pouvoir créer des groupes d'élèves, de parents, de profs ou des groupes mixtes.
- [ ] Fonctionnalités de "livre de classe" pour album photo de classe : ajouter une section dédiée dans la page d'une classe ou de son édition.
- [ ] Les élèves auront une section "livre d'élèves" (livre de classe dédié à l'élève, spécifiquement d'année en année).
- [x] Ajouter un accès aux "Jeux pédagogiques" via un bouton sur la page listant toutes les classes, ainsi qu'un bouton sur la page de chaque classe. L'accès sera public pour tous les utilisateurs sans filtrage par rôle. Depuis la page d'une classe, le contenu sera filtré selon le niveau de la classe (contenu statique pour CP1 au CE2, contenu généré par IA via PDF pour CM1 et CM2).

## 📅 Emploi du temps et Calendrier
- [x] Analyser en profondeur le systeme de d'emploi du temps déjà en place, repérer les problèmes de logique ou d'UI/UX, et définir les améliorations à y apporter.
- [x] Ajouter un calendrier pour l'école pour pouvoir y planifier des événements.
- [x] En plus de pouvoir créer des événements pour l'école, chaque classe peut créer un événement qui sera dynamiquement rajouté à l'emploi du temps de la classe.
- [x] Pour l'emploi du temps d'une classe, permettre de charger un PDF ou de prendre une photo (ne recrée pas de composant pour la photo s'il en existe déjà ailleurs) de l'emploi du temps d'une classe afin qu'il soit disponible dans le système de l'emploi du temps de la classe.
- [x] Les profs doivent aussi avoir un emploi du temps personnel (afin d'optimiser la responsabilité et la vie scolaire).

## 🤝 Communication et Rendez-vous
- [ ] Permettre de lancer une visio pour l'école (sur la page des classes) et pour une classe (sur la page d'une classe).
- [ ] Lancer un sondage (avec possibilité d'envoyer un SMS pour s'assurer que tous soient notifiés).
- [ ] Prendre rendez-vous avec un prof sur son agenda.
- [ ] Permettre à un prof de convoquer un parent.
- [ ] Créer une page blog de l'école où les élèves, parents, profs et admins peuvent créer un article.
- [ ] Messagerie / Communication : si l'élève et le parent ne partagent pas le même compte, l'élève peut directement voir ses communications avec son prof sur la page de son profil d'élève (le parent ne pourra pas voir ces communications). Sinon, les communications entre les parent et les prof seront ajoutées dans une sous-section de la page d'accueil.

## 👁️ Vues et Interfaces (UI/UX)
- [ ] La page qui s'affiche pour un parent ou un élève connecté doit inclure les vues élèves/profs/classes mais avec beaucoup plus de restrictions dans les infos affichées (ou avoir une section spéciale en en-tête pour regrouper les actions utiles selon le rôle).
- [ ] Rajouter la fonction de création du compte de l'élève directement dans la page d'un élève.
- [ ] Concevoir une interface dédiée pour le parent d'élève et une version plus spécifique dédiée à l'élève.

## ⚙️ Administration et Système
- [ ] Créer la fonctionnalité de création d'école en bac à sable (vivant temporairement dans le local session).
- [ ] Créer la fonctionnalité de générer l'école via un formulaire.
