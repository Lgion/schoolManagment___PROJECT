import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../../lib/authWithFallback'
import dbConnect from '../../../../../lib/dbConnect'
import fs from 'fs'
import path from 'path'

const ClassMedia = require('../../../../../_/models/ai/ClassMedia')
const User = require('../../../../../_/models/ai/User')

/**
 * PUT /api/classes/[id]/classbook/photos/[photoId]
 * Met à jour le statut, les tags ou la légende d'une photo.
 */
export async function PUT(request, { params }) {
  const { id: classId, photoId } = await params;
  try {
    const userId = await requireAuth(request, `PUT /api/classes/${classId}/classbook/photos/${photoId}`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    // Vérifier les permissions (prof/admin)
    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'
    const isTeacher = currentUserDoc?.role === 'prof'

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { inClassBook, tags, caption } = body

    const photo = await ClassMedia.findOne({ _id: photoId, classId })
    if (!photo) {
      return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 })
    }

    if (inClassBook !== undefined) photo.inClassBook = inClassBook
    if (tags !== undefined) photo.tags = tags
    if (caption !== undefined) photo.caption = caption

    const savedPhoto = await photo.save()
    const populated = await ClassMedia.populate(savedPhoto, {
      path: 'tags',
      select: 'nom prenoms photo_$_file'
    })

    return NextResponse.json({
      success: true,
      data: populated
    })

  } catch (error) {
    console.error('Erreur PUT /api/classes/[id]/classbook/photos/[photoId]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de la photo' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/classes/[id]/classbook/photos/[photoId]
 * Supprime une photo de la collection. Pour les photos du feed, cela supprime juste la référence de curation ClassMedia.
 * Pour les uploads directs, cela retire également le fichier si stocké localement.
 */
export async function DELETE(request, { params }) {
  const { id: classId, photoId } = await params;
  try {
    const userId = await requireAuth(request, `DELETE /api/classes/${classId}/classbook/photos/${photoId}`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    // Vérifier les permissions (prof/admin)
    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'
    const isTeacher = currentUserDoc?.role === 'prof'

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const photo = await ClassMedia.findOne({ _id: photoId, classId })
    if (!photo) {
      return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 })
    }

    // Si c'est un upload direct local, on tente de supprimer le fichier local
    if (photo.source === 'UPLOAD_DIRECT' && photo.url.startsWith('/school/classbook/')) {
      try {
        const localPath = path.join(process.cwd(), 'public', photo.url)
        if (fs.existsSync(localPath)) {
          await fs.promises.unlink(localPath)
        }
      } catch (err) {
        console.warn('⚠️ Impossible de supprimer le fichier local de la photo:', err.message)
      }
    }

    await ClassMedia.deleteOne({ _id: photoId })

    return NextResponse.json({
      success: true,
      message: 'Photo retirée du livre de classe avec succès'
    })

  } catch (error) {
    console.error('Erreur DELETE /api/classes/[id]/classbook/photos/[photoId]:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du retrait de la photo' },
      { status: 500 }
    )
  }
}
