const mongoose = require('mongoose')

// Collection `PointLabel` : catégories pré-définies de bonus/malus
// attribuables aux élèves via le système de bons points.
const pointLabelSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  // Nom de la catégorie (ex: "Participation", "Entraide", "Bavardages")
  name: { type: String, required: true, trim: true },
  // Type de la catégorie : bonus (points positifs) ou malus (points négatifs)
  type: { type: String, required: true, enum: ['BONUS', 'MALUS'] },
  // Emoji ou nom d'icône pour l'UI (ex: 🌟, 💬, ⚠️) — optionnel
  icon: { type: String, default: '', required: false },
  // Valeur par défaut attribuée lorsqu'on applique ce label (surchargée à l'attribution)
  defaultAmount: { type: Number, default: 1, required: false },
  // Permet de masquer un label sans le supprimer
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

// Index pour récupérer rapidement les labels actifs par type
pointLabelSchema.index({ type: 1, isActive: 1 })

let model

if (!mongoose.modelNames().includes('ai_PointLabels_Ecole_St_Martin'))
  model = mongoose.model('ai_PointLabels_Ecole_St_Martin', pointLabelSchema)
else model = mongoose.model('ai_PointLabels_Ecole_St_Martin')

module.exports = model
