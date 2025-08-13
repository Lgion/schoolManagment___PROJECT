const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
// const classeSchema = require("./Classe")
const {schema} = require("./Classe")
console.log(schema);

const teacherSchema = mongoose.Schema({
    // current_classes: { default: "", type: Object, required:true },
    // current_classes_$_ref_µ_classes: { default: "", type: ObjectId, ref: Object.keys(schema.obj)[0], required:true },
    current_classes: { default: "", type: ObjectId, ref: Object.keys(schema.obj)[0], required:true },
    nom: { default: "", type: String, required:true },
    prenoms: { default: [], type: [String], required:true },
    sexe: { default: "", type: String, required:true }, // M ou F
    naissance_$_date: { default: new Date().getTime(), type: Number, required:true },
    adresse_$_map: { default: "", type: String, required:true },
    photo_$_file: { default: "", type: String, required:true },
    phone_$_tel: { default: "+2250102030455", type: String, required:true },
    email_$_email: { default: "email@exemple.com", type: String, required:true },
    createdAt: { default: +new Date(), type: String},
})


let model 

if(!mongoose.modelNames().includes("ai_Profs_Ecole_St_Martin")){
    model = mongoose.model('ai_Profs_Ecole_St_Martin', teacherSchema)
}else{
    model = mongoose.model("ai_Profs_Ecole_St_Martin")
}

module.exports = model