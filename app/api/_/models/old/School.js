const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
// const {schema} = require("./Classe")
// console.log(schema);








const classeSchema = mongoose.Schema({
    // professeur: { default: "", type: [ObjectId], ref: Object.keys(schemaTeacher.obj)[0], required: true },
    professeur_$_ref_µ_teachers: { default: "", type: Object, required: true },
    // eleves: { default: [], type: [ObjectId], ref: Object.keys(schemaStudent.obj)[0], required: true },
    eleves_$_ref_µ_eleves: { default: "", type: Object, required: true },
    annee_$_number: { default: "", type: Number, required: true },
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
            message: 'Le champ "moyenne_trimetriel" doit contenir exactement 3 valeurs.',
        },
    },
    commentaires: { default: [], type: [Object], required: true },

})



// console.log("classe......");
// console.log(schemaTeacher);
// console.log(schemaTeacher.obj);
// console.log(Object.keys(schemaTeacher.obj));
// console.log(Object.keys(schemaTeacher.obj)[0]);


let modelClasses = !mongoose.modelNames().includes("Ecole_St_Martin")
  ? mongoose.model('Ecole_St_Martin', classeSchema)
  : mongoose.model("Ecole_St_Martin")















let currentSchoolYear = new Date()
currentSchoolYear = (currentSchoolYear.getMonth()+1)<7 ? (currentSchoolYear.getFullYear()-1)+"-"+currentSchoolYear.getFullYear() : currentSchoolYear.getFullYear()+"-"+(currentSchoolYear.getFullYear()+1)
let currentSchoolYearField = {[currentSchoolYear]: false}

const studentSchema = mongoose.Schema({
    current_classe_$_ref_µ_classes: { default: "", type: Object, required: true },
    // current_classe: { default: "", type: ObjectId, ref: Object.keys(classeSchema.obj)[0], required: true },
    nom: { default: "", type: String, required: true },
    prenoms: { default: "", type: String, required: true },
    naissance_$_date: { default: "", type: String, required: true },
    adresse: { default: "", type: String, required: true },
    parents: { default: {mere: "", pere: "", phone: ""}, type: Object },
    photo_$_file: { default: "", type: String },
    // photo: {
    //   data: Buffer,
    //   contentType: String,
    // },
    scolarity_fees_$_checkbox: { default: {[currentSchoolYear]: "checked"}, type: Object }, // => {YYYY: {}}
    bolobi_class_history_$_ref_µ_classes: { default: {[currentSchoolYear]:""}, type: Object },
    school_history: { default: {[currentSchoolYear]:""}, type: Object },
    absences: { default: {}, type: Object },
    notes: { default: {[currentSchoolYear]: {}}, type: Object },
    compositions: { default: currentSchoolYearField, type: Object },
    moyenne_trimetriel: {
        default: {[currentSchoolYear]: ["", "", ""]}, type: Object,
        // validate: {
        //     validator: function (eleves) {
        //         return eleves.length === 3;
        //     },
        //     message: 'Le champ "eleves" doit contenir exactement 3 valeurs.',
        // },
    },
    bonus: { default: [], type: [Object] },
    manus: { default: [], type: [Object] },
    isInternes_$_checkbox: { default: false, type: Boolean },
    commentaires: { default: [], type: [Object] },
    documents: { default: [], type: [String] },

})





let modelEleves

if(!mongoose.modelNames().includes("Eleves_Ecole_St_Martin"))
modelEleves = mongoose.model('Eleves_Ecole_St_Martin', studentSchema)
else modelEleves = mongoose.model("Eleves_Ecole_St_Martin")
// console.log("model stud");
// console.log(model);















const teacherSchema = mongoose.Schema({
    current_classes_$_ref_µ_classes: { default: {}, type: Object, required:true },
    // current_classes: { default: "", type: ObjectId, ref: Object.keys(classeSchema.obj)[0], required:true },
    nom: { default: "", type: String, required:true },
    prenoms: { default: "", type: String, required:true },
    naissance_$_date: { default: "", type: String, required:true },
    adresse: { default: "", type: String, required:true },
    photo_$_file: { default: "", type: String, required:true },
    phone_$_tel: { default: "+2250102030405", type: String, required:true },
    email_$_email: { default: "email.exemple.com", type: String, required:true },
})


console.log("teach......");
// console.log(schema.obj);
// console.log(Object.keys(schema.obj));
// console.log(Object.keys(schema.obj)[0]);


let modelProfs

if(!mongoose.modelNames().includes("Profs_Ecole_St_Martin")){
    modelProfs = mongoose.model('Profs_Ecole_St_Martin', teacherSchema)
}else{
    modelProfs = mongoose.model("Profs_Ecole_St_Martin")
}
// console.log("model teach");
// console.log(model);






















module.exports = {modelProfs,modelEleves,modelClasses}









