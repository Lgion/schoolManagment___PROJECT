const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const datasSchema = mongoose.Schema({
    key: { 
        type: String, 
        required: true,
        index: true // Index pour recherche rapide par clé
    },
    value: { 
        type: Schema.Types.Mixed, // Permet tout type de données (Object, String, Number, etc.)
        required: true 
    },
    option: { 
        type: Schema.Types.Mixed, // Métadonnées optionnelles
        default: null 
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Index composé pour recherche efficace
datasSchema.index({ key: 1, createdAt: -1 });

// Middleware pour mettre à jour updatedAt
datasSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Méthodes statiques utiles
datasSchema.statics.findByKey = function(key) {
    return this.find({ key: key }).sort({ createdAt: -1 });
};

datasSchema.statics.findLatestByKey = function(key) {
    return this.findOne({ key: key }).sort({ createdAt: -1 });
};

datasSchema.statics.removeByKey = function(key) {
    return this.deleteMany({ key: key });
};

const Datas = mongoose.models.Datas || mongoose.model('Datas', datasSchema);

module.exports = { Datas, schema: datasSchema };
