const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Schéma pour un créneau horaire
const timeSlotSchema = mongoose.Schema({
  heureDebut: { 
    type: String, 
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }, // "08:00"
  heureFin: { 
    type: String, 
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  }, // "09:00"
  subjectId: { 
    type: ObjectId, 
    ref: 'Subject',
    required: true
  },
  notes: { 
    type: String,
    maxlength: 200
  } // commentaires spéciaux
}, { _id: false })

// Schéma principal pour l'emploi du temps
const scheduleSchema = mongoose.Schema({
  classeId: { 
    type: ObjectId, 
    ref: 'ai_Ecole_St_Martin', 
    required: true 
  },
  label: { 
    type: String, 
    required: true,
    default: function() {
      // Auto-généré : "Emploi du temps - 24/08/2025"
      return `Emploi du temps - ${new Date().toLocaleDateString('fr-FR')}`
    }
  },
  
  // Structure hebdomadaire
  planning: {
    lundi: [timeSlotSchema],
    mardi: [timeSlotSchema],
    mercredi: [timeSlotSchema],
    jeudi: [timeSlotSchema],
    vendredi: [timeSlotSchema],
    samedi: [timeSlotSchema] // optionnel
  },
  
  // Métadonnées
  dateDebut: { 
    type: Date, 
    required: true 
  },
  dateFin: { 
    type: Date, 
    required: true 
  },
  isArchived: { 
    type: Boolean, 
    default: false 
  },
  
  // Historique des modifications
  modifications: [{
    date: { 
      type: Date, 
      default: Date.now 
    },
    userId: { 
      type: String 
    }, // clerkId
    action: { 
      type: String,
      enum: ["created", "updated", "archived"]
    },
    details: { 
      type: Object 
    } // représentation simplifiée du planning
  }],
  
  createdBy: { 
    type: String, 
    required: true 
  }, // clerkId
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
})

// Index pour optimiser les requêtes
scheduleSchema.index({ classeId: 1, isArchived: 1, createdAt: -1 })
scheduleSchema.index({ createdBy: 1 })

// Middleware pour mettre à jour updatedAt
scheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

let model

if (!mongoose.modelNames().includes("Schedule"))
    model = mongoose.model('Schedule', scheduleSchema)
else 
    model = mongoose.model("Schedule")

module.exports = model
