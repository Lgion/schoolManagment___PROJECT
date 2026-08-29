const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const groupSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", trim: true, maxlength: 500 },
  creatorId: { type: String, required: true }, // Clerk ID
  members: [{
    userId: { type: String, required: true }, // Clerk ID
    role: { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' },
    userType: { type: String, enum: ['TEACHER', 'PARENT', 'STUDENT', 'ADMIN'], default: 'STUDENT' }
  }],
  isPrivate: { type: Boolean, default: true },
  invitationCode: { type: String, required: true, unique: true },
  features: {
    chat: { type: Boolean, default: true },
    wall: { type: Boolean, default: true },
    fileSharing: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
})

// Middleware pour mettre à jour updatedAt
groupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

let model;

if (!mongoose.modelNames().includes("ai_Groups_Ecole_St_Martin")) {
  model = mongoose.model('ai_Groups_Ecole_St_Martin', groupSchema);
} else {
  model = mongoose.model("ai_Groups_Ecole_St_Martin");
}

module.exports = model;
