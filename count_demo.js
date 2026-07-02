const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function count() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Eleve = require('./app/api/_/models/ai/Eleve');
  const count = await Eleve.countDocuments({ schoolKey: 'demo_master' });
  const inst = await mongoose.connection.collection('ai_institutions_ecole_st_martins').findOne({ schoolKey: 'demo_master' });
  console.log(`Nombre d'élèves dans demo_master : ${count}`);
  console.log(`Nom de l'école demo_master : ${inst ? inst.name : 'Introuvable'}`);
  process.exit(0);
}
count();
