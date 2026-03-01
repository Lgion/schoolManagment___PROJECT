const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
// const classeSchema = require("./Classe")
const { schema: schemaClasseForTeacher } = require("./Classe")

const teacherSchema = mongoose.Schema({
  // current_classes: { default: "", type: Object, required:true },
  // current_classes_$_ref_µ_classes: { default: "", type: ObjectId, ref: Object.keys(schema.obj)[0], required:true },
  current_classes: { default: [], type: [ObjectId], ref: Object.keys(schemaClasseForTeacher.obj)[0], required: true },
  nom: { default: "", type: String, required: true },
  prenoms: { default: [], type: [String], required: true },
  sexe: { default: "", type: String, required: true }, // M ou F
  naissance_$_date: { default: new Date().getTime(), type: Number, required: true },
  adresse_$_map: { default: "", type: String, required: true },
  photo_$_file: { default: "/school/prof.webp", type: String, required: false },
  phone_$_tel: { default: "+2250102030455", type: String, required: true },
  email_$_email: { default: "email@exemple.com", type: String, required: true },
  createdAt: { default: +new Date(), type: String },
  // Objet Cloudinary pour les images optimisées
  cloudinary: {
    type: Object,
    default: null,
    required: false
  },
})

// Middleware pour capturer l'ancienne valeur avant modification
// DÉSACTIVÉ : nous capturons _original dans l'API maintenant
// teacherSchema.pre('save', function(next) {
//   if (!this.isNew) {
//     this._original = this.toObject()
//   }
//   next()
// })

// Middleware pour synchroniser automatiquement les listes de classes
teacherSchema.post('save', async function (doc, next) {
  console.log('🔍 DEBUG: Middleware post-save déclenché pour enseignant:', doc._id)
  console.log('🔍 DEBUG: current_classes actuelle:', doc.current_classes)
  console.log('🔍 DEBUG: current_classes précédente:', this._original?.current_classes)

  // Comparer directement les valeurs au lieu d'utiliser isModified()
  const oldClasses = this._original?.current_classes || []
  const newClasses = doc.current_classes || []
  const hasChanged = JSON.stringify(oldClasses.sort()) !== JSON.stringify(newClasses.sort())

  console.log('🔍 DEBUG: Comparaison directe - hasChanged:', hasChanged)

  if (hasChanged) {
    try {
      // Pas besoin de réimporter mongoose, il est déjà disponible

      // Ajouter l'enseignant aux nouvelles classes
      for (const classeId of newClasses) {
        if (!oldClasses.includes(classeId)) {
          await mongoose.model('ai_Ecole_St_Martin')
            .findByIdAndUpdate(classeId, {
              $addToSet: { professeur: doc._id }
            })
          console.log(`✅ Enseignant ${doc._id} ajouté à la classe ${classeId}`)
        }
      }

      // Retirer l'enseignant des anciennes classes (Désactivé pour garder l'historique par année)
      /* 
      for (const classeId of oldClasses) {
        if (!newClasses.includes(classeId)) {
          await mongoose.model('ai_Ecole_St_Martin')
            .findByIdAndUpdate(classeId, {
              $pull: { professeur: doc._id }
            })
          console.log(`✅ Enseignant ${doc._id} retiré de l'ancienne classe ${classeId}`)
        }
      }
      */
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation des classes pour enseignant:', error)
    }
  } else {
    console.log('⚠️ DEBUG: current_classes non modifiées, middleware ignoré')
  }
  next()
})

// Middleware pour nettoyer les classes lors de la suppression d'un enseignant
teacherSchema.post('findOneAndDelete', async function (doc) {
  if (doc && doc.current_classes && doc.current_classes.length > 0) {
    const mongoose = require('mongoose')

    try {
      for (const classeId of doc.current_classes) {
        await mongoose.model('ai_Ecole_St_Martin')
          .findByIdAndUpdate(classeId, {
            $pull: { professeur: doc._id }
          })
        console.log(`✅ Enseignant ${doc._id} retiré de la classe ${classeId} lors de la suppression`)
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des classes pour enseignant supprimé:', error)
    }
  }
})


let model

if (!mongoose.modelNames().includes("ai_Profs_Ecole_St_Martin")) {
  model = mongoose.model('ai_Profs_Ecole_St_Martin', teacherSchema)
} else {
  model = mongoose.model("ai_Profs_Ecole_St_Martin")
}

module.exports = model