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

const schoolSettingsSchema = new mongoose.Schema({
  schoolKey:      { type: String, unique: true, default: 'default' },
  feeDefinitions: { type: [feeDefinitionSchema], default: [] },
  targets:        { type: [targetDefinitionSchema], default: [] },
  updatedAt:      { type: Date, default: Date.now },
});

let model;
if (!mongoose.modelNames().includes('SchoolSettings')) {
  model = mongoose.model('SchoolSettings', schoolSettingsSchema);
} else {
  model = mongoose.model('SchoolSettings');
}

module.exports = model;
