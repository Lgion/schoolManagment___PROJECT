"use client"

import React,{ useState, useEffect, useRef } from 'react'
import SliderInArticle from '../SliderInArticle.jsx';
import { carouselBolobi_ } from '../../../assets/carousels.js';

export default function Features({ bem = "LP-Features", align = ""/*"--btn"*/, $datas = {
    title: "Les activités économique qui financent BOLOBI: "
    , p: "Le sanctuaire Notre Dame de Bolobi et son activité caritative, l'école Saint Martin de Porrèz, sont financés via 4 biais principaux: "
    , features: [
        {
            title: "Agriculture"
            , p: "(potagers, maraîchage, pépinieres, champignons, champs poivre palme et cacao, et maïs entre autres)."
        },
        {
            title: "Élevage"
            , p: "(poulet/chair & ponte, escargots, larves MSN, insectes)."
        },
        {
            title: "Hébergement/Restauration"
            , p: "(services aux retraitants, avec quelques options)."
        },
        {
            title: "Don"
            , p: "L'activité caritative du SNDR en l'école ESMP, a besoin de vos dons."
        },
        {
            title: "Boisson"
            , p: "Des boissons locales produites sur place: bangui exquis, bolob, mélange maison à base de citron ou de miel.."
        },
        {
            title: "Boutique alimentaire"
            , p: "Une petite boutique de quartier à Bolobi, disponible aux retraitants comme aux campements des alentours."
        }
    ]
}}){
    const blockRef = useRef()
    , [carouselData, setCarouselData] = useState(carouselBolobi_)
    , test = React.createElement("div", {
            className: "my-div",
        },
        "Hello, world!",
      )

    useEffect(() => {

        const options = {
            root: null,
            // threshold: .2,
            rootMargin: "-250px"
        }
        , observer = new IntersectionObserver(function(entries,observer){
            
            entries.forEach(entry => {
                if(entry.isIntersecting){
                    blockRef.current.classList.add('--animated')
                }else blockRef.current.classList.remove('--animated')
            })
        }, options)
        observer.observe(blockRef.current)
    }, [])

    return <>
        <section ref={blockRef} className="OurServices">
            <h2>{$datas.title || "Our Services"}</h2>
            <p>{$datas.p || "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy"}</p>
            <ul className="OurServices__PurposesList01">
                {$datas.features.map((elt,i) => <li 
                    key={"features_"+i}
                    onClick={e => {
                        setCarouselData([carouselBolobi_[i%3]])}
                    }
                >
                    <i className={elt?.icon} />
                    <h3>{elt?.title}</h3>
                    <p>{elt?.p}</p>
                </li>)}
                {/* <li>
                    <i />
                    <h3>Content Writing</h3>
                    <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut.</p>
                </li>
                <li>
                    <i />
                    <h3>Web Development</h3>
                    <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut.</p>
                </li>
                <li>
                    <i />
                    <h3>Graphic Design</h3>
                    <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut.</p>
                </li>
                <li>
                    <i />
                    <h3>UI/UX Design</h3>
                    <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut.</p>
                </li>
                <li>
                    <i />
                    <h3>App Development</h3>
                    <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut.</p>
                </li>
                <li>
                    <i />
                    <h3>Digital Marketing</h3>
                    <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut.</p>
                </li> */}
            </ul>
            <SliderInArticle carousel={carouselData} carouselName="carouselBolobi_fields" />
        </section>
        { /* Services Section End */}

    </>
}