import mongoose from 'mongoose';

const articlesSchema = new mongoose.Schema({
  id_produits: { type: String, required: true },
  nom: { type: String, required: true },
  user_name: { type: String }, // "objet" ou "publication"
  auteur: { type: String },
  img: { type: String },
  fr: { type: String },
  en: { type: String },
  es: { type: String },
  fr1: { type: String }, // description détaillée
  en1: { type: String },
  es1: { type: String },
  taille: { type: String },
  materiaux: { type: String },
  autre: { type: String },
  prix: { type: String },
  stock: { type: Number, default: 5 },
  vendus: { type: Number, default: 0 },
  alaune: { type: Number, default: 0 },
  actif: { type: Boolean, default: true },
  code: { type: String }
});

export default mongoose.models.Articles || mongoose.model('Articles', articlesSchema);