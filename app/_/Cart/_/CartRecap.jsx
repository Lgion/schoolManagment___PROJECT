import {useState,useEffect,useContext} from 'react'
import Image from "next/image"
// import * as CartLS from "../../../../utils/favorisManager.js"
import * as Ecommerce_articles from "../../../../assets/datas/articles.js"
// import CartPaypal from './CartPaypal';
// import CartGoogle from './CartGoogle';
import AuthContext from "../../../../stores/ecomContext.js"
import EcomContext from "../../../../stores/ecomContext.js"

export default function CartRecap() {

    const {userConnectedDatas } = useContext(AuthContext)
    const {CartLS,handleQty} = useContext(EcomContext)
    // Perform localStorage action
    , [output, setOutput] = useState([])
    , myLoader = ({ src, width, quality }) => {
        return `${src}?w=${width}&q=${quality || 75}`
    }
    , start = () => { 
        let totalProducts = 0
        , totalAmount = 0
        , ls = CartLS.getAllFavoris()
        , cartArray = Object.keys(ls)
        , len = cartArray.length
        

        
        if(!len)
            setOutput(<p className="voidCart">Votre panier est vide..</p>)
        else{
            totalProducts = len == 1 ? ls[cartArray[0]] : cartArray.reduce((a,b, index)=>{
                if(index==1)return parseInt(ls[a])+parseInt(ls[b])
                else return a+ls[b]
            })
            totalAmount = len == 1 ? ls[cartArray[0]]*JSON.parse(cartArray[0]).price : cartArray.reduce((a,b, index)=>{
                const price = [JSON.parse(a).price,JSON.parse(b).price]
                if(index==1)return parseInt(ls[a])*parseInt(price[0])+parseInt(ls[b])*parseInt(price[1])
                else return a+ls[b]*price[1]
            })
            setOutput(<>
                <section>
                    <div>
                        <p>Vous avez {len} produit{len!=1 && "s"} ({totalProducts}) dans le panier.</p>
                        <span title="Montant total">{totalAmount}</span>
                    </div>
                    {/* <CartPaypal connected={userConnectedDatas} /> */}
                    {/* <CartGoogle connected={userConnectedDatas} /> */}
                </section>
                <ul>
                    {!cartArray 
                        ? "Votre panier est vide"
                        : cartArray.map((item,i) => {
                            const k = JSON.parse(item)
                            // console.log(item)
                            // console.log(k)
                            const article = Ecommerce_articles.articles.data.find(el=>el.id_produits==k.id)
                            // console.log(article)
                            return <li key={"cartrecap_li_"+i} >
                                <Image
                                    loader={myLoader}
                                    src={"img/vente-religieuse/min/"+Ecommerce_articles.articles_img_table[article.nom]+"/"+article.img+".webp"}
                                    alt={""}
                                    width={200}                                    height={200}
                                />
                                <span className="prix">{article.prix} </span>
                                <p dangerouslySetInnerHTML={{__html:article.fr}}></p>
                                <input data-key={item} defaultValue={ls[item]} onChange={e=>{handleQty(e,ls)}} className="qty" type="number" min="1" max="99" title={"Choisir une quantité entre 1 et 99"} />
                                <button data-key={item} onClick={(e)=>{CartLS.deleteArticle(e.target.dataset.key);e.target.parentNode.remove();}}>⌫</button>
                            </li>
                        })
                    }
                </ul>
            </>)
        }
        
    }
    
    useEffect(() => { 
        
        start()
        
    }, [])

    return output
}

