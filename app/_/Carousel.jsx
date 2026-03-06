"use client"

import React, { useState, useContext, useEffect, memo, useCallback, useMemo } from "react";
import Image from "next/image"
import Slider from "react-slick";
import AuthContext from "../../stores/authContext.js"
// import EditMongoForm from '../admin/school/EditMongoForm'
import { createPortal } from "react-dom"
import { getLSItem, setLSItem, clearLS } from "../../utils/localStorageManager.js";



//carousel simple: https://react-slick.neostack.com/
//carousel npm: https://www.npmjs.com/package/react-responsive-carousel
// 40 carousels comp: https://reactjsexample.com/tag/carousel/
// 14 carousels comp: https://alvarotrigo.com/blog/react-carousels/
// carousel comp: https://coreui.io/react/docs/components/carousel/
// carousel: https://www.gaji.jp/blog/2022/10/28/11858/
// spinner,bugger,carousel,countup,markdown: https://qiita.com/baby-degu/items/e183b20dd20b20920e00



const Carousel = memo(function Carousel({ page = "home", diapos: initialDiapos, titre, icon = 1, sommaire, h3id = "anchorCarousel" }) {
    const [h3, setH3] = useState("TROUVER UN TITRE")
    const [diapos, setDiapos] = useState(initialDiapos || [])
    const { settingsSlider, isAdmin } = useContext(AuthContext)
        , [models, setModels] = useState({})

    const myLoader = useCallback(({ src, width, quality }) => {
        return `${src}?w=${width}&q=${quality || 75}`
    }, [])

    const handleUpdate = useCallback((e, item) => {
        setDiapos(prevDiapos => prevDiapos.filter(r => r._id !== item._id))
        const modal = document.getElementById('modal')
        if (modal) {
            modal.classList.add('active')
            document.querySelectorAll('#modal .modal___main>form').forEach(elt => {
                elt.classList.remove('active')
            })
            document.querySelector('#modal .modal___main>form.slider_update')?.classList.add('active')
        }
    }, [])

    const handleDelete = useCallback((e) => {
        const doSupp = confirm("Êtes-vous sûr de vouloir supprimer cette photo du diapo ?")
        if (doSupp) {
            fetch(`/api/diapo?_id=${e.target.dataset._id}&src=${e.target.dataset.src}`, {
                method: "DELETE"
            })
        }
    }, [])

    const fetchDiapos = useCallback(async () => {
        const storedDiapos = getLSItem('carouselDiapos')

        if (storedDiapos) {
            try {
                const parsedDiapos = storedDiapos.filter(item => item['identifiant_$_hidden'] == page + "_0")
                if (Array.isArray(parsedDiapos) && parsedDiapos.length > 0) {
                    setDiapos(parsedDiapos)
                    return
                }
            } catch (error) {
                console.error('Erreur lors de la lecture du localStorage pour les diapos:', error)
            }
        }

        try {
            const response = await fetch('/api/diapos?identifiant=' + page + '_0')
            // const response = await fetch('/api/diapos')
            const data = await response.json()
            if (Array.isArray(data) && data.length > 0) {
                setLSItem('carouselDiapos', data)
                const currentData = data.filter(item => item['identifiant_$_hidden'] == page + "_0")
                setDiapos(currentData)
            } else {
                console.error('Les données de diapos reçues ne sont pas un tableau valide')
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des diapos:', error)
        }
    }, [])


    useEffect(() => {

        let ok = async () => {
            const ok = await fetch("/api/diapo")
                , data = await ok.json()
            console.log(data);
            setModels(data)
            console.log(data);

        }
        ok()
    }, [])
    useEffect(() => {
        setH3(titre)
        fetchDiapos()
    }, [titre, fetchDiapos])

    const memoizedDiapos = useMemo(() => diapos, [diapos])
    const reloadBtn = () => {
        clearLS()
        location.reload()
    }

    return (
        <>
            <h3 className="carousel" id={h3id} data-icon={icon} data-sommaire={sommaire || titre}>{h3}</h3>
            <section className="carousel">
                {/*false && */isAdmin && (<>
                    <div id="admin_carousel">
                        <button title="Recharger les données du carousel" style={{ left: "2em" }} onClick={reloadBtn}>⟳</button>
                        <button
                            title="Ajouter une slide à votre diapo"
                            onClick={() => {
                                const modal = document.getElementById('modal')
                                if (modal) {
                                    modal.classList.add('active')
                                    // Ajout du header et footer à la modale
                                    const header = document.querySelector('#modal .modal___header')
                                    const footer = document.querySelector('#modal .modal___footer')
                                    if (header) {
                                        header.innerHTML = `
                                            <figcaption>
                                                <strong>Ajouter une nouvelle diapositive</strong>
                                                <span class="close">×</span>
                                            </figcaption>
                                        `
                                    }
                                    if (footer) {
                                        footer.innerHTML = `
                                            <button type="submit" class="submit">Enregistrer</button>
                                            <button type="button" class="cancel">Annuler</button>
                                        `
                                    }
                                    document.querySelector('#modal .modal___main>form.slider')?.classList.add('active')
                                }
                            }}
                        >
                            +
                        </button>
                    </div>
                    {/* {JSON.stringify(models)}
                    ---
                    {JSON.stringify(models?.schemaDiapo?.paths)} */}
                    {/* {JSON.stringify(memoizedDiapos[0]['identifiant_$_hidden'])} */}
                    {/* {
                        createPortal(
                            // <EditMongoForm 
                                hiddens={{identifiant: page+"_0"}}
                                endpoint="diapo"
                                modelKey={"slider"} 
                                model={models?.schemaDiapo?.paths || {}} 
                                // joinedDatasProps={{classes: ecole_classes}} 
                            />
                            , document.querySelector('#modal .modal___main')
                        )
                    } */}
                </>
                )}
                <Slider {...settingsSlider}>
                    {memoizedDiapos.map((item, i) => item['identifiant_$_hidden'].indexOf(page) !== -1 && (
                        <figure key={`carousel${i}`}>
                            {false && isAdmin && (
                                <ul className="admin">
                                    <li onClick={(e) => handleUpdate(e, item)}>✎</li>
                                    <li onClick={handleDelete} data-_id={item._id} data-src={item.src_$_file}>🗑️</li>
                                </ul>
                            )}
                            <Image
                                loader={myLoader}
                                src={item.src_$_file.replace("images/", "images/" + (JSON.parse(item.metas)?.path || "") + "/")}
                                alt={item.alt}
                                title={item.title}
                                width={200}
                                height={200}
                            />
                            <ul></ul>
                            <figcaption>
                                <h4>{item.title}</h4>
                                {/* <p>{item.figcaption}</p> */}
                            </figcaption>
                        </figure>
                    ))}
                </Slider>
            </section>
        </>
    )
})

export default Carousel
