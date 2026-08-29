const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

require('./Classe')

const classBookSchema = new Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', required: true },
  schoolYear: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  coverImage: { type: String, default: '' },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED'], default: 'DRAFT' },
  globalPdfUrl: { type: String, default: '' }
}, {
  timestamps: true
})

classBookSchema.index({ classId: 1, schoolYear: 1 }, { unique: true })

let model

if (!mongoose.modelNames().includes('ai_ClassBook_Ecole_St_Martin')) {
  model = mongoose.model('ai_ClassBook_Ecole_St_Martin', classBookSchema)
} else {
  model = mongoose.model('ai_ClassBook_Ecole_St_Martin')
}

module.exports = model
