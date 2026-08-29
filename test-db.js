const mongoose = require('mongoose');
const Eleve = require('./app/api/_/models/ai/Eleve');
const Post = require('./app/api/_/models/ai/Post');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://bmad:bmad@cluster0.o893t.mongodb.net/school_erp?retryWrites=true&w=majority&appName=Cluster0");
  
  const eleve = await Eleve.findOne({});
  console.log("Eleve schoolKey:", eleve ? eleve.schoolKey : "NO ELEVE");
  
  const post = await Post.findOne({});
  console.log("Post schoolKey:", post ? post.schoolKey : "NO POST");
  
  process.exit(0);
}
run();
