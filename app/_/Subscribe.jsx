// import React from 'react'

export default function Subscribe() {
    return <div id="inscription">
        {/*_onMouseOut="this.removeAttribute('class')"
        _onMouseOver="getClass(this,'see')"*/}
        <hr />
        <p>
            Pour toutes les personnes en butte à la maladie, aux maléfices sous
            toutes ses formes, à la sorcellerie ou aux mauvais sorts, nous avons
            un groupe d intercession.
        </p>
        <p>
            L intercession peut se faire à distance. Mais en cas de nécessité, la
            présence physique pourrait être nécessaire.
        </p>
        <ul>
            <li>Vous pouvez soit nous joindre par téléphone au : 47-81-10-92</li>
            <li>Soit par email : puissancedamour@yahoo.fr</li>
            <li>
                Soit par courrier physique à : 08 BP111 Abidjan 08 Côte d Ivoire{" "}
            </li>
        </ul>
            Soit nous présenter votre situation ci-après{" "}
            <b style={{ fontSize: "1.1em", color: "brown" }}>
            avec des informations personnelles (adresse, téléphone, email..)
            </b>: 
        <form action="index.php" method="post">
            <fieldset>
                <textarea cols="100" rows="10" name="situation"></textarea>
            </fieldset>
            <input type="submit" value="Envoyer demande d'intercession" />
        </form>
    </div>
}
