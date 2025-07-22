---
trigger: always_on
---

- toujours privilégier l'utilisation du camelCase (éviter les -) à d'autres type de format
- en scss, toujours définir et utiliser des variables de themes, au moins 2 police de caractères, et toujours coder les composants en imbriqué, surtout les composants bem.
- toujour utiliser une nomenclature bem pour créer du jsx
- coder les composants scss bem d'abord, puis des composants react bem paramétrables pour exprimer tous les modes possible de ce composant scss bem
- cdns: icons(fontawesome), typo(gfont), lib css(shadcn,foundation,bootstrap), UI-Kit/design systèm(Google, Alibaba, IBM), lib js(animation,confetti,underscore,...)
- coder des composants react en utilisant de l'html sémantique(limiter usage div, coder html simple et le moins imbriqué possible), une nomenclature bem, de l'accessibilité ARIA et rg2a, des micro data, et pourquoi pas aussi du taggage google analytics..
- un fichier .seo contenant les mots clés seo utilisés par l'application (il devrait être auto génèré par l'IA) devra etre une référence pour créer du contenu.
- l'application utilise un gestionnaire pour localStorage. L'application doit en priorité ABSOLUE ne récupérer les données de l'application que du localStorage, si ces données n'existent pas dans le localStorage un système de fallback permet de les récupérer d'ailleurs puis de les insérer dans le localStorage afin que l'application puisse de nouveau essayer de les y récupérer. Ces données sont chargés dans le layout de l'application et transmis de composants react bem en composants react bem. La structure des données et la nomenclature de ses propriétés doit permettre au composant react bem de retourner un composant avec les éléments bem jsx adéquates pour afficher cette structure de données reçu en props.
- l'application doit utiliser des ViewTransition dans navigation pages
- quand il faut faire des modifications sur un truc pour qu'il mime le comportement d'un autre truc (composant, class scss, callback etc..) la logique DRY doit etre appliquée. C'est à dire: 1) créer une fonction commune au plus grand nombre de "truc", 2) appliquer l'utilisation de ce nouvel outils dans tous les "truc" concernés.
- une instance User doit etre inséré dans le localStorage si clerk est connecté(supprimé sinon).
- une spe.technique avec au moins le tableau de paire verbe-endpoint (chacun commenté c'est mieux(request,response,descr,..)
- un orm prêt à l'emploi (Prisma)
- (trouver une liste de base de données cloud gratuite)
- quand je dis "intègre "nom_du_composant" en bem", tu dois comprendre d'utiliser la snippet /home/nihongo/Bureau/Next15.3.3/assets/scss/code.snippet pour créer un composant scss dans le bon dossier dans /home/nihongo/Bureau/Next15.3.3/assets/scss/components (exemple dossier CARDS si c'est un composant card).