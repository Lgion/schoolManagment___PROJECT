const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// Collection `Message` : un message dans une Conversation (cf. spec direct_messaging.md).
// `senderId`/`readBy` sont des clerkIds. `readBy` sert d'accusé de lecture.
const messageSchema = mongoose.Schema({
  conversationId: { type: ObjectId, ref: 'ai_Conversations_Ecole_St_Martin', required: true },
  senderId: { type: String, required: true }, // clerkId de l'expéditeur
  content: { type: String, required: true, trim: true, maxlength: 4000 },
  readBy: { type: [String], default: [] }, // clerkIds ayant lu
  createdAt: { type: Date, default: Date.now },
})

messageSchema.index({ conversationId: 1, createdAt: 1 })

let model

if (!mongoose.modelNames().includes('ai_Messages_Ecole_St_Martin'))
  model = mongoose.model('ai_Messages_Ecole_St_Martin', messageSchema)
else model = mongoose.model('ai_Messages_Ecole_St_Martin')

module.exports = model
