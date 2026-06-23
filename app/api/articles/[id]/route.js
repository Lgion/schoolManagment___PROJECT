import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'

const mongoose = require('mongoose')
const User = require('../../_/models/ai/User')
const Article = require('../../_/models/ai/Article')

function isStaffRole(role) {
  return role === 'admin' || role === 'prof'
}

/**
 * GET /api/articles/{id}
 * Article publié → visible de tous. Brouillon / en attente / refusé → seulement
 * l'auteur ou le staff (sinon 404 pour ne rien divulguer).
 */
export async function GET(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/articles/[id]')
    if (!authResult.success) return authResult.response
    const me = authResult.userId

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const article = await Article.findById(id).lean()
    if (!article) return NextResponse.json({ success: false, error: 'Article non trouvé' }, { status: 404 })

    if (article.status !== 'PUBLISHED') {
      const user = await User.findOne({ clerkId: me })
      const allowed = article.authorId === me || isStaffRole(user?.role)
      if (!allowed) return NextResponse.json({ success: false, error: 'Article non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    console.error('❌ [API] GET /api/articles/[id]:', error)
    return NextResponse.json({ success: false, error: "Erreur lors du chargement de l'article" }, { status: 500 })
  }
}

/**
 * PATCH /api/articles/{id}
 * Édition (auteur sur son brouillon/refusé/en attente, staff sur tout) et
 * modération. Body : { title?, content?, coverImage?, tags?, action?, moderationComment? }
 *   action : 'draft' | 'submit' (auteur) ; 'approve' | 'reject' | 'publish' (staff).
 */
export async function PATCH(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'PATCH /api/articles/[id]')
    if (!authResult.success) return authResult.response
    const me = authResult.userId

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const article = await Article.findById(id)
    if (!article) return NextResponse.json({ success: false, error: 'Article non trouvé' }, { status: 404 })

    const user = await User.findOne({ clerkId: me })
    const staff = isStaffRole(user?.role)
    const isAuthor = article.authorId === me
    if (!staff && !isAuthor) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, coverImage, tags, action, moderationComment } = body || {}

    // 1. Édition de contenu : staff partout ; auteur seulement si non publié.
    const canEditFields = staff || (isAuthor && article.status !== 'PUBLISHED')
    if (canEditFields) {
      if (title !== undefined) {
        if (!String(title).trim()) {
          return NextResponse.json({ success: false, error: 'Le titre est requis' }, { status: 400 })
        }
        article.title = String(title).trim()
      }
      if (content !== undefined) article.content = String(content)
      if (coverImage !== undefined) article.coverImage = String(coverImage)
      if (Array.isArray(tags)) article.tags = tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
    }

    // 2. Transition de statut.
    switch (action) {
      case 'approve':
      case 'publish':
        if (!staff) return NextResponse.json({ success: false, error: 'Action réservée au staff' }, { status: 403 })
        article.status = 'PUBLISHED'
        if (!article.publishedAt) article.publishedAt = new Date()
        article.moderationComment = ''
        break
      case 'reject':
        if (!staff) return NextResponse.json({ success: false, error: 'Action réservée au staff' }, { status: 403 })
        article.status = 'REJECTED'
        if (typeof moderationComment === 'string') article.moderationComment = moderationComment.trim()
        break
      case 'submit':
        article.status = 'PENDING_REVIEW'
        break
      case 'draft':
        article.status = 'DRAFT'
        break
      default:
        // pas de transition : simple édition
        break
    }

    article.updatedAt = new Date()
    await article.save()

    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    console.error('❌ [API] PATCH /api/articles/[id]:', error)
    return NextResponse.json({ success: false, error: "Erreur lors de la mise à jour de l'article" }, { status: 500 })
  }
}

/**
 * DELETE /api/articles/{id} — auteur ou staff.
 */
export async function DELETE(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'DELETE /api/articles/[id]')
    if (!authResult.success) return authResult.response
    const me = authResult.userId

    await dbConnect()

    const { id } = await params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const article = await Article.findById(id)
    if (!article) return NextResponse.json({ success: false, error: 'Article non trouvé' }, { status: 404 })

    const user = await User.findOne({ clerkId: me })
    if (!isStaffRole(user?.role) && article.authorId !== me) {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 })
    }

    await Article.findByIdAndDelete(id)
    return NextResponse.json({ success: true, data: { _id: id } })
  } catch (error) {
    console.error('❌ [API] DELETE /api/articles/[id]:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
