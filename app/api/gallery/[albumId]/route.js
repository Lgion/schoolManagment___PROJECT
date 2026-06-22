import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'
import {
  resolveGalleryAccess,
  canAccessAlbum,
  canModerateAlbum,
  isValidObjectId,
} from '../../lib/galleryAccess'
import { signedUrl, destroyImage, destroyFolder } from '../../lib/cloudinaryMedia'
import fs from 'fs'
import path from 'path'

const MediaAlbum = require('../../_/models/ai/MediaAlbum')
require('../../_/models/ai/Classe')

function serializeImage(img) {
  return {
    _id: img._id,
    caption: img.caption || '',
    createdAt: img.createdAt,
    url: img.publicId ? signedUrl(img.publicId) || img.url : img.url,
  }
}

// Supprime le fichier local d'une image en fallback dev (no-op sur Cloudinary).
async function unlinkLocal(url) {
  if (typeof url === 'string' && url.startsWith('/school/gallery/')) {
    try {
      const local = path.join(process.cwd(), 'public', url)
      if (fs.existsSync(local)) await fs.promises.unlink(local)
    } catch (e) {
      console.warn('⚠️ unlink local échoué:', e.message)
    }
  }
}

/**
 * GET /api/gallery/{albumId}
 * Contenu complet d'un album (URLs signées). 403 si l'utilisateur n'a pas accès
 * (album de classe non rattachée) — RGPD.
 */
export async function GET(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'GET /api/gallery/[albumId]')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { albumId } = await params
    if (!isValidObjectId(albumId)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const album = await MediaAlbum.findById(albumId).populate('classId', 'niveau alias annee').lean()
    if (!album) {
      return NextResponse.json({ success: false, error: 'Album introuvable' }, { status: 404 })
    }

    const access = await resolveGalleryAccess(authResult.userId)
    if (!canAccessAlbum(access, album)) {
      const className = album.classId ? `${album.classId.niveau || ''} ${album.classId.alias || ''}`.trim() : 'cette classe'
      return NextResponse.json(
        { success: false, locked: true, error: `Cet album est réservé aux élèves et parents de la classe ${className}.` },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: album._id,
        title: album.title,
        date: album.date,
        academicYear: album.academicYear,
        isGlobal: album.isGlobal,
        eventId: album.eventId || null,
        classId: album.classId?._id || album.classId || null,
        className: album.classId ? `${album.classId.niveau || ''} ${album.classId.alias || ''}`.trim() : null,
        canModerate: canModerateAlbum(access, album),
        images: (album.images || []).map(serializeImage),
      },
    })
  } catch (error) {
    console.error('❌ [API] GET /api/gallery/[albumId]:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors du chargement de l\'album' }, { status: 500 })
  }
}

/**
 * DELETE /api/gallery/{albumId}            → supprime tout l'album (DB + dossier Cloudinary).
 * DELETE /api/gallery/{albumId}?image=ID   → supprime une seule photo (DB + Cloudinary).
 * Réservé aux modérateurs (admin partout ; prof de la classe).
 */
export async function DELETE(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'DELETE /api/gallery/[albumId]')
    if (!authResult.success) return authResult.response

    await dbConnect()

    const { albumId } = await params
    if (!isValidObjectId(albumId)) {
      return NextResponse.json({ success: false, error: 'id invalide' }, { status: 400 })
    }

    const album = await MediaAlbum.findById(albumId)
    if (!album) {
      return NextResponse.json({ success: false, error: 'Album introuvable' }, { status: 404 })
    }

    const access = await resolveGalleryAccess(authResult.userId)
    if (!canModerateAlbum(access, album.toObject())) {
      return NextResponse.json({ success: false, error: 'Suppression non autorisée' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('image')

    if (imageId) {
      const img = album.images.id(imageId)
      if (!img) {
        return NextResponse.json({ success: false, error: 'Photo introuvable' }, { status: 404 })
      }
      if (img.publicId) await destroyImage(img.publicId)
      else await unlinkLocal(img.url)
      img.deleteOne()
      await album.save()
      return NextResponse.json({ success: true, data: { albumId: album._id, imageId } })
    }

    // Album entier : Cloudinary (dossier) + fichiers locaux + document.
    if (album.cloudinaryFolder) await destroyFolder(album.cloudinaryFolder)
    await Promise.all((album.images || []).filter((i) => !i.publicId).map((i) => unlinkLocal(i.url)))
    await MediaAlbum.deleteOne({ _id: album._id })

    return NextResponse.json({ success: true, data: { albumId } })
  } catch (error) {
    console.error('❌ [API] DELETE /api/gallery/[albumId]:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
