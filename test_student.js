import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

const EleveSchema = new mongoose.Schema({}, { strict: false });
const Eleve = mongoose.models.Eleve || mongoose.model('eleves', EleveSchema);

async function run() {
  const eleves = await Eleve.find({}).limit(5).lean();
  eleves.forEach(e => {
    console.log(e.nom, e.prenoms, Object.keys(e.compositions || {}));
  });
  process.exit();
}
run();
