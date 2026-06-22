const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `Conversation` : salon de discussion privé 1-to-1 (cf. spec
// direct_messaging.md). La séparation stricte des canaux repose sur
// `conversationType` :
//   - STUDENT_TEACHER : échange privé élève ↔ prof (les parents n'y ont PAS accès)
//   - PARENT_TEACHER  : canal officiel famille ↔ équipe pédagogique
//
// `participants` contient les clerkIds des deux interlocuteurs ; la
// confidentialité est garantie côté API en vérifiant l'appartenance à ce tableau.
// `teacherRef`/`studentRef` sont dénormalisés pour libeller l'inbox sans
// avoir à résoudre les entités via la collection User à chaque affichage.
const conversationSchema = mongoose.Schema({
  participants: { type: [String], required: true }, // clerkIds (2)
  conversationType: {
    type: String,
    enum: ['STUDENT_TEACHER', 'PARENT_TEACHER'],
    required: true,
  },
  studentRef: { type: ObjectId, ref: 'ai_Eleves_Ecole_St_Martin', required: true },
  teacherRef: { type: ObjectId, ref: 'ai_Profs_Ecole_St_Martin', required: true },
  lastMessage: { type: ObjectId, ref: 'ai_Messages_Ecole_St_Martin', default: null },
  lastMessagePreview: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

conversationSchema.index({ participants: 1, updatedAt: -1 })
conversationSchema.index({ conversationType: 1, studentRef: 1, teacherRef: 1 })

let model

if (!mongoose.modelNames().includes('ai_Conversations_Ecole_St_Martin'))
  model = mongoose.model('ai_Conversations_Ecole_St_Martin', conversationSchema)
else model = mongoose.model('ai_Conversations_Ecole_St_Martin')

module.exports = model
