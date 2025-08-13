import mongoose from 'mongoose';

const articlesOptionsSchema = new mongoose.Schema({
  id: { type: String, required: true },
  img_article: { type: String, required: true },
  stock: { type: String },
  vendus: { type: String },
  coloris: { type: String, default: null },
  couverture: { type: String, default: null },
  taille_: { type: String },
  opt_nom: { type: String, default: null },
  opt_prix: { type: String },
  autre: { type: String },
  opt_img: { type: String }
});

export default mongoose.models.ArticlesOptions || mongoose.model('ArticlesOptions', articlesOptionsSchema);