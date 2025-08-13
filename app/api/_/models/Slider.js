const mongoose = require('mongoose')

const sliderSchema = mongoose.Schema({
    identifiant_$_hidden: {default:"", type: String, required:true }
    , src_$_file: {default: "", type: String, required:true }
    , cat: {default: "home", type: String, required:true }
    , alt: {default: "", type: String, required:true }
    , title: {default: "", type: String, required:true }
    , figcaption: {default: "", type: String, required:true }
    , p: {default: "", type: String, required:true }
    , metas: {default: {}, type: Object, required:true }
})


let modelDiapo = !mongoose.modelNames().includes("Diapos_slider")
  ? mongoose.model('Diapos_slider', sliderSchema)
  : mongoose.model("Diapos_slider")
module.exports = modelDiapo