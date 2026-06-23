# Vérification : Blog de l'École (school_blog)

Ce fichier sert de checklist pour vérifier l'implémentation complète de la spécification.

- [ ] Le modèle MongoDB `Article` est créé (différent de `Post`).
- [ ] L'interface `/blog` (Journal scolaire) affiche les articles publiés (`status: PUBLISHED`).
- [ ] L'éditeur de texte riche permet la création d'articles avec mise en page et upload d'image de couverture.
- [ ] Tous les rôles (Admin, Prof, Élève, Parent) peuvent proposer un article.
- [ ] Système de Modération : Les articles d'élèves/parents passent en `PENDING_REVIEW`.
- [ ] Les modérateurs (Profs/Admins) ont une interface pour approuver ou rejeter les articles en attente.
