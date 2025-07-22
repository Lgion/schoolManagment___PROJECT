import React,{useState, useContext, useEffect} from 'react'
import Image from "next/image"
import Link from "next/link"
import * as Ecommerce_articles from "./../../assets/datas/articles.js"
import Ecommerce_articles_OPTIONS from "./../../assets/datas/articles_options.js"
import {handleModalShowProduct,handleAddToCart,handleProductsDisplay,handleSelect,handleSelectButtons,handleVariantButtonHover} from "./../../utils/handleEvents.js"
import AuthContext from "../../stores/authContext.js"


let strip_tags = (html, ...rest) => {
    //PROCESS STRING
    if(rest.length < 2) {
        html=html.replace(/<\/?(?!\!)[^>]*>/gi, '');
    } else {
        var allowed = rest[1];
        var specified = eval("["+rest[2]+"]" );
        if(allowed){
            var regex='</?(?!(' + specified.join('|') + '))\b[^>]*>';
            html=html.replace(new RegExp(regex, 'gi'), '');
        } else{
            var regex='</?(' + specified.join('|') + ')\b[^>]*>';
            html=html.replace(new RegExp(regex, 'gi'), '');
        }
    }
    //CHANGE NAME TO CLEAN JUST BECAUSE  
    var clean_string = html;
    //RETURN THE CLEAN STRING
    return clean_string;
}

function BestSellers() {

    const {myLoader, setCartBox, miniCart, articles_title_table} = useContext(AuthContext)
    , [bestSellersArticles, setBestSellersArticles] = useState({})

    useEffect(() => {
        let item = Ecommerce_articles.articles.data[Math.ceil(Math.random()*Ecommerce_articles.articles.data.length-1)]
        item.fr_ = item.fr.replace("<br>").replace("<br/>")
        item.fr__ = strip_tags(item.fr)
        setBestSellersArticles(
            {
                item
                , option: Ecommerce_articles_OPTIONS.data.find(el=>el.img_article==item.img&&(item.autre==(el.opt_nom||"") || item.taille==el.taille_||""))
                , img: "img/vente-religieuse/"+Ecommerce_articles.articles_img_table[item.nom]+"/"+item.img+".webp"
            }
        )
        console.log(bestSellersArticles.item);
    }, [])
    

    return (
        // <figure className={item.user_name +" "+item.nom.replace(' ','_').replace('.','_').replace('/','_')}>
        <article className={"bestseller"}>
            <h4><u>ACHETER UN BEST-SELLERS</u> DE LA LIBRAIRE PUISSANCE DIVINE: </h4>
                {/* <ModalProduct {...{myLoader, bestSellersArticles.item, setCartBox, bestSellersArticles.option, handleAddToCart, img:"img/vente-religieuse/min/"+Ecommerce_articles.articles_img_table[item.nom]+"/"+item.img+".webp"}} /> */}

                {/* 
                <Image
                    loader={myLoader}
                    src={bestSellersArticles.img}
                    alt="dsfihdoi fdio hfds"
                    // width={"100"}
                    // height={"100"}
                    fill={"true"}
                />
                */}
                <img src={bestSellersArticles.img} alt="dsfihdoi fdio hfds" className='safe' />

                <section className="details">
                    {/* <div>{JSON.stringify(articles_title_table)}</div> */}
                    <h5 title={bestSellersArticles.item?.fr__}>{bestSellersArticles.item?.fr__}</h5>
                    {/* <p className="dimensions">{bestSellersArticles.item?.dimensions}</p> */}
                    <div>
                        {/* {bestSellersArticles.item?.nom} - 
                        {bestSellersArticles.item?.nom.substr(1)} - 
                        {articles_title_table[bestSellersArticles.item?.nom]} - 
                        {articles_title_table[bestSellersArticles.item?.nom.substr(1)]} -  */}
                        <span className='cat'>{articles_title_table[bestSellersArticles.item?.nom]||articles_title_table[bestSellersArticles.item?.nom.substr(1)]}</span>
                        <span className='dim'>{articles_title_table[bestSellersArticles.item?.dimensions]}</span>
                    </div>
                    <p className='descr'>{bestSellersArticles.item?.fr1 != "" ? bestSellersArticles.item?.fr1 : "AUCUNE DESCRIPTION DISPONIBLE."}</p>
                    {/* <span>{bestSellersArticles.item.id_produits && JSON.stringify(bestSellersArticles.option)}</span> */}
                    <button className="options" onClick={handleVariantButtonHover}>
                        <span>Ɏ</span>
                        { bestSellersArticles.option &&<>
                                {bestSellersArticles.option?.coloris && <div className="coloris">{bestSellersArticles.option?.coloris}</div>}
                                {bestSellersArticles.option?.couverture && <div className="couverture">{bestSellersArticles.option?.couverture}</div>}
                                {bestSellersArticles.option?.opt_nom && <div className="option_name">{bestSellersArticles.option?.opt_nom}</div>}
                            </>
                        }
                    </button>
                </section>
                <section className="buying_details">
                    <input defaultValue="0" className="qty" type="number" min="1" max="99" title={"Choisir une quantité entre 1 et 99"} />
                    <span className="prix">{bestSellersArticles.item?.prix} </span>
                    <button className="addToCart"
                        onClick={(e)=>{handleAddToCart(e,setCartBox, miniCart)}}
                        data-id={bestSellersArticles.item?.id_produits}
                        data-coloris={bestSellersArticles.option?.coloris || ""}
                        data-couverture={bestSellersArticles.option?.couverture || ""}
                        data-option_name={bestSellersArticles.option?.opt_nom || ""}
                        data-price={bestSellersArticles.item?.prix}
                        title={"Ajouter au panier"}
                    >
                        <span>buy it now!</span>
                    </button>
                    {/* <button className="showArticleModal" onClick={handleModalShowProduct} title={"Afficher article"}>🔎</button> */}
                </section>
        </article>
    )
}

export default BestSellers