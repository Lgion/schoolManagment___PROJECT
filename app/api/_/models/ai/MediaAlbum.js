const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Une photo capturée en visio. On conserve `publicId` (et non seulement l'URL)
// pour pouvoir générer des URLs signées Cloudinary à la lecture (RGPD) et
// détruire définitivement le fichier sur Cloudinary lors d'une suppression.
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // secure_url Cloudinary (ou chemin local en dev)
    publicId: { type: String, default: '' }, // Cloudinary public_id (vide si fallback local)
    caption: { type: String, default: '', trim: true, maxlength: 200 },
    uploadedBy: { type: String, default: null }, // clerkId
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

// Collection `MediaAlbum` : un album = les souvenirs (photos) d'une visio.
// Deux portées, alignées sur `Event` :
//  - isGlobal = true  → album école (événement global), visible de tous les connectés.
//  - isGlobal = false → album de classe, accès restreint (élèves/parents de la classe + corps prof).
// Un album est rattaché soit à un `Event` (eventId), soit directement à une classe (classId).
const mediaAlbumSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  title: { type: String, required: true, trim: true, maxlength: 200 },
  date: { type: Date, default: Date.now }, // date de la session (tri chronologique)
  academicYear: { type: String, required: true }, // ex: "2025-2026" — filtrage galerie
  cloudinaryFolder: { type: String, default: '' }, // chemin exact du dossier Cloudinary
  images: { type: [imageSchema], default: [] },
  eventId: { type: ObjectId, ref: 'ai_Events_Ecole_St_Martin', default: null },
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', default: null },
  isGlobal: { type: Boolean, default: false },
  createdBy: { type: String, default: null }, // clerkId
  createdAt: { type: Date, default: Date.now },
})

mediaAlbumSchema.index({ academicYear: 1, date: -1 })
mediaAlbumSchema.index({ eventId: 1 })
mediaAlbumSchema.index({ classId: 1, academicYear: 1 })

let model

if (!mongoose.modelNames().includes('ai_MediaAlbums_Ecole_St_Martin'))
  model = mongoose.model('ai_MediaAlbums_Ecole_St_Martin', mediaAlbumSchema)
else model = mongoose.model('ai_MediaAlbums_Ecole_St_Martin')

module.exports = model
