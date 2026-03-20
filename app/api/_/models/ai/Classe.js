const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const classeSchema = mongoose.Schema({
  // Listes synchronisées automatiquement via les middlewares des modèles Eleve et Teacher
  professeur: { default: [], type: [ObjectId], ref: 'ai_Profs_Ecole_St_Martin', required: false },
  eleves: { default: [], type: [ObjectId], ref: 'ai_Eleves_Ecole_St_Martin', required: false },

  annee: { default: "", type: String, required: true },
  niveau: { default: "", type: String, required: true },
  alias: { default: "", type: String, required: true },
  photo: { default: "/school/classe.webp", type: String, required: false },
  
  homework: { default: {}, type: Object, required: false },
  compositions: { default: [], type: Array, required: false },
  coefficients: {
    default: {},
    type: Object,
    required: false,
  },
  moyenne_trimetriel: {
    default: ["", "", ""], 
    type: [String],
    validate: {
      validator: function (val) {
        return val.length === 3;
      },
      message: 'Le champ "moyenne_trimetriel" doit contenir exactement 3 valeurs.',
    },
  },
  commentaires: { default: [], type: [Object], required: false },
  schedules: [{ type: ObjectId, ref: 'Schedule' }],
  currentScheduleId: { type: ObjectId, ref: 'Schedule' },
  createdAt: { default: +new Date(), type: String },
  
  // Objet Cloudinary pour les images optimisées
  cloudinary: {
    type: Object,
    default: null,
    required: false
  },
  reports: {
    type: [Object],
    default: [],
  },
  // Nouveau champ historique pour stocker les captures des années précédentes
  history: {
    type: [Object],
    default: [],
  }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
})

// Middleware pour nettoyer les références dans les élèves et enseignants lors de la suppression d'une classe
classeSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    console.log(' DEBUG: Nettoyage des références pour la classe supprimée:', doc._id)

    try {
      // Nettoyer les références dans les élèves
      if (doc.eleves && doc.eleves.length > 0) {
        await mongoose.model('ai_Eleves_Ecole_St_Martin')
          .updateMany(
            { _id: { $in: doc.eleves } },
            { $set: { current_classe: "" } }
          )
        console.log(` ${doc.eleves.length} élèves mis à jour (current_classe vidé)`)
      }

      // Nettoyer les références dans les enseignants
      if (doc.professeur && doc.professeur.length > 0) {
        await mongoose.model('ai_Profs_Ecole_St_Martin')
          .updateMany(
            { _id: { $in: doc.professeur } },
            { $pull: { current_classes: doc._id } }
          )
        console.log(` ${doc.professeur.length} enseignants mis à jour (classe retirée de current_classes)`)
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des références de classe:', error)
    }
  }
})

let model

if (!mongoose.modelNames().includes("ai_Ecole_St_Martin"))
  model = mongoose.model('ai_Ecole_St_Martin', classeSchema)
else model = mongoose.model("ai_Ecole_St_Martin")

module.exports = model