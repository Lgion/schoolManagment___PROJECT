const fs = require('fs')
// const { createEntry } = require('./entryController')
const Eleve = require('../models/Eleve')





export function getStudents(req, res, next) {
  Eleve.find().then(
    (eleves) => {
      res.status(200).json(eleves)
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      })
    }
  )
  
  
}
export function getTeachers(req, res, next) {

  
  
}


