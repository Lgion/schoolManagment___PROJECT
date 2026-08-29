import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

const EleveSchema = new mongoose.Schema({}, { strict: false });
const Eleve = mongoose.models.Eleve || mongoose.model('ai_Eleves_Ecole_St_Martin', EleveSchema);

async function run() {
  const eleves = await Eleve.find({}).limit(1).lean();
  console.log(JSON.stringify(eleves[0].bolobi_class_history_$_ref_µ_classes, null, 2));
  process.exit();
}
run();
