const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
// const {schema} = require("./Teacher")
// const {schema} = require("./Eleve")
import {modelProfs,modelEleves} from './School'
// const {schema: schemaTeacher} = require("./Teacher")
// const {schema: schemaStudent} = require("./Eleve")
console.log(modelProfs);
let {schema: schemaTeacher} = modelProfs
let {schema: schemaEleve} = modelEleves




const classeSchema = mongoose.Schema({
    // professeur: { default: "", type: [ObjectId], ref: Object.keys(schemaTeacher.obj)[0], required: true },
    professeur: { default: "", type: [Object], required: true },
    // eleves: { default: [], type: [ObjectId], ref: Object.keys(schemaStudent.obj)[0], required: true },
    eleves: { default: "", type: [Object], required: true },
    annee: { default: "", type: String, required: true },
    niveau: { default: "", type: String, required: true },
    alias: { default: "", type: String, required: true },
    photo: { default: "", type: String, required: true },
    // photo: {
    //   data: Buffer,
    //   contentType: String,
    // },
    homework: { default: {}, type: Object, required: true },
    // absences: { default: {}, type: Object, required: true },
    compositions: { default: [], type: Object, required: true },
    moyenne_trimetriel: {
        default: ["", "", ""], type: [String],
        validate: {
            validator: function (eleves) {
                return eleves.length === 3;
            },
            message: 'Le champ "eleves" doit contenir exactement 3 valeurs.',
        },
    },
    commentaires: { default: [], type: [Object], required: true },

})



// console.log("classe......");
// console.log(schemaTeacher);
// console.log(schemaTeacher.obj);
// console.log(Object.keys(schemaTeacher.obj));
// console.log(Object.keys(schemaTeacher.obj)[0]);


let model 

if(!mongoose.modelNames().includes("Ecole_St_Martin"))
    model = mongoose.model('Ecole_St_Martin', classeSchema)
else model = mongoose.model("Ecole_St_Martin")
// console.log("model classe");
// console.log(model);
module.exports = model