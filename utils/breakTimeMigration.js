const dbConnect = require('../app/api/lib/dbConnect').default;
const BreakTime = require('../app/api/_/models/ai/BreakTime');

/**
 * Script de migration pour créer les pauses par défaut
 * Pauses configurées selon vos spécifications :
 * - Récréation : 10h00-10h30 (30min)
 * - Déjeuner : 12h00-14h00 (2h)
 */
async function createDefaultBreakTimes() {
  try {
    await dbConnect();
    console.log('🔗 Connexion à MongoDB établie');

    // Vérifier si des pauses existent déjà
    const existingBreaks = await BreakTime.countDocuments();
    if (existingBreaks > 0) {
      console.log(`⚠️  ${existingBreaks} pauses existent déjà. Migration annulée.`);
      return;
    }

    // Pauses par défaut selon vos spécifications
    const defaultBreakTimes = [
      {
        nom: 'Récréation du matin',
        heureDebut: '10:00',
        heureFin: '10:30',
        type: 'recreation',
        joursApplicables: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
        niveauxConcernes: [], // Tous les niveaux
        couleur: '#ffa726', // Orange
        ordre: 1
      },
      {
        nom: 'Pause déjeuner',
        heureDebut: '12:00',
        heureFin: '14:00',
        type: 'dejeuner',
        joursApplicables: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
        niveauxConcernes: [], // Tous les niveaux
        couleur: '#4caf50', // Vert
        ordre: 2
      }
    ];

    // Créer les pauses
    const createdBreaks = [];
    for (const breakData of defaultBreakTimes) {
      const breakTime = new BreakTime(breakData);
      const saved = await breakTime.save();
      createdBreaks.push(saved);
      console.log(`✅ Pause créée: ${saved.nom} (${saved.heureDebut}-${saved.heureFin})`);
    }

    console.log(`🎉 Migration terminée ! ${createdBreaks.length} pauses créées.`);
    
    // Afficher un résumé
    console.log('\n📋 Résumé des pauses créées:');
    createdBreaks.forEach(breakTime => {
      console.log(`   • ${breakTime.nom}: ${breakTime.heureDebut}-${breakTime.heureFin} (${breakTime.dureeMinutes}min)`);
    });

    return createdBreaks;

  } catch (error) {
    console.error('❌ Erreur lors de la migration des pauses:', error);
    throw error;
  }
}

/**
 * Fonction pour supprimer toutes les pauses (utile pour les tests)
 */
async function clearAllBreakTimes() {
  try {
    await dbConnect();
    const result = await BreakTime.deleteMany({});
    console.log(`🗑️  ${result.deletedCount} pauses supprimées`);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des pauses:', error);
    throw error;
  }
}

/**
 * Fonction pour lister toutes les pauses
 */
async function listAllBreakTimes() {
  try {
    await dbConnect();
    const breaks = await BreakTime.find({}).sort({ ordre: 1, heureDebut: 1 });
    
    console.log(`📋 ${breaks.length} pauses trouvées:`);
    breaks.forEach(breakTime => {
      const status = breakTime.isActive ? '✅' : '❌';
      console.log(`   ${status} ${breakTime.nom}: ${breakTime.heureDebut}-${breakTime.heureFin} (${breakTime.type})`);
    });
    
    return breaks;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des pauses:', error);
    throw error;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      createDefaultBreakTimes()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'clear':
      clearAllBreakTimes()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'list':
      listAllBreakTimes()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      console.log('Usage: node utils/breakTimeMigration.js [create|clear|list]');
      console.log('  create - Créer les pauses par défaut');
      console.log('  clear  - Supprimer toutes les pauses');
      console.log('  list   - Lister toutes les pauses');
      process.exit(1);
  }
}

module.exports = {
  createDefaultBreakTimes,
  clearAllBreakTimes,
  listAllBreakTimes
};
