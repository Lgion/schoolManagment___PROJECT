import { NextResponse } from 'next/server'
import { authWithFallback } from '../../lib/authWithFallback'
import dbConnect from '../../lib/dbConnect'
import { resolveGalleryAccess } from '../../lib/galleryAccess'
import { academicYearOf } from '../../lib/academicYear'
import {
  buildAlbumFolder,
  slugify,
  signedUrl,
  uploadAuthenticatedImage,
} from '../../lib/cloudinaryMedia'
import fs from 'fs'
import path from 'path'

const mongoose = require('mongoose')
const MediaAlbum = require('../../_/models/ai/MediaAlbum')
const EventModel = require('../../_/models/ai/Event')
const Classe = require('../../_/models/ai/Classe')

// Sérialise une photo pour le client : on ne renvoie JAMAIS l'URL Cloudinary brute
// (asset authenticated), mais une URL signée. En fallback local (publicId vide),
// l'URL stockée est un chemin local servable tel quel.
function serializeImage(img) {
  return {
    _id: img._id,
    caption: img.caption || '',
    createdAt: img.createdAt,
    url: img.publicId ? signedUrl(img.publicId) || img.url : img.url,
  }
}

/**
 * POST /api/media/snapshot
 * Capture d'écran d'une visio → upload Cloudinary (authenticated) → album.
 * Body JSON : { image (data URL base64), eventId?, classId?, caption? }
 * Réservé au STAFF (admin / prof de la classe concernée).
 */
export async function POST(request) {
  try {
    const authResult = await authWithFallback(request, 'POST /api/media/snapshot')
    if (!authResult.success) return authResult.response
    const userId = authResult.userId

    await dbConnect()

    const access = await resolveGalleryAccess(userId)
    if (!access.isStaff) {
      return NextResponse.json({ success: false, error: 'Seul le personnel peut capturer des photos' }, { status: 403 })
    }

    const body = await request.json()
    const { image, eventId, classId, caption } = body || {}

    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      return NextResponse.json({ success: false, error: 'Image invalide' }, { status: 400 })
    }

    // --- Déterminer l'album cible (événement OU classe) ---
    let albumQuery = null
    let albumDefaults = null
    let kind = null
    let key = null
    let isGlobal = false
    let resolvedClassId = null
    let sessionDate = new Date()

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      const event = await EventModel.findById(eventId).lean()
      if (!event) {
        return NextResponse.json({ success: false, error: 'Événement introuvable' }, { status: 404 })
      }
      isGlobal = Boolean(event.isGlobal)
      resolvedClassId = event.isGlobal ? null : event.classId || null
      sessionDate = event.startDate || new Date()
      kind = 'event'
      key = String(event._id)
      albumQuery = { eventId: event._id }
      albumDefaults = {
        title: event.title,
        eventId: event._id,
        classId: resolvedClassId,
        isGlobal,
      }
    } else if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      const classe = await Classe.findById(classId).lean()
      if (!classe) {
        return NextResponse.json({ success: false, error: 'Classe introuvable' }, { status: 404 })
      }
      isGlobal = false
      resolvedClassId = classe._id
      kind = 'class'
      key = String(classe._id)
      const academicYear = academicYearOf(sessionDate)
      // Un album de classe par classe et par année scolaire (hors événement).
      albumQuery = { classId: classe._id, eventId: null, academicYear }
      albumDefaults = {
        title: `Classe ${classe.niveau || ''} ${classe.alias || ''}`.trim() || 'Classe',
        classId: classe._id,
        eventId: null,
        isGlobal: false,
      }
    } else {
      return NextResponse.json({ success: false, error: 'eventId ou classId requis' }, { status: 400 })
    }

    // --- Permission fine : un prof ne capture que pour SES classes (admin = tout) ---
    if (!access.all) {
      if (resolvedClassId && !access.classIds.has(String(resolvedClassId))) {
        return NextResponse.json({ success: false, error: 'Cette classe ne vous est pas rattachée' }, { status: 403 })
      }
      // Événement global → staff autorisé (réunions d'école).
    }

    const academicYear = academicYearOf(sessionDate)
    const folder = buildAlbumFolder({ academicYear, kind, key: `${slugify(albumDefaults.title)}_${key.slice(-6)}` })

    // --- Album : récupérer ou créer ---
    let album = await MediaAlbum.findOne(albumQuery)
    if (!album) {
      album = await MediaAlbum.create({
        ...albumDefaults,
        academicYear,
        date: sessionDate,
        cloudinaryFolder: folder,
        createdBy: userId,
        images: [],
      })
    }

    // --- Décoder la data URL ---
    const base64 = image.split(',')[1] || ''
    const buffer = Buffer.from(base64, 'base64')
    if (!buffer.length) {
      return NextResponse.json({ success: false, error: 'Image vide' }, { status: 400 })
    }

    // --- Upload Cloudinary (authenticated) ou fallback local en dev ---
    let stored = { url: '', publicId: '' }
    try {
      const uploaded = await uploadAuthenticatedImage(buffer, { folder: album.cloudinaryFolder, tags: [kind, key] })
      if (uploaded) stored = { url: uploaded.secure_url, publicId: uploaded.public_id }
    } catch (e) {
      console.warn('⚠️ Upload snapshot Cloudinary échoué, fallback local…', e.message)
    }

    if (!stored.url) {
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
      if (isProduction) {
        return NextResponse.json({ success: false, error: 'Stockage Cloudinary indisponible en production.' }, { status: 500 })
      }
      const targetDir = path.join(process.cwd(), 'public/school/gallery', String(album._id))
      await fs.promises.mkdir(targetDir, { recursive: true })
      const filename = `snap_${album.images.length + 1}_${String(album._id).slice(-4)}.jpg`
      await fs.promises.writeFile(path.join(targetDir, filename), buffer)
      stored = { url: `/school/gallery/${album._id}/${filename}`, publicId: '' }
    }

    album.images.push({
      url: stored.url,
      publicId: stored.publicId,
      caption: typeof caption === 'string' ? caption.trim().slice(0, 200) : '',
      uploadedBy: userId,
      createdAt: new Date(),
    })
    await album.save()

    const newImage = album.images[album.images.length - 1]
    return NextResponse.json({
      success: true,
      data: { albumId: album._id, image: serializeImage(newImage) },
    }, { status: 201 })
  } catch (error) {
    console.error('❌ [API] POST /api/media/snapshot:', error)
    return NextResponse.json({ success: false, error: 'Erreur lors de l\'enregistrement de la photo' }, { status: 500 })
  }
}
