const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `Appointment` (cf. spec appointments_management.md) : rendez-vous et
// convocations parent ↔ professeur, distincts des Event. Système de
// proposition/acceptation souple (pas de créneaux pré-réservés type Doctolib).
//
// `teacherRef` est ajouté (hors spec stricte) pour libeller les cartes et
// préparer l'insertion du RDV confirmé dans l'EDT agrégé du professeur.
const dateRangeSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false }
)

const appointmentSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  initiatorId: { type: String, required: true }, // clerkId
  initiatorRole: { type: String, enum: ['parent', 'prof'], required: true },
  recipientId: { type: String, required: true }, // clerkId
  studentId: { type: ObjectId, ref: 'ai_Eleves_Ecole_St_Martin', required: true },
  teacherRef: { type: ObjectId, ref: 'ai_Profs_Ecole_St_Martin', default: null },
  title: { type: String, default: '', trim: true, maxlength: 160 },
  // Intitulé libre de l'entrevue (« Demande de rdv », « Convocation », …).
  statusLabel: { type: String, default: 'Demande de rdv', trim: true, maxlength: 80 },
  meetingStatus: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED', 'COMPLETED'],
    default: 'PENDING',
  },
  proposedDates: { type: [dateRangeSchema], default: [] },
  agreedDate: { type: dateRangeSchema, default: null },
  meetingFormatOptions: {
    type: [String],
    enum: ['PRESENTIAL', 'VISIO'],
    default: ['PRESENTIAL'],
  },
  agreedFormat: { type: String, enum: ['PRESENTIAL', 'VISIO', null], default: null },
  visioRoomName: { type: String, default: '' },
  message: { type: String, default: '', trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

appointmentSchema.index({ recipientId: 1, meetingStatus: 1, updatedAt: -1 })
appointmentSchema.index({ initiatorId: 1, updatedAt: -1 })
appointmentSchema.index({ teacherRef: 1, meetingStatus: 1 })

let model

if (!mongoose.modelNames().includes('ai_Appointments_Ecole_St_Martin'))
  model = mongoose.model('ai_Appointments_Ecole_St_Martin', appointmentSchema)
else model = mongoose.model('ai_Appointments_Ecole_St_Martin')

module.exports = model
