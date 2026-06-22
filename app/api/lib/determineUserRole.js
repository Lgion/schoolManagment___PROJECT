import Teacher from '../_/models/ai/Teacher';
import Eleve from '../_/models/ai/Eleve';

/**
 * Détermine le rôle d'un utilisateur à partir de son email, selon la spec
 * `roles_and_accounts.md`. Source de vérité PARTAGÉE entre le webhook Clerk
 * (`/api/webhooks/clerk`) et la synchro à la connexion (`/api/sync-user`),
 * afin d'éviter toute divergence de logique entre les deux chemins.
 *
 * Ordre strict :
 *  1. Admin   : email présent dans NEXT_PUBLIC_EMAIL_ADMIN.
 *  2. Prof    : email trouvé sur un Teacher (`email_$_email`).
 *  3. Élève   : compte autonome via `studentEmail` d'un Eleve.
 *  4. Parent  : `parents.email` d'un ou plusieurs Eleve (gère la fratrie).
 *  5. Public  : défaut.
 *
 * NB : les modèles Teacher/Eleve sont importés ici, ce qui garantit que leurs
 * schémas sont bien enregistrés dans le process avant tout populate (évite
 * MissingSchemaError au cold start). L'appelant doit avoir déjà ouvert la
 * connexion (`dbConnect`) avant d'appeler cette fonction.
 *
 * @param {string} email
 * @returns {Promise<{role: string, ref: import('mongoose').Types.ObjectId|null, childrenRefs: import('mongoose').Types.ObjectId[]}>}
 */
export async function determineUserRole(email) {
  try {
    // Garde : sans email valide, ne pas lancer de requêtes (findOne({email: undefined})
    // pourrait matcher des documents sans ce champ).
    if (!email || typeof email !== 'string') {
      return { role: 'public', ref: null, childrenRefs: [] };
    }

    // 1. Admin (variable d'environnement)
    const adminEmails = process.env.NEXT_PUBLIC_EMAIL_ADMIN?.split(' ') || [];
    if (adminEmails.includes(email)) {
      return { role: 'admin', ref: null, childrenRefs: [] };
    }

    // 2. Professeur
    const teacher = await Teacher.findOne({ 'email_$_email': email });
    if (teacher) {
      return { role: 'prof', ref: teacher._id, childrenRefs: [] };
    }

    // 3. Élève autonome (compte propre via studentEmail)
    const student = await Eleve.findOne({ studentEmail: email });
    if (student) {
      return { role: 'eleve', ref: student._id, childrenRefs: [] };
    }

    // 4. Parent (compte famille) — TOUS les enfants partageant cet email parent
    const children = await Eleve.find({ 'parents.email': email }).select('_id');
    if (children.length > 0) {
      return { role: 'parent', ref: null, childrenRefs: children.map((c) => c._id) };
    }

    // 5. Défaut
    return { role: 'public', ref: null, childrenRefs: [] };
  } catch (error) {
    console.error('Error determining user role:', error);
    return { role: 'public', ref: null, childrenRefs: [] };
  }
}

/**
 * Construit le sous-objet `roleData` d'un User selon son rôle résolu.
 * Centralisé pour rester cohérent entre création et mise à jour, et entre
 * le webhook et la synchro.
 */
export function buildRoleData(role, ref, childrenRefs = []) {
  const roleData = {};
  if (role === 'prof' && ref) {
    roleData.teacherRef = ref;
  } else if (role === 'eleve' && ref) {
    roleData.eleveRef = ref;
  } else if (role === 'parent') {
    roleData.childrenRefs = childrenRefs || [];
  } else if (role === 'admin') {
    roleData.adminLevel = 'standard';
  }
  return roleData;
}
