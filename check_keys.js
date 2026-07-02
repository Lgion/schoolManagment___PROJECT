const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Eleve = require('./app/api/_/models/ai/Eleve');
  
  const counts = await Eleve.aggregate([
    { $group: { _id: "$schoolKey", count: { $sum: 1 } } }
  ]);
  
  console.log("Répartition des élèves par schoolKey :");
  console.log(counts);
  process.exit(0);
}
run();
