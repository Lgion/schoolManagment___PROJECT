import mongoose from 'mongoose';
const schema = new mongoose.Schema({ obj: { type: Object } });
const Model = mongoose.model('Test2', schema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test', { serverSelectionTimeoutMS: 2000 });
  const doc = new Model({ obj: {} });
  doc.obj.a = 1;
  doc.obj.b = 2;
  await doc.save();
  const fetched = await Model.findById(doc._id).lean();
  console.log('Fetched:', fetched);
  process.exit();
}
run();
