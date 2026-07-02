import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/authWithFallback'
import dbConnect from '../../../../lib/dbConnect'
import cloudinaryService from '../../../../../../services/cloudinaryService'
import fs from 'fs'
import path from 'path'

const Classe = require('../../../../_/models/ai/Classe')
const Post = require('../../../../_/models/ai/Post')
const ClassMedia = require('../../../../_/models/ai/ClassMedia')
const User = require('../../../../_/models/ai/User')

/**
 * GET /api/classes/[id]/classbook/photos
 * Synchronise les photos existantes du mur de classe et renvoie la liste complète des photos.
 */
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `GET /api/classes/${id}/classbook/photos`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const classe = await Classe.findById(id)
    if (!classe) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    // 1. Scanner les publications (Post) de la classe avec images
    const postsWithMedia = await Post.find({
      classId: id,
      mediaUrls: { $exists: true, $not: { $size: 0 } }
    })

    // 2. Synchroniser chaque image dans ClassMedia si elle n'existe pas déjà
    for (const post of postsWithMedia) {
      for (const mediaUrl of post.mediaUrls) {
        const exists = await ClassMedia.findOne({
          classId: id,
          postId: post._id,
          url: mediaUrl
        })

        if (!exists) {
          await ClassMedia.create({
            classId: id,
            postId: post._id,
            url: mediaUrl,
            source: 'FEED_POST',
            inClassBook: false,
            caption: post.content ? (post.content.length > 60 ? post.content.substring(0, 57) + '...' : post.content) : '',
            tags: []
          })
        }
      }
    }

    // 3. Récupérer toutes les photos de la classe (triées par date de création décroissante)
    const photos = await ClassMedia.find({ classId: id })
      .populate('tags', 'nom prenoms photo_$_file')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: photos
    })

  } catch (error) {
    console.error('Erreur GET /api/classes/[id]/classbook/photos:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des photos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/classes/[id]/classbook/photos
 * Uploade une nouvelle photo directement pour le livre de classe.
 */
export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `POST /api/classes/${id}/classbook/photos`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    // Vérifier les permissions
    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'
    const isTeacher = currentUserDoc?.role === 'prof'

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Non autorisé à ajouter des photos' }, { status: 403 })
    }

    const classe = await Classe.findById(id)
    if (!classe) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const caption = formData.get('caption') || ''

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let fileUrl = ''

    // Détection environnement
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

    // Essai Cloudinary
    try {
      cloudinaryService.init()
      if (cloudinaryService.cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
        const folder = `school/classes/${classe.niveau?.toLowerCase()}-${classe.alias}/${classe.annee}/classbook`
        
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinaryService.cloudinary.uploader.upload_stream({
            folder,
            resource_type: 'image',
            tags: ['classbook', id],
            transformation: [{ width: 1024, height: 1024, crop: 'limit', quality: 'auto', format: 'webp' }]
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          stream.end(buffer);
        })

        fileUrl = uploadResult.secure_url
      }
    } catch (cloudinaryError) {
      console.warn('⚠️ Erreur Cloudinary, fallback local en cours...', cloudinaryError.message)
    }

    // Fallback local si non production et Cloudinary indisponible
    if (!fileUrl) {
      if (isProduction) {
        return NextResponse.json({ error: 'Stockage Cloudinary indisponible en production.' }, { status: 500 })
      }

      const targetDir = path.join(process.cwd(), 'public/school/classbook', id)
      await fs.promises.mkdir(targetDir, { recursive: true })
      const filename = `direct_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const destPath = path.join(targetDir, filename)
      await fs.promises.writeFile(destPath, buffer)
      fileUrl = `/school/classbook/${id}/${filename}`
    }

    // Créer l'enregistrement ClassMedia
    const newMedia = new ClassMedia({
      classId: id,
      url: fileUrl,
      source: 'UPLOAD_DIRECT',
      inClassBook: true, // par défaut les photos uploadées directement par le prof sont dans le livre
      caption: caption,
      tags: []
    })

    const savedMedia = await newMedia.save()

    return NextResponse.json({
      success: true,
      data: savedMedia
    }, { status: 201 })

  } catch (error) {
    console.error('Erreur POST /api/classes/[id]/classbook/photos:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'ajout de la photo' },
      { status: 500 }
    )
  }
}
