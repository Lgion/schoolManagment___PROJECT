const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const groupMessageSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },
  groupId: { type: ObjectId, ref: 'ai_Groups_Ecole_St_Martin', required: true },
  senderId: { type: String, required: true }, // Clerk ID
  senderName: { type: String, required: true },
  content: { type: String, required: true, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
})

groupMessageSchema.index({ groupId: 1, createdAt: 1 })

let model;

if (!mongoose.modelNames().includes("ai_GroupMessages_Ecole_St_Martin")) {
  model = mongoose.model('ai_GroupMessages_Ecole_St_Martin', groupMessageSchema);
} else {
  model = mongoose.model("ai_GroupMessages_Ecole_St_Martin");
}

module.exports = model;
