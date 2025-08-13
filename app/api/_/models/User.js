const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true }
  , username: { type: String, required: true }
  , password: { type: String, required: true }
  , role: { type: String, required: true }
  , liked: { type: Array, required: true }
  , options: { 
      adress: {type: String, required: false} 
      , age: {type: Number, required: false} 
      
    }
})

userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)
