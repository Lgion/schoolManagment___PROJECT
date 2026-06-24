const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Charger les modèles référencés pour le peuplement (populate)
require('./Classe')
require('./Eleve')
require('./Post')

const classMediaSchema = new Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', required: true },
  postId: { type: ObjectId, ref: 'ai_Posts_Ecole_St_Martin', required: false, default: null },
  url: { type: String, required: true },
  source: { type: String, enum: ['UPLOAD_DIRECT', 'FEED_POST'], default: 'UPLOAD_DIRECT' },
  tags: [{ type: ObjectId, ref: 'ai_Eleves_Ecole_St_Martin' }],
  inClassBook: { type: Boolean, default: false },
  caption: { type: String, default: '', trim: true }
}, {
  timestamps: true
})

// Index pour recherche rapide
classMediaSchema.index({ classId: 1, inClassBook: 1 })
classMediaSchema.index({ postId: 1 })

let model

if (!mongoose.modelNames().includes('ai_ClassMedia_Ecole_St_Martin')) {
  model = mongoose.model('ai_ClassMedia_Ecole_St_Martin', classMediaSchema)
} else {
  model = mongoose.model('ai_ClassMedia_Ecole_St_Martin')
}

module.exports = model
