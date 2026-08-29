import { NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/authWithFallback'
import dbConnect from '../../../lib/dbConnect'

const Post = require('../../../_/models/ai/Post')

/**
 * POST /api/posts/[id]/vote
 * Enregistre ou annule le vote de l'utilisateur sur une option de sondage.
 */
export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `POST /api/posts/${id}/vote`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const { id: postId } = await params
    const body = await request.json()
    const { optionId } = body

    if (!optionId) {
      return NextResponse.json({ error: 'Option ID requis pour voter' }, { status: 400 })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return NextResponse.json({ error: 'Publication introuvable' }, { status: 404 })
    }

    if (post.type !== 'POLL') {
      return NextResponse.json({ error: 'Cette publication n\'est pas un sondage' }, { status: 400 })
    }

    // Vérifier si le sondage a expiré
    if (post.pollSettings?.expiresAt && new Date(post.pollSettings.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Ce sondage a expiré' }, { status: 400 })
    }

    const isMultiple = post.pollSettings?.multipleChoices || false

    // Trouver l'option ciblée
    const targetOption = post.pollOptions.find(o => o.id === optionId)
    if (!targetOption) {
      return NextResponse.json({ error: 'Option introuvable' }, { status: 400 })
    }

    const hasAlreadyVotedForThis = targetOption.voters.includes(userId)

    if (isMultiple) {
      // Choix multiple : basculer le vote de l'utilisateur sur cette option uniquement
      if (hasAlreadyVotedForThis) {
        targetOption.voters = targetOption.voters.filter(v => v !== userId)
      } else {
        targetOption.voters.push(userId)
      }
    } else {
      // Choix unique : l'utilisateur ne peut avoir qu'un seul vote au total sur ce sondage
      // S'il a déjà voté pour cette option, il retire son vote
      // S'il clique sur une autre option, on retire ses votes des autres options et on l'ajoute à celle-ci
      post.pollOptions.forEach(opt => {
        if (opt.id === optionId) {
          if (hasAlreadyVotedForThis) {
            opt.voters = opt.voters.filter(v => v !== userId)
          } else {
            opt.voters.push(userId)
          }
        } else {
          opt.voters = opt.voters.filter(v => v !== userId)
        }
      })
    }

    // Indiquer à Mongoose que le sous-document a été modifié
    post.markModified('pollOptions')
    const savedPost = await post.save()

    return NextResponse.json({
      success: true,
      data: savedPost
    })

  } catch (error) {
    console.error('Erreur POST /api/posts/[id]/vote:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'enregistrement du vote' },
      { status: 500 }
    )
  }
}
