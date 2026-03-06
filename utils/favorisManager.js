
import { getLSItem, setLSItem } from './localStorageManager';

export function getAllFavoris() {
    if (typeof window === 'undefined') return {};
    return getLSItem("cart") || {};
}


export function saveArticle(object, key = "cart") {
    if (typeof window !== 'undefined') {
        setLSItem(key, object);
    }
}


export function addArticle(articleID, qty) {
    if (typeof window !== 'undefined') {
        setLSItem("cart", { ...getAllFavoris(), [articleID]: qty });
    }
}


export function deleteArticle(articleID) {
    if (typeof window !== 'undefined') {
        const ls = getAllFavoris()
        delete ls[articleID]
        setLSItem("cart", ls);
    }
}


export function getFavorisIDs() {
    return Object.keys(getAllFavoris())
}



