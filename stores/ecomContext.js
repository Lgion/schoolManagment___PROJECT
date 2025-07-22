"use client"

import {createContext, useEffect, useState, useMemo, useCallback} from 'react'
import * as Ecommerce_articles from "../assets/datas/articles.js"
import * as CartLS from "../utils/favorisManager.js"


const EcomContext = createContext({})
export default EcomContext

export const EcomContextProvider = ({children}) => {
    // Stocke uniquement les données du panier
    const [cartData, setCartData] = useState(() => {
        if (typeof window !== "undefined") {
            return CartLS.getAllFavoris();
        }
        return {};
    });
    const [cartBox, setCartBox] = useState(false)

    // Fonction pour mettre à jour le panier
    const updateCart = useCallback(() => {
        if (typeof window !== "undefined") {
            setCartData(CartLS.getAllFavoris());
        }
    }, []);

    // Fonction pour gérer la quantité
    const handleQty = useCallback((e, ls) => {
        if (typeof window !== "undefined") {
            ls[e.target.dataset.key] = e.target.value;
            CartLS.saveArticle(ls);
            updateCart();
        }
    }, [updateCart]);

    // miniCart devient une fonction de rendu pure
    const miniCart = useCallback(() => {
        const ls = cartData;
        const cartArray = Object.keys(ls);
        const len = cartArray.length;
        if (len === 0) {
            return <ul className="miniCart"><li>Votre panier est vide..</li></ul>;
        }
        // Calcul totalProducts et totalAmount
        const totalProducts = cartArray.reduce((acc, key) => acc + parseInt(ls[key]), 0);
        const totalAmount = cartArray.reduce((acc, key) => {
            const _item = JSON.parse(key);
            const qty = parseInt(ls[key]);
            return acc + (qty * (_item.price || 0));
        }, 0);
        return (
            <div className="miniCart">
                <div>Vous avez {len} produit{len !== 1 && "s"} ({totalProducts}) dans le panier.</div>
                <div>Montant total: {totalAmount}</div>
                <ul>
                    {cartArray.map((item, i) => {
                        const _item = JSON.parse(item);
                        const article = Ecommerce_articles.articles.data.find(el => el.id_produits == _item.id);
                        return (
                            <li key={"cart_item_" + i}>
                                <p>{article?.fr || "?"}</p>
                                <input data-key={item} defaultValue={ls[item]} onChange={e => handleQty(e, ls)} className="qty" type="number" min="1" max="99" />
                                <button data-key={item} onClick={() => { CartLS.deleteArticle(item); updateCart(); }}>🗑️</button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }, [cartData, handleQty, updateCart]);

    // Autres states/fonctions
    const articles_title_table = Ecommerce_articles.articles_title_table;
    const [selectOptions, setSelectOptions] = useState(Object.keys(Ecommerce_articles.articles_title_table)
        .map((item,i) => {
            if(item.charAt(0) == "_")
                return <option value={item.replace(' ','_').replace('.','_').replace('/','_')} key={"option_"+i}>
                    {Ecommerce_articles.articles_title_table[item]}
                </option>
        })
    )

    
    const contextValue = useMemo(() => ({
        cartData,
        miniCart,
        handleQty,
        updateCart,
        cartBox, 
        setCartBox,
        articles_title_table,
        selectOptions,
        setSelectOptions,
        CartLS,
    }), [cartData, miniCart, handleQty, updateCart, cartBox, setCartBox, articles_title_table, selectOptions]);

    return (
        <EcomContext.Provider value={contextValue}>
            {children}
        </EcomContext.Provider>
    )
}