const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `EducationalGame` (cf. spec educational_games.md).
// Ne stocke que les jeux GÉNÉRÉS PAR IA (CM1/CM2). Les jeux statiques CP1→CE2
// vivent dans le code (app/components/games/staticGames.js), comme autorisé
// par la spec (« directement intégrés au code source »).
//
// `content` = configuration unifiée du jeu (même schéma que les statiques) :
//   { questions: [{ question, options:[String], answerIndex:Number }] }
// → un seul lecteur (QuizPlayer) joue statiques et IA indifféremment.
const educationalGameSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  title: { type: String, required: true, trim: true, maxlength: 200 },
  level: { type: String, required: true }, // CM1, CM2, …
  type: { type: String, enum: ['STATIC', 'AI_GENERATED'], default: 'AI_GENERATED' },
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', default: null },
  content: { type: Object, default: { questions: [] } },
  sourcePdfUrl: { type: String, default: '' },
  createdBy: { type: String, default: null }, // clerkId
  createdAt: { type: Date, default: Date.now },
})

educationalGameSchema.index({ level: 1, createdAt: -1 })
educationalGameSchema.index({ classId: 1, createdAt: -1 })

let model

if (!mongoose.modelNames().includes('ai_EducationalGames_Ecole_St_Martin'))
  model = mongoose.model('ai_EducationalGames_Ecole_St_Martin', educationalGameSchema)
else model = mongoose.model('ai_EducationalGames_Ecole_St_Martin')

module.exports = model
