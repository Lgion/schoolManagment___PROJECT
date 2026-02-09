Idées évolution app école (conversation gemini)
https://gemini.google.com/app/951a0c213d4a23a1?hl=fr






- rajouter une date aux notes, et s'assurer que y'a des coefficients dans la moyenne affichée
DONE
- dans la page Eleves permettre de créer la liste de toutes les matières en un clic, et définir si c'est une composition officiel ou pas
DONE
- quand je fais une opération CRUD sur une classe un prof ou un élève, le localstorage doit etre nettoyé. C'est déjà peut etre le cas, mais il faut un bouton pour recharger le localstorage manuellement
DONE
- il faut rajouter des filtres sur la page
    - des eleves
    - de la classe, un filtre sur les eleves de la classe
DONE
- pour le header:
    - afficher une photo iconique  de ESMP à la place de l'icone, puis placer une photo de l'école en fond du header à la place de la couleur bleuatre actuelle
    WIP
    - avoir une jolie animation pour le texte "École Martin de Porrès de Bolobi"
    DONE
    - mettre icones de contact, signin/up/out, account, et créer un affichage au survol standardisé pour les 3 (jolies effets, positions définis, mais semblables pour les 3) 
    WIP 90% -- need to be customizable
- correctifs mobile:
    - le menu de navigation doit etre dans le header (donc toujours accéssible en sticky)
    DONE
    - au clic sur m enu navigation, le scroll doit basculer en bas jusqu'au contenu fraichement affiché (.ecole-admin__content)
    SOLVED
    - la largeur de la modal d'affichage doit etre mieux géré (notamment pour le responsive), le scroll horizontale doit etre éliminé
    SOLVED
    - la largeur de la modal d'édition doit etre mieux géré
    SOLVED
    - un bouton fermé sur les modales doit etre réintégré
    SOLVED
    - le contenu des modales de eleve, prof ou classe, doit etre du contenu fordable et foldé par défaut, et le toggle du fold doit etre au clic sur le titre concerné
    DONE
    - qlq problemes css:
        - réduire une modale (eleve,prof ou classe) doit etre UX design ready (no css bug)
        DONE
        - la modale doit s'afficher en fixed, et permettre le scroll vertical de son contenu
        DONE
    - l'affichage du filtre (eleve,prof,classe) doit etre corrigé
    DONE
    - le mode ligne/grille du filtre semble avoir un légé bug encore
    DONE

- lors de l'enregistrement d'une classe, eleve ou prof, il faut que l'on puisse utiliser la caméra du péroiphérique pour persister la photo en base
DONE
- sur page Classes, mettre un tableau récapitulatif des notes (comme sur les feuille papier), il doit etre possible de filtrer alphébétioquement ou par moyenne. Ce doit etre un module qui avec boutons permettants de choisir la composition désirée.
WIP ALMOST DONE =>  VÉRIFIER SI LA MOYENNE GÉNÉRALE PEUT S'AFFICHER, ET LA MOYENNE PAR (CHOIX DU) TRIMESTRE AUSSI.
- le systeme de gestion et présentation des paiements des frais de scolarité et d'internat
DONE
- la gestion et présentation des absence, bonus, e malus (abandon). Voir s'il n'est pas nécessaire de rajouter des champs comme: 
    + la personne (le prof ou l'admin) qui a déclaré le bonus/malus/absence
    WIP
    + ...et ctout jcrois bien
WIP ALMOST DONE
- dans page eleves, il faut rajouter un filtre pour les internes, et que soit spécifier le nombre d'internes actuel.
DONE
- il faut un loading spinner quand je valide un formulaire (edit eleve, prof, classe)
FAILED
- Sur la page d'édition d'un eleve, il faut mettre le select.compositions-block__year-select dans le header.modal__header de la modal. Que proposes-tu, utiliser un Portal, ou as-tu une meilleur solution/proposition ?.
DONE
- dans la page d'une classe, il faut
    + un bouton dans le div.person-detail__block.person-detail__block--students>h2.person-detail__subtitle: permettant de rajouter à la volé, 1 ou plusieurs élèves à cette classe. Il faut en plus de update le modele Classe, il faut dans un middleware mongodb aussi update le modele Eleve pour tous les élèves updated par le formulaire d'édition de la classe.
    DONE
    + un bouton permettant de dupliquer la classe pour l'année en cours. Le callback de ce bouton doitmavérifier d'abord si une classe existe déjà pour l'année en cours, puis ne la dupliquer que si la classe pour l'année en cours n'existe pas, sinon déclencher un tooltip disant "Une classe pour l'année en cours existe déjà"
    ==>> Ce bouton devrait plutot etre dans div.classe-card à coté de button.classe-card__editbtn
    WIP
- dans la page Classe, permettre de créer la liste des 6 classes en un clic, seulement si aucune classe de l'année scolaire en cours n'existe (on considère que l'année scolaire suivante commence toujours en juillet)
- trouver un moyen pour persister et récupérer les fichiers dans le cloud
DONE
    + qu'en est-il des documents, sont-ils eux aussi bien persistés, comment sont ils rangés, etc ?






- avoir une page administration, où un formulaire de configuration permet de facilement voir et éditer les informations concernant les 3 schéma principaux: eleves, enseignants, classes
WIP fonctionnalités scanner image pour extraire données (ex: composition)
- avoir des permissions d'action plus modulaire (pour admin, prof, eleve, public). Définir l'ensemble des actions possibles, puis appliquer des restrictions/permissions à chacune
WIP almost DONE
- Les professeurs doivent pouvoir poser un rapport ecrit hebdomadaire.
WIP mise en page à revoir, et encore quelque fonctionnalités à ajouter je pense 
- fonctionnalités d'anniversaire
WIP, almost DONE, il faut rajouter un petit module permettant de lister les anniversaire à venir(les 10 suivants, ou ceux du mois en cours et suivant)
- assainir le code le plus possible, et optimiser la vitesse d'affichage, réduire la charge de sur processeur, etc. Commencer par le scss, puis clore par le jsx
- vérifier quand je crée un eleve prof ou classe si un dossier est bien créé dans /public/school/
