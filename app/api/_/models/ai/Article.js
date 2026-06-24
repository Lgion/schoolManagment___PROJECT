const mongoose = require('mongoose')

// Collection `Article` (cf. spec school_blog.md) : journal scolaire, distinct du
// micro-blogging (Post). Contenu riche stocké en **Markdown** (rendu via un
// rendeur sûr côté client, sans dépendance lourde). Workflow de modération :
// élèves/parents → PENDING_REVIEW ; profs/admins → PUBLISHED direct.
const articleSchema = mongoose.Schema({
  schoolKey: { type: String, required: true, default: 'ecole_st_martin', index: true },

  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, default: '' }, // Markdown
  coverImage: { type: String, default: '' }, // URL Cloudinary
  authorId: { type: String, required: true }, // clerkId
  authorName: { type: String, default: '' },
  authorRole: { type: String, enum: ['admin', 'prof', 'eleve', 'parent'], required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'],
    default: 'DRAFT',
  },
  tags: { type: [String], default: [] },
  moderationComment: { type: String, default: '' },
  publishedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

articleSchema.index({ status: 1, publishedAt: -1 })
articleSchema.index({ authorId: 1, updatedAt: -1 })

let model

if (!mongoose.modelNames().includes('ai_Articles_Ecole_St_Martin'))
  model = mongoose.model('ai_Articles_Ecole_St_Martin', articleSchema)
else model = mongoose.model('ai_Articles_Ecole_St_Martin')

module.exports = model
