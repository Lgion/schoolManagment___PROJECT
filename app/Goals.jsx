export default () => <section>
    <h2>Liste DES CHOSES ENCORE À RÉALISÉ SELON PROPOSITIONS GEMINI: </h2>
    <a target='_blank' href="https://gemini.google.com/app/951a0c213d4a23a1?hl=fr">Conversation Gemini (athéna)</a>
    <ul>
    <li>Dans le layout des classes, on peut rajouter:
        <ul>
        <li>l'emploi du temps hebdo de cette classe</li>
        <li>la possibilité pour un prof (ou administrateur) de rajouter des annonces, ou laisser un mot publiquement (annoncer une sortie scolaire, laisser un mot public ou privé à un enseignant ou un élève, un prof peut laisser un mot aux élèves d'une classe, etc...)</li>
        <li>Taux de présence moyen de la classe.</li>
        <li>Réussite globale (par exemple, un graphique simple montrant la progression de la classe sur certaines compétences générales).</li>
        <li>Galerie de photos des activités récentes de la classe (avec l'accord des parents).</li>
        </ul>
    </li>
    <li>Dans le layout des enseignants:
        <ul>
        <li>Matières enseignées.</li>
        </ul>
    </li>
    <li>Dans la page d'un professeur:
        <ul>
        <li>Matières enseignées.</li>
        </ul>
    </li>
    <li>Dans la page d'un élève:
        <ul>
        <li>Carnet médical, et les allergies ou informations médicales importantes</li>
        </ul>
    </li>
    <li>Globalement: 
        <ul>
            <li>Créer un systeme d'authentification via clerk, et de role (admion, prof, eleve, public, parent). <br/>Si on veut créer un role parent, il faut rajouter une propriété "email" à la propriété "parents" du modele Eleve</li>
        <li>Courte biographie de l'école (page accueil) avec potentiellement des photos.</li>
        <li>Coordonnées de l'école (email, tel, etc)</li>
        <li>Intérer un chat accéssible à tous, avec des actions possibles communes et différentes pour les élèves, enseignants, et (p^t aussi) administrateurs.</li>
        <li>Lister des activités parascolaire, et permettre aux élève d'y accéder, découvrir l'activité par une biographie et des images/vidéos</li>
        </ul>
    </li>
    </ul>
</section>