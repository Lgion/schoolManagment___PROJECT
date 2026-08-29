const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `Event` : événements de l'école (globaux) ou d'une classe (locaux).
// Deux portées :
//  - isGlobal = true  → événement école, visible de tous (créé par un admin)
//  - isGlobal = false → événement de classe, classId requis (créé par prof/admin)
const eventSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  // Datetimes complets (un événement peut couvrir une plage horaire précise).
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isGlobal: { type: Boolean, default: false },
  // Requis si l'événement n'est pas global.
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', default: null },
  location: { type: String, default: '', trim: true, maxlength: 200 },
  // Sert à colorer / iconifier dans l'UI.
  type: {
    type: String,
    enum: ['SORTIE', 'EVALUATION', 'REUNION', 'FERMETURE', 'AUTRE'],
    default: 'AUTRE',
  },
  // Stocké pour mémoire ; l'envoi effectif dépendra de l'infra messagerie (à venir).
  notifyParents: { type: Boolean, default: false },
  // Visioconférence : si activée, un salon Jitsi est rattaché à l'événement
  // (« Rejoindre le Direct »). Le nom du salon est cryptique et stable (basé sur l'_id).
  hasVisio: { type: Boolean, default: false },
  visioRoomName: { type: String, default: '' },
  createdBy: { type: String, default: null }, // clerkId
  createdAt: { type: Date, default: Date.now },
})

eventSchema.index({ classId: 1, startDate: 1 })
eventSchema.index({ isGlobal: 1, startDate: 1 })

let model

if (!mongoose.modelNames().includes('ai_Events_Ecole_St_Martin'))
  model = mongoose.model('ai_Events_Ecole_St_Martin', eventSchema)
else model = mongoose.model('ai_Events_Ecole_St_Martin')

module.exports = model
