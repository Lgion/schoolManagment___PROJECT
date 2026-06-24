const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `HomeworkCompletion` : un élève coche un devoir comme terminé.
// On ne stocke une ligne que pour les devoirs effectivement faits ; l'absence
// de ligne vaut « à faire ».
const homeworkCompletionSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  studentId: { type: ObjectId, ref: 'ai_Eleves_Ecole_St_Martin', required: true },
  homeworkId: { type: ObjectId, ref: 'ai_HomeworkEntries_Ecole_St_Martin', required: true },
  status: { type: String, enum: ['DONE', 'TODO'], default: 'DONE', required: true },
  updatedAt: { type: Date, default: Date.now },
})

// Un seul état par (élève, devoir) — l'upsert/toggle de l'API en dépend.
homeworkCompletionSchema.index({ studentId: 1, homeworkId: 1 }, { unique: true })

let model

if (!mongoose.modelNames().includes('ai_HomeworkCompletions_Ecole_St_Martin'))
  model = mongoose.model('ai_HomeworkCompletions_Ecole_St_Martin', homeworkCompletionSchema)
else model = mongoose.model('ai_HomeworkCompletions_Ecole_St_Martin')

module.exports = model
