const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// S'assurer que le modèle PointLabel est enregistré pour les `populate`
require('./PointLabel')

// Collection `PointTransaction` : historique des attributions de bonus/malus.
// On conserve une transaction par opération plutôt qu'un simple compteur,
// afin de garantir la traçabilité (qui, quoi, quand, pourquoi).
const pointTransactionSchema = mongoose.Schema({
  // Élève concerné par la transaction
  studentId: { type: ObjectId, ref: 'ai_Eleves_Ecole_St_Martin', required: true },
  // Professeur ayant attribué/retiré les points.
  // Optionnel au niveau BDD pour couvrir les enregistrements migrés (legacy bonus/manus,
  // sans prof enregistré) et les attributions par un admin sans fiche Teacher.
  // L'API /award le renseigne dès qu'une fiche Teacher est résolvable depuis le compte connecté.
  teacherId: { type: ObjectId, ref: 'ai_Profs_Ecole_St_Martin', required: false, default: null },
  // Classe concernée (optionnel, mais utile pour les statistiques)
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', required: false, default: null },
  // Nombre entier de points (ex: +1, +5, -2)
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: 'amount doit être un entier (ex: +1, +5, -2)',
    },
  },
  // Catégorie de la transaction (Participation, Bavardages, ...)
  labelId: { type: ObjectId, ref: 'ai_PointLabels_Ecole_St_Martin', required: true },
  // Précision optionnelle saisie par le professeur
  comment: { type: String, default: '', required: false, trim: true },
  createdAt: { type: Date, default: Date.now },
})

// Index pour récupérer rapidement l'historique d'un élève (le plus récent d'abord)
pointTransactionSchema.index({ studentId: 1, createdAt: -1 })
// Index pour les statistiques par classe
pointTransactionSchema.index({ classId: 1, createdAt: -1 })

let model

if (!mongoose.modelNames().includes('ai_PointTransactions_Ecole_St_Martin'))
  model = mongoose.model('ai_PointTransactions_Ecole_St_Martin', pointTransactionSchema)
else model = mongoose.model('ai_PointTransactions_Ecole_St_Martin')

module.exports = model
