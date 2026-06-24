const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const pollOptionSchema = new Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  id: { type: String, required: true },
  text: { type: String, required: true },
  voters: { type: [String], default: [] } // Clerk IDs
})

const postSchema = new Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },
  groupId: { type: ObjectId, ref: 'ai_Groups_Ecole_St_Martin', required: false },
  classId: { type: ObjectId, ref: 'ai_Ecole_St_Martin', required: false },
  isGlobal: { type: Boolean, default: false },
  
  authorId: { type: String, required: true }, // Clerk ID
  authorName: { type: String, required: true },
  content: { type: String, required: false, trim: true, maxlength: 2000 },
  mediaUrls: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },

  type: { type: String, enum: ['ANNOUNCEMENT', 'POLL'], default: 'ANNOUNCEMENT' },
  
  // Sondages
  pollQuestion: { type: String, trim: true, maxlength: 500 },
  pollOptions: { type: [pollOptionSchema], default: [] },
  pollSettings: {
    multipleChoices: { type: Boolean, default: false },
    isAnonymous: { type: Boolean, default: false },
    expiresAt: { type: Date }
  }
}, { 
  collection: 'ai_groupposts_ecole_st_martins', // Conserve la même collection pour ne pas perdre les posts de groupe existants
  timestamps: true 
})

postSchema.index({ groupId: 1, createdAt: -1 })
postSchema.index({ classId: 1, createdAt: -1 })
postSchema.index({ isGlobal: 1, createdAt: -1 })

let model;

if (!mongoose.modelNames().includes("ai_Posts_Ecole_St_Martin")) {
  model = mongoose.model('ai_Posts_Ecole_St_Martin', postSchema);
} else {
  model = mongoose.model("ai_Posts_Ecole_St_Martin");
}

module.exports = model;
