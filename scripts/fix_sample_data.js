const fs = require('fs');
const path = require('path');

const sampleDir = path.join(__dirname, '../public/sample');
const classesPath = path.join(sampleDir, 'classes.json');
const teachersPath = path.join(sampleDir, 'teachers.json');
const studentsPath = path.join(sampleDir, 'students.json');

console.log("Lecture des fichiers JSON...");
const classes = JSON.parse(fs.readFileSync(classesPath, 'utf8'));
const teachers = JSON.parse(fs.readFileSync(teachersPath, 'utf8'));
const students = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));

console.log("1. Fix liaison Professeurs <-> Classes");
// Synchronisation bidirectionnelle
const classMap = new Map(classes.map(c => [c._id, c]));
const teacherMap = new Map(teachers.map(t => [t._id, t]));

// 1a. Assigner prof -> classe (si manquant dans la classe)
teachers.forEach(teacher => {
  if (Array.isArray(teacher.current_classes)) {
    teacher.current_classes.forEach(classId => {
      const cls = classMap.get(classId);
      if (cls) {
        if (!cls.professeur) cls.professeur = [];
        if (!Array.isArray(cls.professeur)) cls.professeur = [cls.professeur];
        
        if (!cls.professeur.includes(teacher._id)) {
          cls.professeur.push(teacher._id);
        }
      }
    });
  }
});

// 1b. Assigner classe -> prof (si manquant dans le prof)
classes.forEach(cls => {
  if (Array.isArray(cls.professeur)) {
    cls.professeur.forEach(teacherId => {
      const teacher = teacherMap.get(teacherId);
      if (teacher) {
        if (!teacher.current_classes) teacher.current_classes = [];
        if (!teacher.current_classes.includes(cls._id)) {
          teacher.current_classes.push(cls._id);
        }
      }
    });
  }
});

console.log("2. Fix emails des professeurs");
teachers.forEach(teacher => {
  if (!teacher['email_$_email']) {
    const nom = teacher.nom ? teacher.nom.toLowerCase().replace(/[^a-z0-9]/g, '') : 'prof';
    const prenom = (teacher.prenoms && teacher.prenoms[0]) ? teacher.prenoms[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'test';
    teacher['email_$_email'] = `${prenom}.${nom}@ecole.fr`;
  }
});

console.log("3. Ajout de notes réalistes au 2ème trimestre pour les élèves");
const currentYear = "2024-2025";
const matieresList = ["Mathématiques", "Français", "Histoire-Géo", "Anglais", "SVT"];

students.forEach(student => {
  if (!student.compositions) {
    student.compositions = {};
  }
  
  if (!student.compositions[currentYear]) {
    student.compositions[currentYear] = [{}, {}, {}];
  } else {
    // S'assurer qu'il y a bien 3 trimestres
    while (student.compositions[currentYear].length < 3) {
      student.compositions[currentYear].push({});
    }
  }

  // Trimestre 2 (Index 1)
  const trim2 = student.compositions[currentYear][1] || {};
  if (!trim2.officiel) {
    trim2.officiel = {};
  }
  
  // Ajouter une évaluation au 2ème trimestre si vide ou avec peu de notes
  const timestampEval = new Date('2025-02-15T10:00:00Z').getTime().toString();
  if (!trim2.officiel[timestampEval]) {
    trim2.officiel[timestampEval] = {};
    
    // Assigner des notes aléatoires réalistes pour chaque matière
    matieresList.forEach(mat => {
      // Note entre 8 et 18
      const note = Math.round((8 + Math.random() * 10) * 4) / 4; 
      trim2.officiel[timestampEval][mat] = { note: note, sur: 20 };
    });
  }
  
  // Mettre à jour
  student.compositions[currentYear][1] = trim2;
});

console.log("Sauvegarde des fichiers JSON corrigés...");
fs.writeFileSync(classesPath, JSON.stringify(classes, null, 2));
fs.writeFileSync(teachersPath, JSON.stringify(teachers, null, 2));
fs.writeFileSync(studentsPath, JSON.stringify(students, null, 2));

console.log("Terminé avec succès !");
