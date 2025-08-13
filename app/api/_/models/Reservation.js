const mongoose = require('mongoose')

const reservationSchema = mongoose.Schema({
  community: { default:"0", type: String, required: false},
  names: { default:"John smith", type: String, required: true },
  phone_number: { default:"+2250102030405", type: String, required: true },
  email: { default:"a@b.c", type: String, required: false },
  from: { default:1686007599860, type: Date, required: true },
  to: { default:1686007699860, type: Date, required: true },
  // sleep: { default:0, type: Number, required: true },
  participants: { default:1, type: Number, required: true },
  individual_room_participants: { type: Number, default: 0 },
  message: { default:"", type: String },
  contact: { type: String, default: "[]" },
  type_reservation: { type: String, enum: ['pray', 'retraite', 'individuel', 'celebration', 'repos', 'longTerm'], default: "pray" },
  meal_included: { type: Boolean, default: false },
  meal_plan: { type: Number, default: 0 },
  meals: { 
    breakfast: { type: String, default: "" },
    lunch: { type: String, default: "" },
    dinner: { type: String, default: "" }
  },
  // Nouveaux champs pour la gestion du paiement
  montant_total: { type: Number, required: true },
  montant_avance: { type: Number, required: true },
  avance_payee: { type: Boolean, default: false },
  isValidated: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
})

let modelReservation = !mongoose.modelNames().includes("Reservation_PDA")
  ? mongoose.model('Reservation_PDA', reservationSchema)
  : mongoose.model("Reservation_PDA")

module.exports = modelReservation