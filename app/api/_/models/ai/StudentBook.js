const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

require('./Eleve')
require('./ClassBook')

const studentBookSchema = new Schema({
  studentId: { type: ObjectId, ref: 'ai_Eleves_Ecole_St_Martin', required: true },
  classBookId: { type: ObjectId, ref: 'ai_ClassBook_Ecole_St_Martin', required: true },
  personalizedPdfUrl: { type: String, default: '' }
}, {
  timestamps: true
})

studentBookSchema.index({ studentId: 1, classBookId: 1 }, { unique: true })

let model

if (!mongoose.modelNames().includes('ai_StudentBook_Ecole_St_Martin')) {
  model = mongoose.model('ai_StudentBook_Ecole_St_Martin', studentBookSchema)
} else {
  model = mongoose.model('ai_StudentBook_Ecole_St_Martin')
}

module.exports = model
