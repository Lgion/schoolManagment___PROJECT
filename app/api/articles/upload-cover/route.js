import { NextResponse } from 'next/server'
import { requireAuth } from '../../lib/authWithFallback'
import cloudinaryService from '../../../../services/cloudinaryService'
import fs from 'fs'
import path from 'path'

/**
 * POST /api/articles/upload-cover
 * FormData { file } → upload Cloudinary (fallback local en dev) → { url }.
 * Sert d'image de couverture aux articles du blog.
 */
export async function POST(request) {
  try {
    const userId = await requireAuth(request, 'POST /api/articles/upload-cover')
    if (userId instanceof NextResponse) return userId

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: 'Aucun fichier fourni' }, { status: 400 })
    }
    if (!file.type?.startsWith('image/')) {
      return NextResponse.json({ success: false, error: "Le fichier doit être une image" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    let fileUrl = ''

    try {
      cloudinaryService.init()
      if (cloudinaryService.cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinaryService.cloudinary.uploader.upload_stream(
            {
              folder: 'school/blog/covers',
              resource_type: 'image',
              tags: ['blog'],
              transformation: [{ width: 1600, height: 900, crop: 'limit', quality: 'auto', format: 'webp' }],
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            }
          )
          stream.end(buffer)
        })
        fileUrl = uploadResult.secure_url
      }
    } catch (cloudinaryError) {
      console.warn('⚠️ Cloudinary cover upload failed, fallback local…', cloudinaryError.message)
    }

    if (!fileUrl) {
      if (isProduction) {
        return NextResponse.json({ success: false, error: 'Stockage Cloudinary indisponible en production.' }, { status: 500 })
      }
      const targetDir = path.join(process.cwd(), 'public/school/blog')
      await fs.promises.mkdir(targetDir, { recursive: true })
      const filename = `cover_${Date.now()}_${(file.name || 'cover').replace(/[^a-zA-Z0-9.-]/g, '_')}`
      await fs.promises.writeFile(path.join(targetDir, filename), buffer)
      fileUrl = `/school/blog/${filename}`
    }

    return NextResponse.json({ success: true, url: fileUrl })
  } catch (error) {
    console.error('❌ [API] POST /api/articles/upload-cover:', error)
    return NextResponse.json({ success: false, error: "Erreur lors de l'upload" }, { status: 500 })
  }
}
