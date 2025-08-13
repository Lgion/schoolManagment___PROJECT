const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
// const classeSchema = require("./Classe")
const {schema} = require("../Classe")
console.log(schema);

const teacherSchema = mongoose.Schema({
    // current_classes: { default: "", type: Object, required:true },
    current_classes: { default: "", type: ObjectId, ref: Object.keys(schema.obj)[0], required:true },
    nom: { default: "", type: String, required:true },
    prenoms: { default: "", type: String, required:true },
    naissance_$_date: { default: new Date().getTime(), type: Number, required:true },
    adresse: { default: "", type: String, required:true },
    photo_$_file: { default: "", type: String, required:true },
    phone_$_tel: { default: "+2250102030405", type: String, required:true },
    email_$_email: { default: "email.exemple.com", type: String, required:true },
})


console.log("teach......");
// console.log(schema.obj);
// console.log(Object.keys(schema.obj));
// console.log(Object.keys(schema.obj)[0]);


let model 

if(!mongoose.modelNames().includes("Profs_Ecole_St_Martin")){
    model = mongoose.model('Profs_Ecole_St_Martin', teacherSchema)
}else{
    model = mongoose.model("Profs_Ecole_St_Martin")
}
// console.log("model teach");
// console.log(model);
module.exports = model