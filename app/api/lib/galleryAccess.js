// Résolution des droits d'accès à la galerie média (RGPD / droit à l'image).
// Source de vérité serveur : on ne se fie jamais au rôle envoyé par le client.
//
// Matrice (spec communication_and_visio §6.B) :
//  - Album global (école)  → tout utilisateur connecté.
//  - Album de classe        → admin, prof de la classe, élèves de la classe, parents d'un élève de la classe.
//  - Modération (suppression) → admin partout ; prof sur ses propres classes.
//
// L'appelant doit avoir ouvert la connexion (`dbConnect`) avant.
const mongoose = require('mongoose')
const User = require('../_/models/ai/User')
const Eleve = require('../_/models/ai/Eleve')
const Teacher = require('../_/models/ai/Teacher')

/**
 * @typedef {Object} GalleryAccess
 * @property {string} role
 * @property {boolean} isStaff   admin ou prof
 * @property {boolean} all       accès total (admin / mode démo)
 * @property {Set<string>} classIds  classes auxquelles l'utilisateur appartient/gère
 */

/** Résout l'accès galerie d'un clerkId. @returns {Promise<GalleryAccess>} */
export async function resolveGalleryAccess(userId) {
  // Mode démo / sample (authWithFallback falsy) → admin, cohérent avec le reste de l'app.
  if (!userId || userId === 'user_fake_admin_123') {
    return { role: 'admin', isStaff: true, all: true, classIds: new Set() }
  }

  const userDoc = await User.findOne({ clerkId: userId }).lean()
  if (!userDoc) return { role: 'public', isStaff: false, all: false, classIds: new Set() }

  const role = userDoc.role
  if (role === 'admin') return { role, isStaff: true, all: true, classIds: new Set() }

  const classIds = new Set()

  if (role === 'prof' && userDoc.roleData?.teacherRef) {
    const teacher = await Teacher.findById(userDoc.roleData.teacherRef).select('current_classes').lean()
    ;(teacher?.current_classes || []).forEach((c) => classIds.add(String(c)))
    return { role, isStaff: true, all: false, classIds }
  }

  if (role === 'eleve' && userDoc.roleData?.eleveRef) {
    const e = await Eleve.findById(userDoc.roleData.eleveRef).select('current_classe').lean()
    if (e?.current_classe) classIds.add(String(e.current_classe))
    return { role, isStaff: false, all: false, classIds }
  }

  if (role === 'parent' && Array.isArray(userDoc.roleData?.childrenRefs) && userDoc.roleData.childrenRefs.length) {
    const kids = await Eleve.find({ _id: { $in: userDoc.roleData.childrenRefs } })
      .select('current_classe')
      .lean()
    kids.forEach((k) => k.current_classe && classIds.add(String(k.current_classe)))
    return { role, isStaff: false, all: false, classIds }
  }

  return { role, isStaff: false, all: false, classIds: new Set() }
}

/** L'utilisateur peut-il VOIR le contenu (photos) de l'album ? */
export function canAccessAlbum(access, album) {
  if (access.all) return true // admin / démo
  if (album.isGlobal || !album.classId) return true // album école → tous les connectés
  return access.classIds.has(String(album.classId)) // album de classe → membres de la classe
}

/** L'utilisateur peut-il SUPPRIMER (modérer) l'album / ses photos ? */
export function canModerateAlbum(access, album) {
  if (access.all) return true // admin partout
  if (access.isStaff && album.classId && access.classIds.has(String(album.classId))) return true // prof de la classe
  return false
}

/** Garde basique : id valide ? (utilisé par les routes dynamiques) */
export function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}
