import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: false },           // nom complet
  tel: { type: String, required: false },
  communaute: { type: String, required: false },
  // username: { type: String, required: true },
  // password: { type: String, required: true },
  // role: { type: String, required: true },
  // liked: { type: Array, required: true },
  options: {
    adress: { type: String, required: false },        // adresse postale
    ville: { type: String, required: false },
    // codePostal: { type: String, required: false },
    livraison: { type: String, required: false },     // mode de livraison
    paiement: { type: String, required: false },      // mode de paiement
    instructions: { type: String, required: false },  // instructions de livraison
    age: { type: Number, required: false }
  },
  commandes: {
    sanctuaire: [{ type: Object, required: false }], // historique réservations sanctuaire
    ecom: [{ type: Object, required: false }]        // historique commandes ecommerce
  }
});

userSchema.plugin(uniqueValidator);

export default mongoose.models.User_lpd || mongoose.model('User_lpd', userSchema);
