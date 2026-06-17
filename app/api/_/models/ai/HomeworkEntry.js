const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `HomeworkEntry` : un devoir donné à une classe pour un jour de rendu.
// La clé d'accès principale est `dateDue` (minuit UTC du jour concerné), conformément
// à la logique « clés = timestamp du jour ».
const homeworkEntrySchema = mongoose.Schema({
  // Classe concernée
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', required: true },
  // Professeur ayant donné le devoir (optionnel : admin, mode sample)
  teacherId: { type: ObjectId, ref: 'ai_Profs_Ecole_St_Martin', required: false, default: null },
  // Matière (ex: "Mathématiques", "Histoire")
  subject: { type: String, required: true, trim: true },
  // Jour de rendu — clé principale, normalisé à minuit UTC.
  dateDue: { type: Date, required: true },
  // Jour où le devoir a été donné
  dateAssigned: { type: Date, default: Date.now },
  // Consignes (texte simple, sauts de ligne conservés à l'affichage)
  content: { type: String, required: true, trim: true },
  // Pièces jointes (URLs — lien avec l'upload de PDF de cours)
  attachments: { type: [String], default: [] },
  // Temps estimé en minutes (optionnel, apprécié des parents)
  estimatedTime: { type: Number, required: false, default: null },
  createdAt: { type: Date, default: Date.now },
})

// Récupérer les devoirs d'une classe sur une période (triés par jour de rendu)
homeworkEntrySchema.index({ classId: 1, dateDue: 1 })

let model

if (!mongoose.modelNames().includes('ai_HomeworkEntries_Ecole_St_Martin'))
  model = mongoose.model('ai_HomeworkEntries_Ecole_St_Martin', homeworkEntrySchema)
else model = mongoose.model('ai_HomeworkEntries_Ecole_St_Martin')

module.exports = model
