"use client"

import { createContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import mongoose from 'mongoose'

const AuthContext = createContext({})
export default AuthContext

export const AuthContextProvider = ({children}) => {
    let router = useRouter()
    let pathname = usePathname()
    , [role, setRole] = useState("")
    , [data, setData] = useState({ categoryPosts: [], diapos: [] })
    , [sommaire, setSommaire] = useState("")
    , renderSommaire = () => {
        let h3s = Array.from(document.querySelectorAll("h3:not(.tagzonePage):not(#blog)"))
        , h4s = document.querySelectorAll("h4")
        , nav = document.querySelector("#__next>header+nav")
        , romains = ["Ⅰ","Ⅱ","Ⅲ","Ⅳ","Ⅴ","Ⅵ","Ⅶ","Ⅷ","Ⅸ","Ⅹ","Ⅺ","Ⅻ"]
        // ,iconList = [

        // ]

        setSommaire(<div id="sommaire">{
            h3s.map((item,i) => <a key={"sanctuaireH3___"+i} href={"#"+item.id}>
                {/* {item.id} */}
                {console.log(item.dataset)}
                {item.dataset.icon && <span className={"icon _"+item.dataset.icon}></span>}
                {/* <span>{romains[i]}</span> */}
                <span>{item.dataset.sommaire || item.innerText}</span>
            </a>)
        }</div>)

        //  div.append(h3s)
    }
    , cleanModal = () => {
        document.querySelector('#modal .modal___header').innerHTML = ""
        // document.querySelector('#modal .modal___main').innerHTML = ""
        // console.log(document.querySelector('#modal .modal___main'));
        document.querySelector('#modal .modal___footer').innerHTML = ""
    
        const img = document.querySelector('#modal .modal___main .img')
        , content = document.querySelector('#modal .modal___main .content')
        img && img.remove()
        content && content.remove()
    }
    , myLoader = ({ src, width, quality }) => {
        return `${src}?w=${width}&q=${quality || 75}`
    }
    , settingsSlider = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnHover: true,
        adaptiveHeight: true
    }
    , mainmenu = [
        {
            id:"accueil",
            href:"/",
            title:"Accueil: Librairie religieuse chrétienne Abidjan, Ecommerce chrétien, centre de retraite spirituelle à Bolobi (entre azaguié et yakasseme, sur route d'Adzopé)",
            h2: "DÉCOUVRIR: La Puissance Divine de Côte d'ivoire",
            content:"",
            icon:"fa-solid fa-house",
            tagzone:["librairie","librairie religieuse","librairie religieuse chrétienne", "ecommerce chrétien", "sanctuaire bolobi", "retraites spirituelles"],
            titrePage:["Sanctuaire Notre Dame du Rosaire de Bolobi, et la Librairie Puissance Divine, vous souhaitent la bienvenue."],
            sns:{"Puissance Divine d'Amour d'Abidjan Cocody 2plateaux rue des jardins":"https://www.facebook.com/genevieve.achi/"},
            search:"librairie+chrétienne+abidjan+cocody+2plateau"
        },
        // {id:"enseignements",href:"enseignements-spirituels-chretien-catholique",title:"Enseignements spirituels chrétien catholique Puissance Divine, jésus enseigne: l",content:"Enseignements",tagzone:[],titrePage:[],sns:{"librairie puissance divine abidjan rue des jardins": "https://www.facebook.com/abidjan.puissance.divine/","Maria Valtorta": "https://www.facebook.com/LibrairiePuissanceMariaValtorta/"}},
        {id:"activites-spirituelles"
            // , href:"/sanctuaire-rosaire-bolobi-adzope"
            , href:"/retraites-spirituelles-bolobi"
            , title:"Sanctuaire du Rosaire de Bolobi: activités spirituelles religieuses chrétien catholique"
            , h2:"RÉSERVER: au Sanctuaire ND Rosaire de BOLOBI"
            // , content:"Sanctuaire ND du Rosaire Bolobi"
            , content:"<span>Retraites</span> <span class='keep'>Spirituelles</span>"
            , icon:"fa-solid fa-church"
            , tagzone:["retraites de prières"
                , "activités spirituelles"
                , "lieu de loisir abidjan"
                , "lieu de détente abidjan"
                , "lieu de repos abidjan"
            ]
            , titrePage:["Retraites spirituelles en périphérie d'Abidjan au Sanctuaire Notre Dame du Rosaire de Bolobi"]
            , sns:{"Sanctuaire notre Dame du Rosaire de Bolobi": "https://www.facebook.com/abidjan.sanctuaire.rosaire.bolobi/"}
            , search:"retraite+spirituelle+sanctuaire+dame+rosaire+bolobi"
        },
        {id:"bolobi"
            ,href:"/bolobi-ecole-caritative-larve-msn"
            ,title:"Bolobi: école gratuite d'Adzopé, culture du poivre, élevage de mouches soldat noire, activités spirituelles religieuses chrétien catholique et protestant"
            ,content:"<span>Oeuvres</span> <span class='keep'>Caritatives</span>"
            ,icon:"fa-solid fa-test"
            ,tagzone:["école caritative", "école saint martin de porèz de bolobi"]
            ,titrePage:["Les activités religieuses, caritatives, et économiques du sanctuaire de Bolobi, et de l'école St Martin de Porrez"]
            ,sns:{"École St Martin de Porèz de Bolobi": "https://www.facebook.com/abidjan.puissance.divine/"}
            ,search:"école+primaire+saint+martin+porès+bolobi+azaguié+yakasseme"
        },
        {id:"blog-bolobi"
            // , href:"/blog-sanctuaire-rosaire-bolobi"
            , href:"/blog"
            , title:"Un blog pour vous permettre de tout connaitre de nos activités au sanctuaire de Bolobi."
            , h2:"Blog du Rosaire de Bolobi"
            // , content:"Sanctuaire ND du Rosaire Bolobi"
            , icon:"fa-solid fa-blog"
            , tagzone:["blog"
                , "article bolobi"
                , "grotte mariale bolobi"
                , "notre dame rosaire bolobi"
            ]
            , titrePage:["Le blog du Sanctuaire Notre Dame du Rosaire de Bolobi"]
            , sns:{"Le blog Sanctuaire notre Dame du Rosaire de Bolobi": "https://www.facebook.com/abidjan.sanctuaire.rosaire.bolobi/"}
            , search:"information+sanctuaire++rosaire+bolobi-blog"
        },
        // {id:"bolobi",href:"/bolobi-ecole-caritative-larve-msn",title:"Bolobi: école gratuite d'Adzopé, culture du poivre, élevage de mouches soldat noire, activités spirituelles religieuses chrétien catholique et protestant",content:"Oeuvres Caritatives",tagzone:["école caritative", "école saint martin de porèz de bolobi"],titrePage:["Les activités religieuses, caritatives, et économiques du sanctuaire de Bolobi, et de l'école St Martin de Porrez"],sns:{"École St Martin de Porèz de Bolobi": "https://www.facebook.com/abidjan.puissance.divine/"},search:"école+primaire+saint+martin+porès+bolobi+azaguié+yakasseme"},
        // {id:"ecommerce",href:"/ecommerce-chretien-abidjan",title:"Ecommerce religieux chrétien catholique: icône grottes statues bibles",content:"Ecommerce Chrétien",tagzone:["ecommerce","librarie religieuse","librairie chrétienne","publication chrétiennes","objets de piété","bibles","saintes bibles", "icônes", "croix", "encens", "statue mariale", "grotte chrétienne", "chapelets de prière"],titrePage:["Ecommerce libraire puissance divine d'Amour, Cocody 2plateaux rue des jardins"],sns:{"librairie puissance divine abidjan rue des jardins": "https://www.facebook.com/abidjan.puissance.divine/","Maria Valtorta": "https://www.facebook.com/LibrairiePuissanceMariaValtorta/"},search:"ecommerce+religieux+chrétien+puissance+divine+amour"},
        {id:"ecommerce",href:"/ecom",title:"Ecommerce religieux chrétien catholique: icône grottes statues bibles",content:"<span class='keep'>Ecommerce</span> <span>Chrétien</span>", icon:"fa-solid fa-cart-shopping",tagzone:["ecommerce","librarie religieuse","librairie chrétienne","publication chrétiennes","objets de piété","bibles","saintes bibles", "icônes", "croix", "encens", "statue mariale", "grotte chrétienne", "chapelets de prière"],titrePage:["Ecommerce libraire puissance divine d'Amour, Cocody 2plateaux rue des jardins"],sns:{"librairie puissance divine abidjan rue des jardins": "https://www.facebook.com/abidjan.puissance.divine/","Maria Valtorta": "https://www.facebook.com/LibrairiePuissanceMariaValtorta/"},search:"ecommerce+religieux+chrétien+puissance+divine+amour"},
    ]
    , findByIDMainMenu = (data, id) => data.find(
        (item,i) => item.id == id
    )
    , [menuActive, setMenuActive] = useState("")
    , [isCartPage, setIsCartPage] = useState(true)
    , [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => { 
        (()=>{setIsCartPage(document.querySelector('#__next>main.cart'))})()
        renderSommaire()
        router.events?.on('routeChangeStart', (item,i) => {
            console.log("entrain de changer de page")
        })
        router.events?.on('routeChangeComplete', renderSommaire)
    }, [])
    useEffect(() => { 
        console.log(menuActive);
        mainmenu.forEach(item=>{
            console.log("document.location.href.indexOf(item.href)");
            console.log(document.location.href.indexOf(item.href));
            console.log(document.location.href);
            console.log(item.href);
            console.log(item.id);
            console.log(menuActive);
            
            
            if(item.href)
            if(document.location.pathname.indexOf("/posts/")==0)setMenuActive("blog-bolobi")
            else if(document.location.pathname===item.href && item.id != menuActive){
                console.log('oooooooooo');
                
                setMenuActive(item.id)
            }
            // else setMenuActive("accueil")
        })
        console.log(menuActive);
        // console.log(findByIDMainMenu(mainmenu, menuActive))
    }, [])
    useEffect(() => {
    
        console.log(pathname);
        console.log(pathname?.indexOf('admin'));
        console.log(pathname?.indexOf('admin') != -1);
        // alert(Array)
        // console.log(document.querySelectorAll('span.close'))
        document.querySelectorAll('span.close').forEach(elt => {
            elt.addEventListener('click', e => {
            // alert("okkk")
            console.log(e.target.parentElement);
            console.log(document.querySelector('#modal'));
            const doParentIsModal = e.target.parentElement == document.querySelector('#modal')
            if (doParentIsModal && pathname?.indexOf('ecommerce')!==-1) 
                cleanModal()
            e.target.parentElement.classList.remove('active')
            })
        })
        if(document.querySelector('main.sanctuaire_ndr')){
            const fetchData = async () => {
                try {
                    const postsResponse = await fetch('/api/posts?field=category&value=sanctuaire')
                    const categoryPosts = await postsResponse.json()

                    const diaposResponse = await fetch('/api/diapos?identifiant=home_0')
                    const diapos = await diaposResponse.json()

                    setData({ categoryPosts, diapos })
                } catch (error) {
                    console.error("Erreur lors de la récupération des données:", error)
                }
            }

            fetchData()
        }
    }, [])
    /*
    const [user, setUser] = useState(null)
    const [authReady, setAuthReady] = useState(false)

    useEffect(()=>{
        netlifyIdentity.on('login',(user)=>{
            setUser(user)
            netlifyIdentity.close()
            console.log("login event");
        })
        netlifyIdentity.on('logout',(user)=>{
            setUser(null)
            console.log("logout event");
        })
        netlifyIdentity.on('init', (user)=>{
            setUser(user)
            setAuthReady(true)
            console.log(user);
            console.log('init event');
        })
        //init netlify identity connection
        netlifyIdentity.init()


        return ()=>{
            netlifyIdentity.off('login')
            netlifyIdentity.off('logout')
        }
    }, [])
    
    const login = () => {netlifyIdentity.open()}
    const logout = () => {netlifyIdentity.logout()}
    const context = {user,login,logout,authReady}
    */
    const context = {role, setRole, ok:"okokok", isAdmin, setIsAdmin, isCartPage, mainmenu, menuActive, setMenuActive, findByIDMainMenu, settingsSlider, myLoader, sommaire, setSommaire, renderSommaire, data}
    
    return (
        <AuthContext.Provider value={context}>
            {children}
        </AuthContext.Provider>
    )
}
