const mongoose = require('mongoose');

const feeTargetSchema = new mongoose.Schema(
  {
    key:    { type: String, required: true },   // ex: 'interne'
    label:  { type: String, required: true },   // ex: 'Interne' (personnalisable)
    amount: { type: Number, required: true },   // ex: 45000
  },
  { _id: false }
);

const feeDefinitionSchema = new mongoose.Schema(
  {
    id:      { type: String, required: true },  // ex: 'scol_cash'
    label:   { type: String, required: true },  // ex: 'Frais Scolaires (Espèce)'
    unit:    { type: String, required: true },  // ex: 'F'
    targets: { type: [feeTargetSchema], default: [] },
  },
  { _id: false }
);

const targetDefinitionSchema = new mongoose.Schema(
  {
    key:     { type: String, required: true },   // ex: 'isInterne', 'doCantinePlan', 'sport'
    options: { type: [String], required: true },  // ex: ['Interne', 'Externe']
  },
  { _id: false }
);

const homepageSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'École de Démo' },
    slogan: { type: String, default: 'Système de gestion scolaire' },
    texts: { type: [String], default: ['Bienvenue sur l\'application de gestion scolaire.'] },
    photo: { type: String, default: '/ecole_testes/photo.jpg' },
    logoUrl: { type: String, default: '/logo.png' },
    bannerUrl: { type: String, default: '/bg_header.webp' },
    primaryColor: { type: String, default: '#1E3A8A' },
    accentColor: { type: String, default: '#F97316' },
    fontHeading: { type: String, default: 'Poppins' },
    fontBody: { type: String, default: 'Inter' },
    borderRadiusPreset: { type: String, default: 'medium' },
    headerStylePreset: { type: String, default: 'glass' },
  },
  { _id: false }
);

const schoolSettingsSchema = new mongoose.Schema({
  schoolKey:      { type: String, unique: true, default: 'default' },
  feeDefinitions: { type: [feeDefinitionSchema], default: [] },
  targets:        { type: [targetDefinitionSchema], default: [] },
  homepage:       { type: homepageSchema, default: () => ({}) },
  updatedAt:      { type: Date, default: Date.now },
});

let model;
if (!mongoose.modelNames().includes('SchoolSettings')) {
  model = mongoose.model('SchoolSettings', schoolSettingsSchema);
} else {
  model = mongoose.model('SchoolSettings');
}

module.exports = model;
