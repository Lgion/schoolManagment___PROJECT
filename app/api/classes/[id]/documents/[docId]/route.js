import { NextResponse } from 'next/server'
import { authWithFallback } from '../../../../lib/authWithFallback'
import dbConnect from '../../../../lib/dbConnect'
import cloudinaryService from '../../../../../../services/cloudinaryService'
import { checkRole, Roles } from '../../../../../../utils/roles'

const ClassDocument = require('../../../../_/models/ai/ClassDocument')

/**
 * DELETE /api/classes/{id}/documents/{docId}
 * Supprime un document : l'entrée en base de données ET le fichier distant
 * sur Cloudinary. Réservé aux professeurs et administrateurs.
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await authWithFallback(request, 'DELETE /api/classes/[id]/documents/[docId]')
    if (!auth.success) return auth.response

    const isAdmin = await checkRole(Roles.ADMIN, request)
    const isTeacher = await checkRole(Roles.TEACHER, request)
    if (!isAdmin && !isTeacher) {
      return NextResponse.json(
        { success: false, error: 'Accès refusé — réservé aux professeurs et administrateurs' },
        { status: 403 }
      )
    }

    await dbConnect()

    const { id, docId } = await params

    const doc = await ClassDocument.findOne({ _id: docId, classId: id })
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Document introuvable' }, { status: 404 })
    }

    // Supprimer le fichier distant sur Cloudinary (best-effort : ne bloque pas
    // la suppression en BDD si le fichier distant a déjà disparu).
    if (doc.cloudinaryPublicId) {
      try {
        cloudinaryService.init()
        if (cloudinaryService.cloudinary) {
          await cloudinaryService.cloudinary.uploader.destroy(doc.cloudinaryPublicId, {
            resource_type: doc.cloudinaryResourceType || 'raw',
          })
        }
      } catch (cloudErr) {
        console.warn(`⚠️ Suppression Cloudinary échouée (non bloquante): ${cloudErr.message}`)
      }
    }

    await ClassDocument.deleteOne({ _id: docId })

    return NextResponse.json({ success: true, data: { _id: docId } })
  } catch (error) {
    console.error('❌ [API] DELETE /api/classes/[id]/documents/[docId]:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du document' },
      { status: 500 }
    )
  }
}
