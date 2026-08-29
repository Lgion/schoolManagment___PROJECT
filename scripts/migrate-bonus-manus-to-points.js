#!/usr/bin/env node

/**
 * Migration : champs legacy `bonus` / `manus` (modèle Eleve) -> collection `PointTransaction`.
 *
 * Format legacy (voir TimedEntriesBlock dans entityBlocks.jsx) :
 *   eleve.bonus = [ { "<timestamp>": "<raison>" }, ... ]   // ou un objet direct { ts: raison }
 *   eleve.manus = [ { "<timestamp>": "<raison>" }, ... ]
 * Aucune notion de professeur, de catégorie ni de montant : chaque entrée vaut 1 point.
 *
 * Pour chaque entrée on crée une PointTransaction :
 *   - amount  : +1 (bonus) / -1 (malus)
 *   - labelId : un label système "Historique" (BONUS ou MALUS), créé si absent
 *   - comment : la raison libre saisie à l'époque
 *   - teacherId : le 1er prof de la classe courante de l'élève si résoluble, sinon null
 *   - classId : current_classe de l'élève
 *   - createdAt : le timestamp d'origine de l'entrée
 *
 * Idempotent : on saute les entrées déjà migrées (même élève + même createdAt + même label système).
 *
 * Usage :
 *   node scripts/migrate-bonus-manus-to-points.js [--dry-run] [--sample] [--limit=N]
 *     --dry-run : n'écrit rien, affiche seulement ce qui serait fait
 *     --sample  : cible MONGODB_sample_URI au lieu de MONGODB_URI
 *     --limit=N : ne traite que N élèves (debug)
 */

require('dotenv').config()
const mongoose = require('mongoose')

const Eleve = require('../app/api/_/models/ai/Eleve')
const Classe = require('../app/api/_/models/ai/Classe')
const PointLabel = require('../app/api/_/models/ai/PointLabel')
const PointTransaction = require('../app/api/_/models/ai/PointTransaction')

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const useSample = args.includes('--sample')
const limitMatch = args.find(a => a.startsWith('--limit='))
const limit = limitMatch ? parseInt(limitMatch.split('=')[1], 10) : null

const MONGODB_URI = useSample ? process.env.MONGODB_sample_URI : process.env.MONGODB_URI

console.log('🚀 === MIGRATION bonus/manus -> PointTransaction ===')
console.log(`📋 Mode    : ${isDryRun ? 'DRY RUN (aucune écriture)' : 'ÉCRITURE RÉELLE'}`)
console.log(`🗄️  Base    : ${useSample ? 'SAMPLE (MONGODB_sample_URI)' : 'PRINCIPALE (MONGODB_URI)'}`)
console.log(`📊 Limite  : ${limit || 'aucune'}`)
console.log('====================================================\n')

// Normalise un champ legacy (array d'objets OU objet direct) en paires [tsNumber, raison].
function toEntries(legacy) {
  if (!legacy) return []
  const pairs = Array.isArray(legacy)
    ? legacy.flatMap(obj => (obj && typeof obj === 'object' ? Object.entries(obj) : []))
    : (typeof legacy === 'object' ? Object.entries(legacy) : [])
  return pairs
    .map(([ts, raison]) => [Number(ts), typeof raison === 'string' ? raison : (raison != null ? String(raison) : '')])
    .filter(([ts]) => Number.isFinite(ts))
}

// Trouve ou crée un label système "Historique" pour un type donné.
async function ensureSystemLabel(type) {
  const name = type === 'BONUS' ? 'Bonus (historique)' : 'Malus (historique)'
  let label = await PointLabel.findOne({ name, type })
  if (label) return label
  if (isDryRun) {
    console.log(`   [dry-run] créerait le label système "${name}" (${type})`)
    return { _id: `dry_${type}`, name, type } // factice pour le dry-run
  }
  label = await PointLabel.create({
    name,
    type,
    icon: type === 'BONUS' ? '⭐' : '⚠️',
    defaultAmount: type === 'BONUS' ? 1 : -1,
  })
  console.log(`   ✅ Label système créé : "${name}" (${type}) -> ${label._id}`)
  return label
}

async function run() {
  if (!MONGODB_URI) {
    throw new Error(`URI manquante (${useSample ? 'MONGODB_sample_URI' : 'MONGODB_URI'} non définie dans .env)`)
  }

  await mongoose.connect(MONGODB_URI)
  console.log(`✅ Connecté à MongoDB (${useSample ? 'sample' : 'principale'})\n`)

  const bonusLabel = await ensureSystemLabel('BONUS')
  const manusLabel = await ensureSystemLabel('MALUS')

  // Cache classe -> 1er prof, pour éviter des requêtes répétées
  const teacherByClass = new Map()
  async function resolveTeacher(classId) {
    if (!classId) return null
    const key = classId.toString()
    if (teacherByClass.has(key)) return teacherByClass.get(key)
    let teacherId = null
    try {
      const classe = await Classe.findById(classId).select('professeur').lean()
      teacherId = classe?.professeur?.[0] || null
    } catch (_) { /* classe introuvable -> null */ }
    teacherByClass.set(key, teacherId)
    return teacherId
  }

  const query = { $or: [{ bonus: { $exists: true, $ne: [] } }, { manus: { $exists: true, $ne: [] } }] }
  let cursor = Eleve.find(query).select('nom prenoms current_classe bonus manus').lean()
  if (limit) cursor = cursor.limit(limit)
  const eleves = await cursor

  console.log(`👥 ${eleves.length} élève(s) avec des entrées bonus/manus à examiner.\n`)

  let created = 0
  let skipped = 0
  const toInsert = []

  for (const eleve of eleves) {
    const teacherId = await resolveTeacher(eleve.current_classe)
    const groups = [
      { entries: toEntries(eleve.bonus), label: bonusLabel, amount: 1 },
      { entries: toEntries(eleve.manus), label: manusLabel, amount: -1 },
    ]

    for (const { entries, label, amount } of groups) {
      for (const [ts, raison] of entries) {
        const createdAt = new Date(ts)
        // Idempotence : déjà migré ?
        const exists = !isDryRun && await PointTransaction.exists({
          studentId: eleve._id,
          labelId: label._id,
          createdAt,
        })
        if (exists) { skipped++; continue }

        toInsert.push({
          studentId: eleve._id,
          teacherId,
          classId: eleve.current_classe || null,
          amount,
          labelId: label._id,
          comment: raison,
          createdAt,
        })
        created++
      }
    }
  }

  console.log(`\n📦 ${created} transaction(s) à créer, ${skipped} déjà migrée(s) (ignorée(s)).`)

  if (toInsert.length && !isDryRun) {
    await PointTransaction.insertMany(toInsert)
    console.log(`✅ ${toInsert.length} PointTransaction insérée(s).`)
  } else if (toInsert.length) {
    console.log('   [dry-run] aucune écriture effectuée.')
  }

  await mongoose.disconnect()
  console.log('\n🏁 Migration terminée.')
}

run().catch(async (e) => {
  console.error('❌ Erreur migration :', e.message)
  try { await mongoose.disconnect() } catch (_) {}
  process.exit(1)
})
