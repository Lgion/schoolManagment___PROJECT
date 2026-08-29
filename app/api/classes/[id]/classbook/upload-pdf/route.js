import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/authWithFallback'
import dbConnect from '../../../../lib/dbConnect'
import cloudinaryService from '../../../../../../services/cloudinaryService'
import fs from 'fs'
import path from 'path'

const Classe = require('../../../../_/models/ai/Classe')
const User = require('../../../../_/models/ai/User')

/**
 * POST /api/classes/[id]/classbook/upload-pdf
 * Téléverse un PDF généré côté client.
 */
export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const userId = await requireAuth(request, `POST /api/classes/${id}/classbook/upload-pdf`)
    if (userId instanceof NextResponse) return userId

    await dbConnect()

    const currentUserDoc = await User.findOne({ clerkId: userId })
    const isAdmin = currentUserDoc?.role === 'admin'
    const isTeacher = currentUserDoc?.role === 'prof'

    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const classe = await Classe.findById(id)
    if (!classe) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const type = formData.get('type') || 'global' // 'global' ou 'student'
    const studentId = formData.get('studentId') || ''

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
        const folder = `school/classes/${classe.niveau?.toLowerCase()}-${classe.alias}/${classe.annee}/classbook/pdf`
        
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinaryService.cloudinary.uploader.upload_stream({
            folder,
            resource_type: 'raw', // très important pour les fichiers PDF non-image
            tags: ['classbook', 'pdf', id, type],
            public_id: type === 'student' ? `yearbook_${studentId}_${Date.now()}` : `classbook_global_${id}_${Date.now()}`
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          stream.end(buffer);
        })

        fileUrl = uploadResult.secure_url
      }
    } catch (cloudinaryError) {
      console.warn('⚠️ Erreur Cloudinary lors de l\'upload du PDF, fallback local...', cloudinaryError.message)
    }

    // Fallback local
    if (!fileUrl) {
      if (isProduction) {
        return NextResponse.json({ error: 'Stockage Cloudinary indisponible en production.' }, { status: 500 })
      }

      const targetDir = path.join(process.cwd(), 'public/school/classbook', id, 'pdf')
      await fs.promises.mkdir(targetDir, { recursive: true })
      const filename = type === 'student'
        ? `yearbook_${studentId}_${Date.now()}.pdf`
        : `classbook_global_${id}_${Date.now()}.pdf`
      const destPath = path.join(targetDir, filename)
      await fs.promises.writeFile(destPath, buffer)
      fileUrl = `/school/classbook/${id}/pdf/${filename}`
    }

    return NextResponse.json({
      success: true,
      pdfUrl: fileUrl
    })

  } catch (error) {
    console.error('Erreur POST /api/classes/[id]/classbook/upload-pdf:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du téléversement du PDF' },
      { status: 500 }
    )
  }
}
