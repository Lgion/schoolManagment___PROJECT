const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// S'assurer que le modèle Teacher est enregistré pour les `populate`
require('./Teacher')

// Collection `ClassDocument` : documents de cours (PDF) partagés par un professeur
// avec une classe. Le fichier lui-même est hébergé sur un stockage cloud externe
// (Cloudinary) ; la base ne conserve que les métadonnées et l'URL distante.
const classDocumentSchema = mongoose.Schema({
  // Classe concernée par le document
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', required: true },
  // Professeur ayant déposé le fichier.
  // Optionnel au niveau BDD pour couvrir les dépôts par un admin sans fiche Teacher
  // ou le mode sample/falsy. Renseigné dès qu'une fiche Teacher est résolvable.
  teacherId: { type: ObjectId, ref: 'ai_Profs_Ecole_St_Martin', required: false, default: null },
  // Titre lisible saisi par le professeur (ex: "Chapitre 1 : Les fractions")
  title: { type: String, required: true, trim: true },
  // URL distante du fichier (secure_url Cloudinary)
  fileUrl: { type: String, required: true },
  // Identifiant Cloudinary, indispensable pour supprimer le fichier distant.
  // Null si le fichier a été stocké autrement (fallback local en dev).
  cloudinaryPublicId: { type: String, required: false, default: null },
  // Type de ressource Cloudinary (raw|image|...), nécessaire pour destroy().
  cloudinaryResourceType: { type: String, required: false, default: 'raw' },
  // Taille du fichier en octets (utile pour l'affichage UI)
  fileSize: { type: Number, required: false, default: null },
  createdAt: { type: Date, default: Date.now },
})

// Index pour récupérer rapidement les documents d'une classe (le plus récent d'abord)
classDocumentSchema.index({ classId: 1, createdAt: -1 })

let model

if (!mongoose.modelNames().includes('ai_ClassDocuments_Ecole_St_Martin'))
  model = mongoose.model('ai_ClassDocuments_Ecole_St_Martin', classDocumentSchema)
else model = mongoose.model('ai_ClassDocuments_Ecole_St_Martin')

module.exports = model
