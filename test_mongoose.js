import mongoose from 'mongoose';
const schema = new mongoose.Schema({ obj: { type: Object } });
const Model = mongoose.model('Test', schema);
const doc = new Model({ obj: {} });
doc.obj.foo = 'bar';
console.log('Modified paths:', doc.modifiedPaths());
