


export function getAllFavoris(){
    return JSON.parse(localStorage.cart || "{}")
}


export function saveArticle(object, key="cart"){
    localStorage[key] = JSON.stringify(object)
}


export function addArticle(articleID,qty){
    localStorage.cart = JSON.stringify({...getAllFavoris(), [articleID]: qty})
}


export function deleteArticle(articleID){
    const ls = getAllFavoris()
    delete ls[articleID]
    localStorage.cart = JSON.stringify(ls)
}


export function getFavorisIDs(){
    return Object.keys(getAllFavoris())
}



