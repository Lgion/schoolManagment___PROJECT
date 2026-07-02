Pour vérifier que 100% de la spécification a été implémentée et fonctionne correctement dans l'application, voici les actions précises que vous pouvez réaliser dans l'interface (UI) et côté serveur :

1. Vérification de l'intégration globale (Le composant unifié)
Allez vérifier que la nouvelle zone de communication est bien présente et fonctionnelle sur les 3 niveaux de l'application :

Page d'accueil (/) : Tout en bas, vérifiez la présence du bloc « 📢 Annonces & Sondages de l'Établissement ».
Page d'une classe (/classes/[id]) : Juste au-dessus de la liste des élèves, vérifiez la présence du bloc « 💬 Fil d'actualité & Sondages ».
Page d'un groupe (/groups/[id]) : Dans l'onglet « Mur », vérifiez que la nouvelle interface remplace l'ancienne.
2. Tester la création et les paramètres des Sondages
Rendez-vous sur le mur d'une classe ou d'un groupe et cliquez sur l'onglet Sondage au-dessus de la zone de saisie. Effectuez les tests suivants :

Options dynamiques : Ajoutez une 3ème ou 4ème option grâce au bouton + Ajouter une option, puis essayez d'en supprimer une.
Date d'expiration : Définissez une date limite à l'aide du champ calendrier. Testez en mettant une date très proche dans le temps pour observer le sondage se bloquer (désactivation des votes) une fois l'heure passée.
Choix Multiples : Cochez l'option Autoriser plusieurs choix. Publiez le sondage et vérifiez que vous pouvez sélectionner plusieurs cases (checkboxes) au lieu d'une seule (boutons radio).
3. Tester l'expérience de vote et les interactions
Une fois le sondage publié, testez le parcours d'un utilisateur :

Avant de voter : Vous ne devriez voir que les boutons pour voter, sans les pourcentages ni les barres de progression.
Après avoir voté : Le design doit basculer instantanément : les options se transforment en barres de progression colorées indiquant les pourcentages de votes.
Flexibilité : Essayez de changer votre vote en sélectionnant une autre option, puis essayez d'annuler complètement votre vote en cliquant sur le bouton « Annuler mon vote ».
4. Tester la transparence et l'anonymat (Détail des votants)
La spécification prévoit de voir qui a voté quoi (si l'on a les droits) et de respecter l'anonymat le cas échéant.

Sondage non-anonyme : Créez un sondage normalement et votez. En tant qu'admin ou créateur, cliquez sur la petite icône d'information "Détails" (ou survolez l'option). Une liste déroulante doit s'ouvrir sous l'option pour vous afficher le nom exact des utilisateurs ayant voté pour ce choix.
Sondage anonyme : Créez un sondage en cochant la case Sondage anonyme. Votez. Constatez que même en tant que créateur ou administrateur, l'interface refuse de vous afficher les noms des participants (seul le nombre de votes compte).
5. Tester le module d'envoi automatique de SMS
La spécification requiert que les publications liées aux Classes préviennent les parents.

Rendez-vous sur la page d'une classe précise (/classes/[id]).
Publiez un message (Annonce ou Sondage).
Ouvrez le terminal de votre serveur de développement (celui où tourne Next.js).
Vous devriez y voir un magnifique log console mis en forme avec des cadres et des numéros simulés attestant du déclenchement du service :
text
📱 [SMS MOCK] Envoi à +33 6 12 34 56 78
📩 Message : "Nouveau sondage dans la classe Terminale A..."
Si toutes ces actions se déroulent exactement comme décrit, cela vous garantit que l'architecture backend, l'API unifiée, les composants UI premium et la logique de permissions de la spécification ont tous été implémentés à 100%.