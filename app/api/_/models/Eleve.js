const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const {schema: schemaClasseForEleve} = require("./Classe")
// const {schema: schemaClasse} = require("./Classe")
// console.log("iii");
console.log(schemaClasseForEleve);

let currentSchoolYear = new Date()
currentSchoolYear = (currentSchoolYear.getMonth()+1)<7 ? (currentSchoolYear.getFullYear()-1)+"-"+currentSchoolYear.getFullYear() : currentSchoolYear.getFullYear()+"-"+(currentSchoolYear.getFullYear()+1)
let currentSchoolYearField = {[currentSchoolYear]: false}

const studentSchema = mongoose.Schema({
    // current_classe_$_ref_µ_classes: { default: "", type: Object, required: true },
    current_classe: { default: "", type: ObjectId, ref: Object.keys(schemaClasseForEleve.obj)[0], required: true },
    nom: { default: "", type: String, required: true },
    prenoms: { default: [""], type: [Object], required: true },
    naissance_$_date: { default: "", type: String, required: true },
    adresse_$_map: { default: "", type: String, required: true },
    parents: { default: {mere: "", pere: "", phone: ""}, type: Object, required: true },
    photo_$_file: { default: "", type: String, required: true },
    // photo: {
    //   data: Buffer,
    //   contentType: String,
    // },
    scolarity_fees_$_checkbox: { default: {[currentSchoolYear]: false}, type: Object, required: true }, // => {YYYY: {}}
    bolobi_class_history_$_ref_µ_classes: { default: {[currentSchoolYear]:""}, type: Object, required: true },
    school_history: { default: {[currentSchoolYear]:""}, type: Object, required: true },
    absences: { default: {}, type: [String], required: true },
    notes: { default: {[currentSchoolYear]: {}}, type: Object, required: true },
    compositions: { default: currentSchoolYearField, type: Object, required: true },
    moyenne_trimetriel: {
        default: {[currentSchoolYear]: ["", "", ""]}, type: Object,
        // validate: {
        //     validator: function (eleves) {
        //         return eleves.length === 3;
        //     },
        //     message: 'Le champ "eleves" doit contenir exactement 3 valeurs.',
        // },
    },
    bonus: { default: [], type: [Object], required: true },
    manus: { default: [], type: [Object], required: true },
    isInterne: { default: false, type: Boolean, required: true },
    commentaires: { default: [], type: [Object], required: true },
    documents: { default: [], type: [String], required: true },

})



// console.log(schema.obj);
// console.log(Object.keys(schema.obj));
// console.log(Object.keys(schema.obj)[0]);


let model 

if(!mongoose.modelNames().includes("Eleves_Ecole_St_Martin"))
    model = mongoose.model('Eleves_Ecole_St_Martin', studentSchema)
else model = mongoose.model("Eleves_Ecole_St_Martin")
// console.log("model stud");
// console.log(model);
module.exports = model