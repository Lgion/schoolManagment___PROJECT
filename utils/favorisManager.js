


export function getAllFavoris(){
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.cart || "{}")
}


export function saveArticle(object, key="cart"){
    if (typeof window !== 'undefined') {
        localStorage[key] = JSON.stringify(object)
    }
}


export function addArticle(articleID,qty){
    if (typeof window !== 'undefined') {
        localStorage.cart = JSON.stringify({...getAllFavoris(), [articleID]: qty})
    }
}


export function deleteArticle(articleID){
    if (typeof window !== 'undefined') {
        const ls = getAllFavoris()
        delete ls[articleID]
        localStorage.cart = JSON.stringify(ls)
    }
}


export function getFavorisIDs(){
    return Object.keys(getAllFavoris())
}



