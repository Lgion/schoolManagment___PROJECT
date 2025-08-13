const mongoose = require('mongoose')




const donationSchema = mongoose.Schema({
  donation_type: { default:"0", type: Boolean },
  firstname: { default:"John", type: String, required: true },
  lastname: { default:"Smith", type: String, required: true },
  phone_number: { default:"+2250102030405", type: String, required: true },
  email: { default:"a@b.c", type: String, required: true },
  montant: { default:1, type: Number },
  nature: { default:"", type: String },
  nature_predefined: { default:"", type: String },

})

module.exports = mongoose.model('Donation_PDA', donationSchema)