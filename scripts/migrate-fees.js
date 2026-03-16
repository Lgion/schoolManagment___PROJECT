const mongoose = require('mongoose');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const STUDENT_MODEL_NAME = 'ai_Eleves_Ecole_St_Martin';
const LEGACY_FEE_MAP = {
  'argent': 'scol_cash',
  'riz': 'scol_nature'
};

if (!MONGODB_URI) {
  console.error('❌ Erreur: MONGODB_URI n\'est pas défini dans le fichier .env');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté.');

    // 1. Initialiser SchoolSettings (Frais + Targets)
    const Settings = mongoose.models.SchoolSettings || mongoose.model('SchoolSettings', new mongoose.Schema({
      schoolKey: String,
      feeDefinitions: Array,
      targets: Array
    }, { strict: false }));

    let settings = await Settings.findOne({ schoolKey: 'default' });
    if (!settings) {
      console.log('📝 Création de SchoolSettings par défaut...');
      settings = await Settings.create({
        schoolKey: 'default',
        feeDefinitions: [
          {
            id: 'scol_cash',
            label: 'Frais Scolaires (Espèce)',
            unit: 'F',
            targets: [
              { key: 'interne', label: 'Interne', amount: 45000 },
              { key: 'externe', label: 'Externe', amount: 18000 }
            ]
          },
          {
            id: 'scol_nature',
            label: 'Frais Scolaires (Nature)',
            unit: 'kg',
            targets: [
              { key: 'interne', label: 'Interne', amount: 50 },
              { key: 'externe', label: 'Externe', amount: 25 }
            ]
          }
        ],
        targets: [
          { key: 'isInterne', options: ['Interne', 'Externe'] }
        ],
        updatedAt: new Date()
      });
    } else {
      // S'assurer que les targets existent
      if (!settings.targets || settings.targets.length === 0) {
        console.log('📝 Ajout du target global "isInterne" par défaut...');
        settings.targets = [{ key: 'isInterne', options: ['Interne', 'Externe'] }];
        await settings.save();
      }
    }
    console.log('✅ SchoolSettings à jour.');

    // 2. Migration des élèves
    // On doit gérer scolarity_fees ET la bascule isInterne -> targetsList
    const Student = mongoose.models[STUDENT_MODEL_NAME] || mongoose.model(STUDENT_MODEL_NAME, new mongoose.Schema({
      scolarity_fees_$_checkbox: { type: Object },
      isInterne: { type: Boolean },
      targetsList: { type: Object }
    }, { strict: false }));

    const students = await Student.find({});
    console.log(`🔍 Analyse de ${students.length} élèves...`);

    let totalUpdated = 0;
    let totalDepositsMigrated = 0;
    let totalProfilingMigrated = 0;

    for (const student of students) {
      let hasChanges = false;
      
      // A. Migration des dépôts de frais
      const fees = student.scolarity_fees_$_checkbox;
      if (fees && typeof fees === 'object') {
        for (const year in fees) {
          const yearData = fees[year];
          if (!yearData || typeof yearData !== 'object') continue;
          for (const period in yearData) {
            const deposits = yearData[period];
            if (!Array.isArray(deposits)) continue;
            for (let i = 0; i < deposits.length; i++) {
              const deposit = deposits[i];
              const legacyKey = Object.keys(LEGACY_FEE_MAP).find(key => deposit[key] !== undefined);
              if (legacyKey) {
                deposits[i] = {
                  feeId: LEGACY_FEE_MAP[legacyKey],
                  amount: Number(deposit[legacyKey]),
                  timestamp: deposit.timestamp || Date.now()
                };
                hasChanges = true;
                totalDepositsMigrated++;
              }
            }
          }
        }
      }

      // B. Migration isInterne -> targetsList
      if (student.isInterne !== undefined) {
        const currentList = student.targetsList || {};
        if (student.isInterne === true) {
          currentList.isInterne = "Interne";
        }
        // Si false, on ne met rien (le fallback code gèrera "Externe")
        
        student.targetsList = currentList;
        student.set('isInterne', undefined); // Mark for removal
        hasChanges = true;
        totalProfilingMigrated++;
      }

      if (hasChanges) {
        student.markModified('scolarity_fees_$_checkbox');
        student.markModified('targetsList');
        await student.save();
        totalUpdated++;
      }
    }

    // Unset final propre (pour les champs marked undefined)
    await Student.updateMany({}, { $unset: { isInterne: 1 } });

    console.log('\n--- RAPPORT DE MIGRATION ---');
    console.log(`✅ Élèves mis à jour : ${totalUpdated}`);
    console.log(`✅ Dépôts convertis : ${totalDepositsMigrated}`);
    console.log(`✅ Profils convertis (isInterne) : ${totalProfilingMigrated}`);
    console.log('----------------------------');

  } catch (error) {
    console.error('❌ Erreur pendant la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB.');
    process.exit(0);
  }
}

migrate();
