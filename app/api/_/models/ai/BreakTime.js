const mongoose = require('mongoose');

/**
 * Modèle BreakTime - Gestion des pauses dans les emplois du temps
 * Permet de définir les créneaux de pause configurables par établissement
 */
const breakTimeSchema = new mongoose.Schema({
  // Nom de la pause
  nom: {
    type: String,
    required: true,
    trim: true
  },
  
  // Heure de début de la pause
  heureDebut: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  
  // Heure de fin de la pause
  heureFin: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  
  // Durée en minutes (calculée automatiquement)
  dureeMinutes: {
    type: Number,
    required: true
  },
  
  // Type de pause
  type: {
    type: String,
    enum: ['recreation', 'dejeuner', 'gouter', 'autre'],
    default: 'recreation'
  },
  
  // Jours de la semaine où cette pause s'applique
  joursApplicables: [{
    type: String,
    enum: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
  }],
  
  // Niveaux concernés (optionnel, si vide = tous les niveaux)
  niveauxConcernes: [{
    type: String,
    trim: true
  }],
  
  // Couleur pour l'affichage (optionnel)
  couleur: {
    type: String,
    default: '#ffa726' // Orange par défaut
  },
  
  // Ordre d'affichage
  ordre: {
    type: Number,
    default: 0
  },
  
  // Pause active ou non
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Métadonnées
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour optimiser les requêtes
breakTimeSchema.index({ heureDebut: 1, heureFin: 1 });
breakTimeSchema.index({ isActive: 1, ordre: 1 });

// Middleware pour calculer la durée automatiquement
breakTimeSchema.pre('save', function(next) {
  if (this.heureDebut && this.heureFin) {
    const [debutH, debutM] = this.heureDebut.split(':').map(Number);
    const [finH, finM] = this.heureFin.split(':').map(Number);
    
    const debutMinutes = debutH * 60 + debutM;
    const finMinutes = finH * 60 + finM;
    
    this.dureeMinutes = finMinutes - debutMinutes;
  }
  
  this.updatedAt = new Date();
  next();
});

// Méthodes statiques
breakTimeSchema.statics.getActiveBreaks = function(niveau = null) {
  const query = { isActive: true };
  
  if (niveau) {
    query.$or = [
      { niveauxConcernes: { $size: 0 } }, // Pas de restriction de niveau
      { niveauxConcernes: niveau }
    ];
  }
  
  return this.find(query).sort({ ordre: 1, heureDebut: 1 });
};

breakTimeSchema.statics.getBreaksByDay = function(jour, niveau = null) {
  const query = { 
    isActive: true,
    joursApplicables: jour
  };
  
  if (niveau) {
    query.$or = [
      { niveauxConcernes: { $size: 0 } },
      { niveauxConcernes: niveau }
    ];
  }
  
  return this.find(query).sort({ heureDebut: 1 });
};

// Méthodes d'instance
breakTimeSchema.methods.isInTimeRange = function(heure) {
  return heure >= this.heureDebut && heure < this.heureFin;
};

breakTimeSchema.methods.overlapsWithTimeSlot = function(heureDebut, heureFin) {
  return !(heureFin <= this.heureDebut || heureDebut >= this.heureFin);
};

const BreakTime = mongoose.models.BreakTime || mongoose.model('BreakTime', breakTimeSchema);

module.exports = BreakTime;
