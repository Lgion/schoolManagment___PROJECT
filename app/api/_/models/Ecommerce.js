









const mongoose = require('mongoose')
, ecommerceSchema = mongoose.Schema({
    id_produits
    , nom: {default: "", type: String, required: true}



    // , user_name: {default: "", type: String, required: true}
    , type_ref: {default: "", type: String, required: true}
    // , fr: {default: "", type: String, required: true}
    , title: {default: "", type: String, required: true}
    // , fr1: {default: "", type: String, required: true}
    , descr: {default: "", type: String, required: true}



    , auteur: {default: "", type: String, required: true}
    , img_$_file: {default: "", type: String, required: true}
    // , en: {default: "", type: String, required: true}
    // , es: {default: "", type: String, required: true}
    // , en1: {default: "", type: String, required: true}
    // , es1: {default: "", type: String, required: true}
    , taille: {default: "", type: String, required: true}
    // , materiaux: {default: "", type: String, required: true}
    , autre: {default: "", type: String, required: true}
    , prix: {default: "", type: String, required: true}
    , stock: {default: "", type: String, required: true}
    , vendus: {default: "", type: String, required: true}
    , actif: {default: "", type: String, required: true}
    , isBestSeller: {default: "", type: String, required: true}
    , code: {default: "", type: String, required: true}
})

let modelEcommerce

if(!mongoose.models?.["Ecommerces"]){
    modelEcommerce = mongoose.model('Ecommerces', ecommerceSchema)
}else{
    modelEcommerce = mongoose.model("Ecommerces")
}
module.exports = modelEcommerce