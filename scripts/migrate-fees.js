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

    // 1. S'assurer que les définitions de frais existent en BD pour que l'UI puisse les afficher
    const Settings = mongoose.models.SchoolSettings || mongoose.model('SchoolSettings', new mongoose.Schema({
      schoolKey: String,
      feeDefinitions: Array
    }, { strict: false }));

    let settings = await Settings.findOne({ schoolKey: 'default' });
    if (!settings) {
      console.log('📝 Création des définitions de frais par défaut dans SchoolSettings...');
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
        updatedAt: new Date()
      });
      console.log('✅ Définitions créées.');
    }

    // 2. Migration des élèves
    const Student = mongoose.models[STUDENT_MODEL_NAME] || mongoose.model(STUDENT_MODEL_NAME, new mongoose.Schema({
      scolarity_fees_$_checkbox: { type: Object }
    }, { strict: false }));

    const students = await Student.find({});
    console.log(`🔍 Analyse de ${students.length} élèves...`);

    let totalUpdated = 0;
    let totalDepositsMigrated = 0;

    for (const student of students) {
      let hasChanges = false;
      const fees = student.scolarity_fees_$_checkbox;

      if (!fees || typeof fees !== 'object') continue;

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
              const newFeeId = LEGACY_FEE_MAP[legacyKey];
              const amount = Number(deposit[legacyKey]);
              
              const newDeposit = {
                feeId: newFeeId,
                amount: amount,
                timestamp: deposit.timestamp || Date.now()
              };

              deposits[i] = newDeposit;
              hasChanges = true;
              totalDepositsMigrated++;
            }
          }
        }
      }

      if (hasChanges) {
        student.markModified('scolarity_fees_$_checkbox');
        await student.save();
        totalUpdated++;
      }
    }

    console.log('\n--- RAPPORT DE MIGRATION ---');
    console.log(`✅ Élèves mis à jour : ${totalUpdated}`);
    console.log(`✅ Dépôts convertis : ${totalDepositsMigrated}`);
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
