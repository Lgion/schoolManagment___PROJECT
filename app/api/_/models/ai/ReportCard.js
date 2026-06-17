const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Sous-document : une ligne matière du bulletin (figée au moment de la génération).
const subjectLineSchema = new mongoose.Schema({
  key: { type: String, required: true },        // ObjectId matière ou nom (selon format source)
  name: { type: String, default: '' },          // nom résolu pour l'affichage/PDF
  average: { type: Number, default: null },      // moyenne élève /20
  classAverage: { type: Number, default: null }, // moyenne classe /20
  classMin: { type: Number, default: null },
  classMax: { type: Number, default: null },
  appreciation: { type: String, default: '' },
}, { _id: false })

// Collection `ReportCard` : bulletin officiel archivé. On fige les données calculées
// pour ne pas recalculer à chaque consultation et garder une trace historique.
const reportCardSchema = mongoose.Schema({
  studentId: { type: ObjectId, ref: 'ai_Eleves_Ecole_St_Martin', required: true },
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', required: true },
  // Période : TRIMESTRE_1 | TRIMESTRE_2 | TRIMESTRE_3 | ANNUEL
  period: { type: String, required: true },
  // Année scolaire (ex: "2024-2025")
  schoolYear: { type: String, required: true },
  // Moyenne générale figée /20
  globalAverage: { type: Number, default: null },
  // Comparatifs classe
  classGeneralAverage: { type: Number, default: null },
  rank: { type: Number, default: null },
  classSize: { type: Number, default: 0 },
  mention: { type: String, default: '' },
  // Origine des notes : 'compositions' (officiel, ventilé par trimestre) ou
  // 'notes' (format simple, non ventilé par trimestre → même moyenne pour toutes les périodes).
  source: { type: String, default: '' },
  // Détail par matière
  subjects: { type: [subjectLineSchema], default: [] },
  // Appréciation générale (personnalisée pour cet élève / cette période)
  generalAppreciation: { type: String, default: '', trim: true },
  // Bulletin de classe (conseil de classe) plutôt qu'un bulletin élève
  isClassSummary: { type: Boolean, default: false },
  generatedBy: { type: ObjectId, ref: 'ai_Profs_Ecole_St_Martin', required: false, default: null },
  createdAt: { type: Date, default: Date.now },
})

// Un bulletin par (élève, année, période) : régénérer remplace.
reportCardSchema.index({ studentId: 1, schoolYear: 1, period: 1 }, { unique: true })
reportCardSchema.index({ classId: 1, schoolYear: 1, period: 1 })

let model

if (!mongoose.modelNames().includes('ai_ReportCards_Ecole_St_Martin'))
  model = mongoose.model('ai_ReportCards_Ecole_St_Martin', reportCardSchema)
else model = mongoose.model('ai_ReportCards_Ecole_St_Martin')

module.exports = model
