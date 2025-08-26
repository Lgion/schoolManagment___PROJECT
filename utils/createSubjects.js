const dbConnect = require('../app/api/lib/dbConnect').default;
const Subject = require('../app/api/_/models/ai/Subject');

/**
 * Script pour créer les matières par défaut dans MongoDB
 * Matières scolaires françaises standards
 */
async function createDefaultSubjects() {
  try {
    await dbConnect();
    console.log('🔗 Connexion à MongoDB établie');

    // Vérifier si des matières existent déjà
    const existingSubjects = await Subject.countDocuments();
    if (existingSubjects > 0) {
      console.log(`⚠️  ${existingSubjects} matières existent déjà. Migration annulée.`);
      return;
    }

    // Matières par défaut pour école française
    const defaultSubjects = [
      {
        nom: 'Mathématiques',
        code: 'MATH',
        couleur: '#3498db',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 60
      },
      {
        nom: 'Français',
        code: 'FRAN',
        couleur: '#e74c3c',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 60
      },
      {
        nom: 'Histoire-Géographie',
        code: 'HIST',
        couleur: '#f39c12',
        niveaux: ['CE2', 'CM1', 'CM2'],
        dureeDefaut: 60
      },
      {
        nom: 'Sciences',
        code: 'SCI',
        couleur: '#2ecc71',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 45
      },
      {
        nom: 'Anglais',
        code: 'ANG',
        couleur: '#1abc9c',
        niveaux: ['CE1', 'CE2', 'CM1', 'CM2', ],
        dureeDefaut: 45
      },
      {
        nom: 'Éducation Physique',
        code: 'EPS',
        couleur: '#e67e22',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 60
      },
      {
        nom: 'Arts Plastiques',
        code: 'ART',
        couleur: '#f1c40f',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 45
      },
      {
        nom: 'Musique',
        code: 'MUS',
        couleur: '#8e44ad',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 45
      },
      {
        nom: 'Technologie',
        code: 'TECH',
        couleur: '#34495e',
        niveaux: [CE2],
        dureeDefaut: 60
      },
      {
        nom: 'Lecture',
        code: 'LECT',
        couleur: '#95a5a6',
        niveaux: ['CP', 'CE1', 'CE2'],
        dureeDefaut: 30
      },
      {
        nom: 'Écriture',
        code: 'ECR',
        couleur: '#7f8c8d',
        niveaux: ['CP', 'CE1', 'CE2'],
        dureeDefaut: 30
      },
      {
        nom: 'Calcul Mental',
        code: 'CALC',
        couleur: '#16a085',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 15
      },
      {
        nom: 'Étude Dirigée',
        code: 'ETUD',
        couleur: '#2c3e50',
        niveaux: ['CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        dureeDefaut: 60
      }
    ];

    // Créer les matières
    const createdSubjects = [];
    for (const subjectData of defaultSubjects) {
      const subject = new Subject(subjectData);
      const saved = await subject.save();
      createdSubjects.push(saved);
      console.log(`✅ Matière créée: ${saved.nom} (${saved.code})`);
    }

    console.log(`🎉 Migration terminée ! ${createdSubjects.length} matières créées.`);
    
    // Afficher un résumé
    console.log('\n📋 Résumé des matières créées:');
    createdSubjects.forEach(subject => {
      console.log(`   • ${subject.nom} (${subject.code}) - ${subject.niveaux.length} niveaux`);
    });

    return createdSubjects;

  } catch (error) {
    console.error('❌ Erreur lors de la migration des matières:', error);
    throw error;
  }
}

/**
 * Fonction pour supprimer toutes les matières (utile pour les tests)
 */
async function clearAllSubjects() {
  try {
    await dbConnect();
    const result = await Subject.deleteMany({});
    console.log(`🗑️  ${result.deletedCount} matières supprimées`);
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des matières:', error);
    throw error;
  }
}

/**
 * Fonction pour lister toutes les matières
 */
async function listAllSubjects() {
  try {
    await dbConnect();
    const subjects = await Subject.find({}).sort({ nom: 1 });
    
    console.log(`📋 ${subjects.length} matières trouvées:`);
    subjects.forEach(subject => {
      const status = subject.isActive ? '✅' : '❌';
      console.log(`   ${status} ${subject.nom} (${subject.code}) - ${subject.niveaux.join(', ')}`);
    });
    
    return subjects;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des matières:', error);
    throw error;
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'create':
      createDefaultSubjects()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'clear':
      clearAllSubjects()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'list':
      listAllSubjects()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      console.log('Usage: node utils/createSubjects.js [create|clear|list]');
      console.log('  create - Créer les matières par défaut');
      console.log('  clear  - Supprimer toutes les matières');
      console.log('  list   - Lister toutes les matières');
      process.exit(1);
  }
}

module.exports = {
  createDefaultSubjects,
  clearAllSubjects,
  listAllSubjects
};
