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
    - avoir une jolie animation pour le texte "École Martin de Porrès de Bolobi"
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

- lors de l'enregistrement d'une classe, eleve ou prof, il faut que l'on puisse utiliser la caméra du péroiphérique pour persister la photo en base
WIP
- sur page Classes, mettre un tableau récapitulatif des notes (comme sur les feuille papier), il doit etre possible de filtrer alphébétioquement ou par moyenne. Ce doit etre un module qui avec boutons permettants de choisir la composition désirée.
- le systeme de gestion et présentation des paiements des frais de scolarité et d'internat
- la gestion et présentation des absence (abandon)
- quand on clique et que le loading apparait, il faut aussi qu'en meme temps le contenu en cours prennent une opacity:0; en transition, où alors lui rajouter une propriété pointer-events:none; afin d'empecher toute intéraction pendant le loading






- dans la page Classe créer la liste des 6 classes en un clic

