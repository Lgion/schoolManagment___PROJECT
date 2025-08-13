const fs = require('fs')
const { createEntry } = require('./entryController')

// import fs from 'fs'
// import {schema as schemaTeacher} from '../models/Teacher'
// import {schema as schemaEleve} from '../models/Eleve'
// import {schema as schemaClasse} from '../models/Classe'

import { modelProfs, modelEleves, modelClasses } from '../models/School'
let { schema: schemaTeacher } = modelProfs
let { schema: schemaEleve } = modelEleves
let { schema: schemaClasse } = modelClasses

// const Donation = require('../models/Donation')
// const Classe = require('../models/Classe')
// const Eleve = require('../models/Eleve')
// const Teacher = require('../models/Teacher')
// const Reservation = require('../models/Reservation')




export function getModels(req, res, next) {
  // console.log(Eleve.schema.paths);
  // return Eleve.schema.paths
  console.log({schemaEleve});
  
  res.status(200).json({ schemaEleve, schemaTeacher, schemaClasse })
  // return {"ok":"ok"}
}




export const createSchool = (req, res, next) => {

  const modelKeyRelationsObject = {
    student: modelEleves
    , teacher: modelProfs
    , classe: modelClasses
  }
  , modelKey = req.body.modelKey
  console.log("ecole controller");
  console.log(typeof req.body);
  console.log(req.body);
  console.log(modelKey);
  console.log(modelKeyRelationsObject[modelKey]);
  // console.log(fs);
  createEntry(req, res, next, modelKeyRelationsObject[modelKey])

}