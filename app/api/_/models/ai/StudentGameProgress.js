const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `StudentGameProgress` (cf. spec educational_games.md) : score d'un
// élève sur un jeu. `gameKey` est une String qui vaut soit la clé d'un jeu
// statique (ex: 'static-cp1-calcul'), soit l'_id (string) d'un EducationalGame
// IA — un identifiant unifié côté lecteur.
const studentGameProgressSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  studentId: { type: ObjectId, ref: 'ai_Eleves_Ecole_St_Martin', required: true },
  gameKey: { type: String, required: true },
  gameTitle: { type: String, default: '' },
  score: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['COMPLETED'], default: 'COMPLETED' },
  playedAt: { type: Date, default: Date.now },
})

studentGameProgressSchema.index({ studentId: 1, playedAt: -1 })

let model

if (!mongoose.modelNames().includes('ai_StudentGameProgress_Ecole_St_Martin'))
  model = mongoose.model('ai_StudentGameProgress_Ecole_St_Martin', studentGameProgressSchema)
else model = mongoose.model('ai_StudentGameProgress_Ecole_St_Martin')

module.exports = model
