const mongoose = require('mongoose');
require('dotenv').config();

const id = '6a3be01958b29e7916cbf13e';
const schema = new mongoose.Schema({}, { strict: false });

async function searchLefebvre(name, uri) {
  if (!uri) {
    console.log(`--- ${name} URI is undefined ---`);
    return;
  }
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    const Eleve = conn.model('Eleve', schema, 'ai_eleves_ecole_st_martins');
    
    // Essayer par ID d'abord
    const docById = await Eleve.findById(id);
    if (docById) {
      console.log(`*** FOUND BY ID IN ${name} ***`);
      printDoc(docById);
      return;
    }
    
    // Sinon par nom
    const docs = await Eleve.find({
      $or: [
        { nom: /Lefeb/i },
        { prenoms: /Lucas/i }
      ]
    });
    console.log(`--- ${name} (Search by Name) ---`);
    console.log('Found docs count:', docs.length);
    docs.forEach(doc => {
      printDoc(doc);
    });
  } catch (e) {
    console.error(`Error ${name}:`, e.message);
  }
}

function printDoc(doc) {
  console.log('ID:', doc._id);
  console.log('nom:', doc.get('nom'), 'prenoms:', doc.get('prenoms'));
  console.log('schoolKey:', doc.get('schoolKey'));
  console.log('compositions years:', Object.keys(doc.get('compositions') || {}));
  console.log('compositions 2024-2025:', JSON.stringify(doc.get('compositions')?.['2024-2025'], null, 2));
  console.log('bonus:', JSON.stringify(doc.get('bonus'), null, 2));
  console.log('manus:', JSON.stringify(doc.get('manus'), null, 2));
  console.log('targetsList:', doc.get('targetsList'));
  console.log('----------------------------');
}

(async () => {
  await searchLefebvre('PROD', process.env.MONGODB_URI);
  await searchLefebvre('SANDBOX', process.env.MONGODB_SANDBOX_URI);
  process.exit(0);
})();
