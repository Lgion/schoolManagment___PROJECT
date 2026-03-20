/**
 * SCRIPT DE CONSOLIDATION DES CLASSES
 * Ce script regroupe les classes par niveau/alias et fusionne les versions
 * passées dans le champ 'history' de la classe la plus récente.
 */
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

// Définition simplifiée du schéma pour le script
const ClasseSchema = new mongoose.Schema({
  niveau: String,
  alias: String,
  annee: String,
  eleves: Array,
  professeur: Array,
  history: { type: Array, default: [] },
  photo: String,
  homework: Object,
  compositions: Array,
  coefficients: Object,
  moyenne_trimetriel: Array,
  commentaires: Array,
  schedules: Array,
  currentScheduleId: mongoose.Schema.Types.ObjectId,
  createdAt: String,
  cloudinary: Object,
  reports: Array
}, { strict: false });

async function consolidate() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI manquante dans .env.local");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connecté à MongoDB");

    const Classe = mongoose.models.ai_Ecole_St_Martin || mongoose.model('ai_Ecole_St_Martin', ClasseSchema);

    // 1. Récupérer toutes les classes
    const allClasses = await Classe.find({});
    console.log(`📊 ${allClasses.length} classes trouvées au total.`);

    // 2. Grouper par Niveau et Alias
    const groups = {};
    allClasses.forEach(c => {
      const key = `${c.niveau}-${c.alias}`.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });

    console.log(`🔍 ${Object.keys(groups).length} groupes de classes identifiés.`);

    for (const key in groups) {
      const group = groups[key];
      if (group.length <= 1) continue;

      console.log(`\n📦 Consolidation du groupe ${key}...`);

      // Trier par année pour identifier la plus récente (format YYYY-YYYY)
      group.sort((a, b) => b.annee.localeCompare(a.annee));

      const master = group[0];
      const others = group.slice(1);

      console.log(`🎯 Master : ${master.niveau} ${master.alias} (${master.annee}) [ID: ${master._id}]`);

      for (const old of others) {
        console.log(`   🔸 Archivage de ${old.annee} [ID: ${old._id}]`);

        // Créer le snapshot
        const snapshot = {
          annee: old.annee,
          eleves: (old.eleves || []).map(id => id.toString()),
          professeur: (old.professeur || []).map(id => id.toString()),
          homework: old.homework || {},
          compositions: old.compositions || [],
          coefficients: old.coefficients || {},
          moyenne_trimetriel: old.moyenne_trimetriel || ["", "", ""],
          commentaires: old.commentaires || [],
          schedules: old.schedules || [],
          currentScheduleId: old.currentScheduleId,
          createdAt: old.createdAt,
          cloudinary: old.cloudinary,
          reports: old.reports || [],
          consolidatedAt: +new Date()
        };

        // Ajouter à l'historique du Master
        if (!Array.isArray(master.history)) master.history = [];
        master.history.push(snapshot);

        // Supprimer l'ancienne classe
        await Classe.deleteOne({ _id: old._id });
        console.log(`      ✅ Supprimée.`);
      }

      // Sauvegarder le Master mis à jour
      master.markModified('history');
      await master.save();
      console.log(`✅ Master mis à jour avec ${others.length} années d'historique.`);
    }

    console.log("\n✨ Consolidation terminée avec succès.");
  } catch (err) {
    console.error("❌ Erreur pendant la consolidation:", err);
  } finally {
    await mongoose.disconnect();
  }
}

consolidate();
