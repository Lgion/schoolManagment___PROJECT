const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const {schema: schemaClasseForEleve} = require("./Classe")
// const {schema: schemaClasse} = require("./Classe")
console.log("iii");
console.log(schemaClasseForEleve);

let currentSchoolYear = new Date()
currentSchoolYear = (currentSchoolYear.getMonth()+1)<7 ? (currentSchoolYear.getFullYear()-1)+"-"+currentSchoolYear.getFullYear() : currentSchoolYear.getFullYear()+"-"+(currentSchoolYear.getFullYear()+1)
let currentSchoolYearField = {[currentSchoolYear]: false}

const studentSchema = mongoose.Schema({
    // current_classe_$_ref_µ_classes: { default: "", type: Object, required: true },
    current_classe: { default: "", type: ObjectId, ref: Object.keys(schemaClasseForEleve.obj)[0], required: true },
    nom: { default: "", type: String, required: true },
    prenoms: { default: [""], type: [Object], required: true },
    sexe: { default: "", type: String, required:true },
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
    absences: { default: [], type: [Object], required: true },
    notes: { default: {[currentSchoolYear]: {}}, type: Object, required: true },
    compositions: { default: currentSchoolYearField, type: Object, required: true },
    // moyenne_trimetriel: {
    //     default: {[currentSchoolYear]: ["", "", ""]}, type: Object,
    //     // validate: {
    //     //     validator: function (eleves) {
    //     //         return eleves.length === 3;
    //     //     },
    //     //     message: 'Le champ "eleves" doit contenir exactement 3 valeurs.',
    //     // },
    // },
    bonus: { default: [], type: [Object], required: true },
    manus: { default: [], type: [Object], required: true },
    isInterne: { default: false, type: Boolean, required: true },
    commentaires: { default: [], type: [Object], required: true },
    documents: { default: [], type: [String], required: true },
    createdAt: { default: +new Date(), type: String},

})

// Middleware pour capturer l'ancienne valeur avant modification
// DÉSACTIVÉ : nous capturons _original dans l'API maintenant
// studentSchema.pre('save', function(next) {
//   console.log("111uuuuuuuuuuuuuuuuuu");
//   console.log(this.isNew);
//   console.log("222uuuuuuuuuuuuuuuuuu");
//   
//   if (!this.isNew) {
//     this._original = this.toObject()
//   }
//   next()
// })

// Middleware pour synchroniser automatiquement les listes de classes
studentSchema.post('save', async function(doc, next) {
  console.log('🔍 DEBUG: Middleware post-save déclenché pour élève:', doc._id)
  console.log('🔍 DEBUG: current_classe actuelle:', doc.current_classe)
  console.log('🔍 DEBUG: current_classe précédente:', this._original?.current_classe)
  
  // Comparer directement les valeurs au lieu d'utiliser isModified()
  const currentClasse = doc.current_classe?.toString()
  const previousClasse = this._original?.current_classe?.toString()
  const hasChanged = currentClasse !== previousClasse
  
  console.log('🔍 DEBUG: Comparaison directe - hasChanged:', hasChanged)
  
  if (hasChanged) {
    try {
      // Ajouter l'élève à la nouvelle classe
      if (doc.current_classe) {
        await mongoose.model('ai_Ecole_St_Martin')
          .findByIdAndUpdate(doc.current_classe, {
            $addToSet: { eleves: doc._id }
          })
        console.log(`✅ Élève ${doc._id} ajouté à la classe ${doc.current_classe}`)
      }
      
      // Retirer l'élève de l'ancienne classe
      if (this._original?.current_classe && this._original.current_classe !== doc.current_classe) {
        await mongoose.model('ai_Ecole_St_Martin')
          .findByIdAndUpdate(this._original.current_classe, {
            $pull: { eleves: doc._id }
          })
        console.log(`✅ Élève ${doc._id} retiré de l'ancienne classe ${this._original.current_classe}`)
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des classes pour élève:', error)
    }
  } else {
    console.log('⚠️ DEBUG: current_classe non modifiée, middleware ignoré')
  }
  next()
})

// Middleware pour nettoyer les classes lors de la suppression d'un élève
studentSchema.post('findOneAndDelete', async function(doc) {
  if (doc && doc.current_classe) {
    try {
      await mongoose.model('ai_Ecole_St_Martin')
        .findByIdAndUpdate(doc.current_classe, {
          $pull: { eleves: doc._id }
        })
      console.log(`✅ Élève ${doc._id} retiré de la classe ${doc.current_classe} lors de la suppression`)
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des classes pour élève supprimé:', error)
    }
  }
})


let model 

if(!mongoose.modelNames().includes("ai_Eleves_Ecole_St_Martin"))
    model = mongoose.model('ai_Eleves_Ecole_St_Martin', studentSchema)
else model = mongoose.model("ai_Eleves_Ecole_St_Martin")

module.exports = model