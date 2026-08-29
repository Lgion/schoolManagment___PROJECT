import { NextResponse } from 'next/server'
import { requireAuth } from '../../../lib/authWithFallback'
import dbConnect from '../../../lib/dbConnect'
import { sendMockSMS } from '../../../lib/sms'

const Classe = require('../../../_/models/ai/Classe')
const Eleve = require('../../../_/models/ai/Eleve')
const Post = require('../../../_/models/ai/Post')
const User = require('../../../_/models/ai/User')

/**
 * GET /api/classes/[id]/feed
 * Récupère tous les posts publiés pour cette classe.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `GET /api/classes/${id}/feed`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const { id: classId } = await params

    const classe = await Classe.findById(classId)
    if (!classe) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    const posts = await Post.find({ classId }).sort({ createdAt: -1 })

    // Recueillir tous les Clerk IDs des votants de tous les posts de type POLL de cette page
    const voterClerkIds = new Set()
    posts.forEach(post => {
      if (post.type === 'POLL' && post.pollOptions) {
        post.pollOptions.forEach(opt => {
          if (opt.voters) {
            opt.voters.forEach(vid => voterClerkIds.add(vid))
          }
        })
      }
    })

    let voterNamesMap = {}
    if (voterClerkIds.size > 0) {
      const users = await User.find({ clerkId: { $in: Array.from(voterClerkIds) } })
      users.forEach(u => {
        voterNamesMap[u.clerkId] = `${u.firstName} ${u.lastName}`.trim() || u.email
      })
    }

    return NextResponse.json({
      success: true,
      data: posts,
      voterNames: voterNamesMap
    })

  } catch (error) {
    console.error('Erreur GET /api/classes/[id]/feed:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération du fil de classe' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/classes/[id]/feed
 * Publie une annonce ou un sondage pour la classe.
 */
export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `POST /api/classes/${id}/feed`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const { id: classId } = await params

    const classe = await Classe.findById(classId)
    if (!classe) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    // Vérifier les permissions : création de posts dans une classe réservée aux profs/admins
    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'
    const isTeacher = currentUserDoc?.role === 'prof'

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Non autorisé à publier dans ce fil de classe' }, { status: 403 })
    }

    const body = await request.json()
    const { content, mediaUrls, type, pollQuestion, pollOptions, pollSettings, smsNotification } = body

    if (type === 'POLL') {
      if (!pollQuestion) {
        return NextResponse.json({ error: 'La question du sondage est requise' }, { status: 400 })
      }
      if (!pollOptions || !Array.isArray(pollOptions) || pollOptions.length < 2) {
        return NextResponse.json({ error: 'Au moins 2 options sont requises pour un sondage' }, { status: 400 })
      }
    } else {
      if (!content) {
        return NextResponse.json({ error: 'Le contenu du message est requis' }, { status: 400 })
      }
    }

    // Récupérer le nom de l'auteur
    const authorName = currentUserDoc ? `${currentUserDoc.firstName} ${currentUserDoc.lastName}`.trim() || currentUserDoc.email : 'Enseignant'

    const newPost = new Post({
      classId,
      authorId: userId,
      authorName,
      content,
      mediaUrls: mediaUrls || [],
      type: type || 'ANNOUNCEMENT',
      pollQuestion,
      pollOptions: pollOptions ? pollOptions.map((opt, index) => ({
        id: `opt_${index}_${Date.now()}`,
        text: typeof opt === 'string' ? opt : opt.text,
        voters: []
      })) : [],
      pollSettings: pollSettings || { multipleChoices: false, isAnonymous: false }
    })

    const savedPost = await newPost.save()

    // Gérer l'envoi de SMS simulé si demandé
    if (smsNotification) {
      // Trouver tous les élèves de la classe
      const students = await Eleve.find({ current_classe: classId })
      // Récupérer les numéros de téléphone valides et uniques
      const phoneNumbers = Array.from(
        new Set(
          students
            .map(s => s.parents?.phone)
            .filter(phone => phone && phone.trim() !== '')
        )
      )

      if (phoneNumbers.length > 0) {
        const smsMessage = type === 'POLL' 
          ? `[Sondage - Classe ${classe.niveau} ${classe.alias}] ${pollQuestion}` 
          : `[Annonce - Classe ${classe.niveau} ${classe.alias}] ${content}`
        
        await sendMockSMS(phoneNumbers, smsMessage)
      } else {
        console.log('⚠️ Aucun numéro de téléphone parent trouvé pour envoyer les SMS de la classe.')
      }
    }

    return NextResponse.json({
      success: true,
      data: savedPost
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur POST /api/classes/[id]/feed:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la publication sur le fil de classe' },
      { status: 500 }
    )
  }
}
