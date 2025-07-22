import {useState, useEffect, useContext} from 'react'
import Link from "next/link"
import Image from "next/image"
import AuthContext from "../../stores/authContext.js"
import img1 from "./../../public/img/ecommerce-chretien-notre-dame-toute-graces.webp"
import img2 from "./../../public/img/ecommerce-catholique-saint-esprit-Dieu-amour.webp"
import ecommerce from "./../../public/img/librairie-puissance-divine/librairie-religieuse-exterieur.webp"
import sanctuaire from "./../../public/img/_/eglise-du-rosaire-bolobi/eglise-exterieur.webp"
import bolobi from "./../../public/img/_/bolobi/croix-bolobi.webp"
import accueil from "./../../public/accueil.webp"

export default function Hgroup() {
    const myLoader = ({ src, width, quality }) => {
        return `${src}?w=${width}&q=${quality || 75}`
    }
    , {menuActive, setMenuActive, mainmenu, findByIDMainMenu} = useContext(AuthContext)
    , [imageContextuelMenu, setImageContextuelMenu] = useState([accueil,ecommerce])
    , [indexImageContextuelMenu, setIndexImageContextuelMenu] = useState(0)
    , handleTimeout = (item,i) => {
        // console.log("je suis la "+menuActive)
        // console.log(imageContextuelMenu)
        // console.log(indexImageContextuelMenu)
        // console.log(imageContextuelMenu[indexImageContextuelMenu])
        setIndexImageContextuelMenu((indexImageContextuelMenu+1)%imageContextuelMenu.length)
    }
    
    useEffect(()=>{
        console.log(menuActive);
        setMenuActive(menuActive == "" ? "accueil" : menuActive)
        switch(menuActive){
            case "ecommerce":setImageContextuelMenu([ecommerce])
            break;
            case "activites-spirituelles":setImageContextuelMenu([sanctuaire,bolobi,ecommerce])
            break;
            case "bolobi":setImageContextuelMenu([bolobi])
            break;
            case "blog-bolobi"://setImageContextuelMenu([bolobi])
            break;
            default: setImageContextuelMenu([accueil])
        }
        setTimeout(handleTimeout, 5000)
        console.log(mainmenu)
        console.log(menuActive)
        console.log(findByIDMainMenu(mainmenu, menuActive))
        console.log(findByIDMainMenu(mainmenu, menuActive)?.h2)
    }, [menuActive])
    useEffect(()=>{
        setTimeout(handleTimeout,5000)
    }, [indexImageContextuelMenu])
    return <>
        <h1>
            <Link href="/" 
                id="logo" 
                onClick={()=>{setMenuActive("accueil")}}
                title="Librairie Puisance Divine, Abidjan, cocody 2 plateaux" >
                    <Image
                        // loader={myLoader}
                        src={img1}
                        alt={"Librairie Puisance Divine, Abidjan, cocody 2 plateaux"}
                        className=""
                        width={200}                                    height={200}
                        // fill="layout"
                    />
                    <span>
                        <span>SANCTUAIRE</span> <span>Notre Dame du ROSAIRE</span> <span>de Bolobi</span>
                        <br/><span>Abidjan, Côte d'ivoire</span>
                        {/* <strong>Évangélisation</strong>, <strong>Prière</strong> et{" "}
                        <strong>Assistance spirituelle</strong> */}
                    </span>
            </Link>
            <Link href="/" 
                className="imageContextuelMenu" 
                onClick={()=>{
                    setMenuActive("accueil")
                    // setMainMenuObject(item.h2)
                }}
                title="Librairie religieuse chrétienne, abidjan 2plateaux rue des jardins">
                    <Image
                        // loader={myLoader}
                        src={imageContextuelMenu[indexImageContextuelMenu]}
                        alt={"Librairie Puisance Divine, Abidjan, cocody 2 plateaux"}
                        className=""
                        width={200}                                    height={200}
                        // fill="layout"
                    />
                    <span>Pour les Oeuvres de Dieu</span>
            </Link>
            <Link href="/" 
                onClick={()=>{setMenuActive("accueil")}}
                title="Librairie religieuse chrétienne, abidjan 2plateaux rue des jardins">
                    <Image
                        // loader={myLoader}
                        src={img2}
                        alt={"Librairie Puisance Divine, Abidjan, cocody 2 plateaux"}
                        className=""
                        width={200}                                    height={200}
                        // fill="layout"
                    />
                    <span>Dans la <span>Communion</span> de l'Esprit-Saint</span>
            </Link>
            {/* <span>Puissance Divine</span> */}
        </h1>
        <h2 className="page_slogan">{findByIDMainMenu(mainmenu, menuActive)?.h2}</h2>
    </>
}
