const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `AttendanceRecord` : une session d'appel pour une classe, un jour
// et une période donnés. Les statuts élève par élève vivent dans `AttendanceEntry`.
// On sépare la session des statuts (comme PointTransaction/PointLabel) afin de
// pouvoir générer des registres ou des statistiques par la suite.
const attendanceRecordSchema = mongoose.Schema({
  // Classe concernée par l'appel
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', required: true },
  // Professeur ayant fait l'appel. Optionnel : admin sans fiche prof, mode sample, etc.
  teacherId: { type: ObjectId, ref: 'ai_Profs_Ecole_St_Martin', required: false, default: null },
  // Jour de l'appel, normalisé à minuit UTC pour éviter les bugs de fuseau.
  date: { type: Date, required: true },
  // Période de la journée
  period: {
    type: String,
    enum: ['MATIN', 'APRES_MIDI'],
    default: 'MATIN',
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
})

// Un seul appel par (classe, jour, période) : revalider remplace la session existante.
attendanceRecordSchema.index({ classId: 1, date: -1 })
attendanceRecordSchema.index({ classId: 1, date: 1, period: 1 }, { unique: true })

let model

if (!mongoose.modelNames().includes('ai_AttendanceRecords_Ecole_St_Martin'))
  model = mongoose.model('ai_AttendanceRecords_Ecole_St_Martin', attendanceRecordSchema)
else model = mongoose.model('ai_AttendanceRecords_Ecole_St_Martin')

module.exports = model
