import {useState,useEffect} from 'react'
import Link from "next/link";

export default function CTA() {

    let [sto,setSto] = useState(false)
    , [linksList,setLinksList] = useState([])
    , handleTimeout = (linksList,o) => {
        // console.log(linksList)
        // console.log(o)
        const rand = Math.ceil(Math.random()*linksList.length) - 1
        , link = linksList[rand]
        // console.log(link)
        linksList.forEach((item,i) => {item.classList.remove('active')})
        link.classList.add('active')
    }

    useEffect(() => {
        const tmp = document.querySelectorAll('.CTA>section>ul>li>a')
        setLinksList(tmp)
        // setLinksList(() => tmp)
    }, [])

    useEffect(() => {
        // console.log('zzzzzzzzzzzzzzzzz')
        console.log(linksList)
        if(linksList.length)
            sto = setInterval(() => {handleTimeout(linksList,"dans useEffetc")}, 3000)
        else console.log("waiting ...because linksList is empty")
    }, [linksList])

    return (
        <article className='CTA'>
            <h4><u>RÉSERVER UNE DATE</u> AU SANCTUAIRE NOTRE DAME DU ROSAIRE DE BOLOBI</h4>
            <section>
                {/* <h4>Solutions d'hébergement pour les pélérins et retraitants: </h4> */}
                {/* <h4>HÉBERGEMENTS & LIEU DE REPOS: </h4> */}
                <svg title="Nourriture" xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" className="bi bi-piggy-bank" viewBox="0 0 16 16">
                    <path d="M5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.138-1.496A6.613 6.613 0 0 1 7.964 4.5c.666 0 1.303.097 1.893.273a.5.5 0 0 0 .286-.958A7.602 7.602 0 0 0 7.964 3.5c-.734 0-1.441.103-2.102.292a.5.5 0 1 0 .276.962" />
                    <path fillRule="evenodd" d="M7.964 1.527c-2.977 0-5.571 1.704-6.32 4.125h-.55A1 1 0 0 0 .11 6.824l.254 1.46a1.5 1.5 0 0 0 1.478 1.243h.263c.3.513.688.978 1.145 1.382l-.729 2.477a.5.5 0 0 0 .48.641h2a.5.5 0 0 0 .471-.332l.482-1.351c.635.173 1.31.267 2.011.267.707 0 1.388-.095 2.028-.272l.543 1.372a.5.5 0 0 0 .465.316h2a.5.5 0 0 0 .478-.645l-.761-2.506C13.81 9.895 14.5 8.559 14.5 7.069c0-.145-.007-.29-.02-.431.261-.11.508-.266.705-.444.315.306.815.306.815-.417 0 .223-.5.223-.461-.026a.95.95 0 0 0 .09-.255.7.7 0 0 0-.202-.645.58.58 0 0 0-.707-.098.735.735 0 0 0-.375.562c-.024.243.082.48.32.654a2.112 2.112 0 0 1-.259.153c-.534-2.664-3.284-4.595-6.442-4.595zM2.516 6.26c.455-2.066 2.667-3.733 5.448-3.733 3.146 0 5.536 2.114 5.536 4.542 0 1.254-.624 2.41-1.67 3.248a.5.5 0 0 0-.165.535l.66 2.175h-.985l-.59-1.487a.5.5 0 0 0-.629-.288c-.661.23-1.39.359-2.157.359a6.558 6.558 0 0 1-2.157-.359.5.5 0 0 0-.635.304l-.525 1.471h-.979l.633-2.15a.5.5 0 0 0-.17-.534 4.649 4.649 0 0 1-1.284-1.541.5.5 0 0 0-.446-.275h-.56a.5.5 0 0 1-.492-.414l-.254-1.46h.933a.5.5 0 0 0 .488-.393zm12.621-.857a.565.565 0 0 1-.098.21.704.704 0 0 1-.044-.025c-.146-.09-.157-.175-.152-.223a.236.236 0 0 1 .117-.173c.049-.027.08-.021.113.012a.202.202 0 0 1 .064.199z" />
                </svg>
                <p>* 180 places d'hébergement, les chambres sont ventilés avec moustiquaire, l'électricité tourne au solaire et à l'essence.</p>
                <svg title="Hébergement" xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="currentColor" class="bi bi-pin-map-fill" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M3.1 11.2a.5.5 0 0 1 .4-.2H6a.5.5 0 0 1 0 1H3.75L1.5 15h13l-2.25-3H10a.5.5 0 0 1 0-1h2.5a.5.5 0 0 1 .4.2l3 4a.5.5 0 0 1-.4.8H.5a.5.5 0 0 1-.4-.8z" />
                    <path fill-rule="evenodd" d="M4 4a4 4 0 1 1 4.5 3.969V13.5a.5.5 0 0 1-1 0V7.97A4 4 0 0 1 4 3.999z" />
                </svg>
                <p>* Équipements de sonorisation disponible à la location</p>
                <ul onMouseEnter={() => {linksList.forEach((item,i) => {item.classList.remove('active')});clearInterval(sto)}} onMouseLeave={() => {handleTimeout(linksList, "..."); sto = setInterval((item,i) => {handleTimeout(linksList, "dans le rendu")}, 3000)}}>
                    <li className='journee'>
                        <Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>
                            <span>1000Ave</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-browser-edge" viewBox="0 0 16 16">
                                <path d="M9.482 9.341c-.069.062-.17.153-.17.309 0 .162.107.325.3.456.877.613 2.521.54 2.592.538h.002c.667 0 1.32-.18 1.894-.519A3.838 3.838 0 0 0 16 6.819c.018-1.316-.44-2.218-.666-2.664l-.04-.08C13.963 1.487 11.106 0 8 0A8 8 0 0 0 .473 5.29C1.488 4.048 3.183 3.262 5 3.262c2.83 0 5.01 1.885 5.01 4.797h-.004v.002c0 .338-.168.832-.487 1.244l.006-.006a.594.594 0 0 1-.043.041Z" />
                                <path d="M.01 7.753a8.137 8.137 0 0 0 .753 3.641 8 8 0 0 0 6.495 4.564 5.21 5.21 0 0 1-.785-.377h-.01l-.12-.075a5.45 5.45 0 0 1-1.56-1.463A5.543 5.543 0 0 1 6.81 5.8l.01-.004.025-.012c.208-.098.62-.292 1.167-.285.129.001.257.012.384.033a4.037 4.037 0 0 0-.993-.698l-.01-.005C6.348 4.282 5.199 4.263 5 4.263c-2.44 0-4.824 1.634-4.99 3.49Zm10.263 7.912c.088-.027.177-.054.265-.084-.102.032-.204.06-.307.086z" />
                                <path d="M10.228 15.667a5.21 5.21 0 0 0 .303-.086l.082-.025a8.019 8.019 0 0 0 4.162-3.3.25.25 0 0 0-.331-.35c-.215.112-.436.21-.663.294a6.367 6.367 0 0 1-2.243.4c-2.957 0-5.532-2.031-5.532-4.644.002-.135.017-.268.046-.399a4.543 4.543 0 0 0-.46 5.898l.003.005c.315.441.707.821 1.158 1.121h.003l.144.09c.877.55 1.721 1.078 3.328.996Z" />
                            </svg>
                        </Link>
                    </li>
                    <li className='journee'>
                        <Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>
                            <span>Veillé</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-bug-fill" viewBox="0 0 16 16">
                                <path d="M4.978.855a.5.5 0 1 0-.956.29l.41 1.352A4.985 4.985 0 0 0 3 6h10a4.985 4.985 0 0 0-1.432-3.503l.41-1.352a.5.5 0 1 0-.956-.29l-.291.956A4.978 4.978 0 0 0 8 1a4.979 4.979 0 0 0-2.731.811l-.29-.956z" />
                                <path d="M13 6v1H8.5v8.975A5 5 0 0 0 13 11h.5a.5.5 0 0 1 .5.5v.5a.5.5 0 1 0 1 0v-.5a1.5 1.5 0 0 0-1.5-1.5H13V9h1.5a.5.5 0 0 0 0-1H13V7h.5A1.5 1.5 0 0 0 15 5.5V5a.5.5 0 0 0-1 0v.5a.5.5 0 0 1-.5.5zm-5.5 9.975V7H3V6h-.5a.5.5 0 0 1-.5-.5V5a.5.5 0 0 0-1 0v.5A1.5 1.5 0 0 0 2.5 7H3v1H1.5a.5.5 0 0 0 0 1H3v1h-.5A1.5 1.5 0 0 0 1 11.5v.5a.5.5 0 1 0 1 0v-.5a.5.5 0 0 1 .5-.5H3a5 5 0 0 0 4.5 4.975" />
                            </svg>
                        </Link>
                    </li>
                    <li className='journee'>
                        <Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>
                            <span>Recollection</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-calendar-heart" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4zM1 14V4h14v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1m7-6.507c1.664-1.711 5.825 1.283 0 5.132-5.825-3.85-1.664-6.843 0-5.132" />
                            </svg>
                        </Link>
                    </li>
                    <li className='weekend'>
                        <Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>
                            <span>Retraite weekend</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-chat-dots-fill" viewBox="0 0 16 16">
                                <path d="M16 8c0 3.866-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.584.296-1.925.864-4.181 1.234-.2.032-.352-.176-.273-.362.354-.836.674-1.95.77-2.966C.744 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7M5 8a1 1 0 1 0-2 0 1 1 0 0 0 2 0m4 0a1 1 0 1 0-2 0 1 1 0 0 0 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2" />
                            </svg>
                        </Link>
                    </li>
                    <li className='long'>
                        <Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>
                            <span>Vacances, long-terme</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-chat-square-quote" viewBox="0 0 16 16">
                                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                                <path d="M7.066 4.76A1.665 1.665 0 0 0 4 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 5.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 1 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z" />
                            </svg>
                        </Link>
                    </li>
                    <li className='ceremonie'>
                        <Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>
                            <span>Conférence, Célébrations(Mariage, baptême), ..</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-columns-gap" viewBox="0 0 16 16">
                                <path d="M6 1v3H1V1zM1 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1zm14 12v3h-5v-3zm-5-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1zM6 8v7H1V8zM1 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm14-6v7h-5V1zm-5-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1z" />
                            </svg>
                        </Link>
                    </li>
                    <li className='individuelle'>
                        <Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>
                            <span>Retraite individuelle</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" className="bi bi-clipboard-data-fill" viewBox="0 0 16 16">
                                <path d="M6.5 0A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0zm3 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
                                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1A2.5 2.5 0 0 1 9.5 5h-3A2.5 2.5 0 0 1 4 2.5zM10 8a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zm-6 4a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm4-3a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1" />
                            </svg>
                        </Link>
                    </li>
                </ul>
                {/* <ul>
                <li><Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>Chambre individuelle (1-2)</Link> <span>Pour se reposer ou se recueillir avec le seigneur dans un lieu calme loin du tumulte de la ville,</span></li>
                <li><Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>Chambre collective (4-10)</Link> <span>Lors d'une <u>retraites de prière</u></span></li>
                <li><Link href={"/blog-de-bolobi-ecole-caritative-larve-msn#!"}>Long-Terme (selon le nombre, dortoir ou individuelle)</Link> <span>Pour les <u>groupes scolaires</u> de vacance, ou les <u>personnes en convalescence</u> par exmeple</span></li>
            </ul>
            <h4>NOUS PROPOSONS ÉGALEMENT UN LIEU POUR ORGANISER: </h4>
            <ul>
                <li>Marriage</li>
                <li>conférence</li>
                <li>etc...</li>
            </ul>
            */}
            </section>
            {/*
        <section>
            <h4>En cette période du mois de <span>Mai</span></h4>
            <p>nous porposon des réduction avec le code promo suivant</p>
            <input readOnly={true} value={"AAAA"} />
        </section>
        */}
        </article>
    )
}
