import fs from 'fs'
import { join } from 'path'

// import {getEleveModel} from '../_/controllers/ecole'
// const Eleve = require('../_/models/Eleve').schema
import {schema as schemaTeacher} from '../_/models/Teacher'
import {schema as schemaEleve} from '../_/models/Eleve'
import {schema as schemaClasse} from '../_/models/Classe'
// const Reservation = require('../_/controllers/reservation')
// import {studentSchema} from '../_/models/Eleve'
// const Eleve = require()




const postsDirectory = join(process.cwd(), 'pages/api/lib/')

function getFile() {
    // return fs.readdirSync(postsDirectory)
    const fullPath = join(postsDirectory, `ecole.js`)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    return fileContents
}

export function getModels(){ 
    // "use server"
    // const e = getFile()


    // console.log("iiiiiiiiiiiiiiiiiiii");
    // console.log(e);
    // console.log(exp);
    // console.log(schema)
    // const a = schema.paths
    
    return JSON.stringify({schemaEleve: schemaEleve.paths, schemaTeacher: schemaTeacher.paths, schemaClasse: schemaClasse.paths})
    // return JSON.stringify({schemaEleve: schemaEleve.paths, schemaTeacher: schemaTeacher.paths})
    // return JSON.stringify({schemaEleve: schemaEleve.paths})
}