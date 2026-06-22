// Helpers Cloudinary pour la galerie média (visio/événements).
// Centralise : init du SDK, construction de dossiers dynamiques, génération
// d'URLs SIGNÉES (assets `type: authenticated`, RGPD) et destruction définitive.
import cloudinaryService from '../../../services/cloudinaryService'

/**
 * Renvoie l'instance Cloudinary initialisée, ou null si non configurée
 * (déclenche le fallback local en dev). Ne jette jamais.
 */
export function getCloudinary() {
  try {
    cloudinaryService.init()
    if (cloudinaryService.cloudinary && process.env.CLOUDINARY_CLOUD_NAME) {
      return cloudinaryService.cloudinary
    }
  } catch (e) {
    console.warn('⚠️ Cloudinary indisponible:', e.message)
  }
  return null
}

// "Kermesse de l'école !" → "kermesse_de_l_ecole" (sûr pour un chemin Cloudinary).
export function slugify(str = '') {
  return (
    String(str)
      .toLowerCase()
      .normalize('NFD') // décompose les accentués (é → e + ́) …
      .replace(/[^a-z0-9]+/g, '_') // … et tout ce qui n'est pas [a-z0-9] (dont les diacritiques) tombe
      .replace(/^_+|_+$/g, '')
      .slice(0, 60) || 'album'
  )
}

// Chemin de dossier exact, ex : school/gallery/2025-2026/event_<id>
export function buildAlbumFolder({ academicYear, kind, key }) {
  return `school/gallery/${academicYear}/${kind}_${key}`
}

/**
 * URL de livraison SIGNÉE pour un asset `authenticated`.
 * - Signature systématique (le lien est invalide si on en altère le moindre paramètre).
 * - Expiration RÉELLE si `CLOUDINARY_AUTH_TOKEN_KEY` est configurée (auth-token Cloudinary) :
 *   le lien expire au bout de `expiresInSec`. Sans cette clé (plan/réglage absent),
 *   on retombe sur une URL signée non expirante (toujours non devinable).
 * Renvoie null si Cloudinary n'est pas configuré (ex. fallback local).
 */
export function signedUrl(publicId, { expiresInSec = 3600, transformation } = {}) {
  const cloudinary = getCloudinary()
  if (!cloudinary || !publicId) return null
  const opts = { type: 'authenticated', sign_url: true, secure: true, resource_type: 'image' }
  if (transformation) opts.transformation = transformation
  const tokenKey = process.env.CLOUDINARY_AUTH_TOKEN_KEY
  if (tokenKey) {
    opts.auth_token = { key: tokenKey, duration: expiresInSec }
  }
  try {
    return cloudinary.url(publicId, opts)
  } catch (e) {
    console.warn('⚠️ signedUrl échec:', e.message)
    return null
  }
}

/**
 * Uploade un buffer image dans un dossier en mode `authenticated` (lien non public,
 * RGPD). Renvoie { secure_url, public_id } ou null si Cloudinary indisponible.
 */
export async function uploadAuthenticatedImage(buffer, { folder, tags = [] } = {}) {
  const cloudinary = getCloudinary()
  if (!cloudinary) return null
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        type: 'authenticated',
        resource_type: 'image',
        tags: ['gallery', ...tags],
        transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto', format: 'webp' }],
      },
      (error, result) => {
        if (error) reject(error)
        else resolve({ secure_url: result.secure_url, public_id: result.public_id })
      }
    )
    stream.end(buffer)
  })
}

// Supprime DÉFINITIVEMENT une image de Cloudinary (admin API). Ne jette pas.
export async function destroyImage(publicId) {
  const cloudinary = getCloudinary()
  if (!cloudinary || !publicId) return
  try {
    await cloudinary.uploader.destroy(publicId, {
      type: 'authenticated',
      resource_type: 'image',
      invalidate: true,
    })
  } catch (e) {
    console.warn('⚠️ destroyImage échec:', e.message)
  }
}

// Supprime tout un dossier Cloudinary (toutes les images + le dossier). Ne jette pas.
export async function destroyFolder(folder) {
  const cloudinary = getCloudinary()
  if (!cloudinary || !folder) return
  try {
    await cloudinary.api.delete_resources_by_prefix(folder, {
      type: 'authenticated',
      resource_type: 'image',
    })
    await cloudinary.api.delete_folder(folder)
  } catch (e) {
    console.warn('⚠️ destroyFolder échec:', e.message)
  }
}
