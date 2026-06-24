const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Institution = require('./app/api/_/models/ai/Institution');
    const SchoolSettings = require('./app/api/_/models/ai/SchoolSettings');
    const Classe = require('./app/api/_/models/ai/Classe');
    const Eleve = require('./app/api/_/models/ai/Eleve');
    const Teacher = require('./app/api/_/models/ai/Teacher');
    const Post = require('./app/api/_/models/ai/Post');
    const Group = require('./app/api/_/models/ai/Group');
    const GroupMessage = require('./app/api/_/models/ai/GroupMessage');
    const Schedule = require('./app/api/_/models/ai/Schedule');

    const generateRealisticNotes = () => {
      const trimesters = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
      const notes = {};
      trimesters.forEach(trim => {
        notes[trim] = [
          { matiere: "Mathématiques", coef: "2", devoir: "Évaluation", note: (Math.random() * 8 + 12).toFixed(1) },
          { matiere: "Mathématiques", coef: "1", devoir: "DM", note: (Math.random() * 10 + 10).toFixed(1) },
          { matiere: "Français", coef: "2", devoir: "Dictée", note: (Math.random() * 9 + 11).toFixed(1) },
          { matiere: "Histoire/Géo", coef: "1", devoir: "Exposé", note: (Math.random() * 6 + 14).toFixed(1) }
        ];
      });
      return notes;
    };

    const getRandomDateInYear = (yearStr) => {
      const startYear = parseInt(yearStr.split('-')[0]);
      const start = new Date(startYear, 8, 1);
      const end = new Date(startYear + 1, 5, 30);
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    };

    const userId = 'admin_demo_id';
    const schoolKey = 'demo_master';

    // 1. PURGE
    const models = [Institution, SchoolSettings, Classe, Eleve, Teacher, Post, Group, GroupMessage, Schedule];
    for (const model of models) {
      if (model) await model.deleteMany({ schoolKey });
    }

    // 2. INSTITUTION & SETTINGS
    const inst = new Institution({ schoolKey, name: "École Primaire d'Excellence", isReal: false, ownerClerkId: userId });
    await inst.save();

    const settings = new SchoolSettings({
      schoolKey,
      feeDefinitions: [{ id: 'scol', label: 'Scolarité', unit: '€', targets: [{ key: 'all', label: 'Base', amount: 350 }] }],
      targets: [{ key: 'all', options: ['Base'] }],
      homepage: { title: `🏫 Démo Complète - ESMP`, texts: ["Explorez cette démo avec 6 ans d'historique."], photo: '/school/classe.webp' }
    });
    await settings.save();

    // 3. GENERATION
    const timeline = [
      { year: '2020-2021', niveau: 'CP1', alias: 'A' },
      { year: '2021-2022', niveau: 'CP2', alias: 'A' },
      { year: '2022-2023', niveau: 'CE1', alias: 'A' },
      { year: '2023-2024', niveau: 'CE2', alias: 'A' },
      { year: '2024-2025', niveau: 'CM1', alias: 'A' },
      { year: '2025-2026', niveau: 'CM2', alias: 'A' },
    ];

    const teacher1 = new Teacher({
      schoolKey, nom: 'Martin', prenoms: ['Jean'], sexe: 'M', naissance_$_date: new Date('1980-01-01').getTime(),
      adresse_$_map: 'Paris', phone_$_tel: '+33600000001', email_$_email: 'jean.martin@ecole.fr', photo_$_file: '/school/prof.webp',
      current_classes: []
    });
    const teacher2 = new Teacher({
      schoolKey, nom: 'Dubois', prenoms: ['Marie'], sexe: 'F', naissance_$_date: new Date('1985-01-01').getTime(),
      adresse_$_map: 'Lyon', phone_$_tel: '+33600000002', email_$_email: 'marie.dubois@ecole.fr', photo_$_file: '/school/prof.webp',
      current_classes: []
    });
    await teacher1.save();
    await teacher2.save();

    const noms = ['Lefebvre', 'Bernard', 'Durand', 'Petit', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Michel', 'Garcia', 'David', 'Roux', 'Vincent', 'Garnier'];
    const prenomsGars = ['Lucas', 'Hugo', 'Arthur', 'Louis', 'Raphaël', 'Jules', 'Maël'];
    const prenomsFilles = ['Emma', 'Jade', 'Louise', 'Alice', 'Chloé', 'Lina', 'Léa'];

    let studentsData = [];
    for (let i = 0; i < 14; i++) {
      const isBoy = i % 2 === 0;
      studentsData.push({
        _id: null,
        nom: noms[i],
        prenoms: [isBoy ? prenomsGars[i % prenomsGars.length] : prenomsFilles[i % prenomsFilles.length]],
        sexe: isBoy ? 'M' : 'F',
        naissance_$_date: `12/04/2014`,
        joinYearIndex: i < 11 ? 0 : (i === 11 ? 2 : (i === 12 ? 3 : 4)),
        eleveDoc: null,
      });
    }

    const classesDocs = [];

    for (let y = 0; y < timeline.length; y++) {
      const { year, niveau, alias } = timeline[y];
      const isTeacher1 = y < 4;
      const activeTeacherId = isTeacher1 ? teacher1._id : teacher2._id;
      const teacherName = isTeacher1 ? 'M. Martin' : 'Mme Dubois';

      const currentClasse = new Classe({
        schoolKey, annee: year, niveau, alias, photo: '/school/classe.webp', moyenne_trimetriel: ["", "", ""],
        professeur: [activeTeacherId],
        eleves: []
      });
      await currentClasse.save();
      classesDocs.push(currentClasse);

      if (isTeacher1) teacher1.current_classes.push(currentClasse._id);
      else teacher2.current_classes.push(currentClasse._id);

      for (const sData of studentsData) {
        if (y >= sData.joinYearIndex) {
          if (!sData.eleveDoc) {
            const eleve = new Eleve({
              schoolKey,
              nom: sData.nom, prenoms: sData.prenoms, sexe: sData.sexe,
              naissance_$_date: sData.naissance_$_date, adresse_$_map: '123 Rue de la République',
              parents: { mere: `Mme ${sData.nom}`, pere: `M. ${sData.nom}`, phone: '+33612345678', email: 'parent@mail.com' },
              scolarity_fees_$_checkbox: {}, school_history: {}, bolobi_class_history_$_ref_µ_classes: {},
              notes: {}, absences: [], bonus: [], compositions: {}
            });
            sData.eleveDoc = eleve;
          }

          const eleve = sData.eleveDoc;
          eleve.current_classe = currentClasse._id;
          eleve.scolarity_fees_$_checkbox[year] = true;
          eleve.school_history[year] = inst.name;
          eleve.bolobi_class_history_$_ref_µ_classes[year] = currentClasse._id.toString();
          eleve.notes[year] = generateRealisticNotes();
          eleve.compositions[year] = true;

          if (Math.random() > 0.5) {
            eleve.absences.push({ date: getRandomDateInYear(year).getTime(), motif: 'Maladie', isJustified: true });
          }

          currentClasse.eleves.push(eleve._id);
        }
      }

      await currentClasse.save();

      const schedule = new Schedule({
        schoolKey, classeId: currentClasse._id, createdBy: userId,
        events: [
          { dayOfWeek: 1, startTime: "08:30", endTime: "10:30", type: "CUSTOM_EVENT", label: "Mathématiques", teacherId: activeTeacherId.toString() },
          { dayOfWeek: 2, startTime: "10:30", endTime: "12:00", type: "CUSTOM_EVENT", label: "Français", teacherId: activeTeacherId.toString() },
          { dayOfWeek: 4, startTime: "14:00", endTime: "16:00", type: "CUSTOM_EVENT", label: "Histoire/Géo", teacherId: activeTeacherId.toString() }
        ]
      });
      await schedule.save();

      await Post.create([
        { schoolKey, classId: currentClasse._id, isGlobal: false, authorId: activeTeacherId.toString(), authorName: teacherName, content: `Bienvenue à tous dans cette nouvelle année de ${niveau} !`, createdAt: getRandomDateInYear(year) },
        { schoolKey, classId: currentClasse._id, isGlobal: false, authorId: activeTeacherId.toString(), authorName: teacherName, content: `N'oubliez pas l'évaluation de fin de trimestre la semaine prochaine. Pensez à réviser.`, createdAt: getRandomDateInYear(year) }
      ]);

      const group = new Group({
        schoolKey, creatorId: activeTeacherId.toString(), name: `Parents & Profs - ${niveau} ${alias} (${year})`,
        members: [{ userId: activeTeacherId.toString(), role: 'ADMIN', userType: 'TEACHER' }, { userId: 'parent_demo_id', role: 'MEMBER', userType: 'PARENT' }],
        invitationCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      });
      await group.save();

      await GroupMessage.create([
        { schoolKey, groupId: group._id, senderId: activeTeacherId.toString(), senderName: teacherName, content: "Bonjour à tous, voici le groupe de la classe pour cette année.", createdAt: getRandomDateInYear(year) },
        { schoolKey, groupId: group._id, senderId: 'parent_demo_id', senderName: 'Parent Délégué', content: "Merci ! Hâte de commencer cette nouvelle année.", createdAt: getRandomDateInYear(year) },
        { schoolKey, groupId: group._id, senderId: activeTeacherId.toString(), senderName: teacherName, content: "La liste des fournitures a été mise à jour.", createdAt: getRandomDateInYear(year) }
      ]);
    }

    for (const sData of studentsData) {
      if (sData.eleveDoc) await sData.eleveDoc.save();
    }

    await teacher1.save();
    await teacher2.save();

    await Post.create([
      { schoolKey, isGlobal: true, authorId: userId, authorName: 'La Direction', content: "🎉 **Fête de fin d'année !**\nVenez nombreux célébrer avec nous les réussites de nos élèves. La kermesse aura lieu dans la cour principale.", createdAt: new Date(Date.now() - 86400000 * 2) },
      { schoolKey, isGlobal: true, authorId: userId, authorName: 'La Direction', content: "📸 **Photos de classe**\nLes photos seront prises la semaine prochaine. Pensez à ramener les autorisations signées.", createdAt: new Date(Date.now() - 86400000 * 10) },
      { schoolKey, isGlobal: true, authorId: teacher2._id.toString(), authorName: 'Mme Dubois', content: "🚀 **Bienvenue sur la plateforme !**\nNaviguez librement pour découvrir les fonctionnalités.", mediaUrls: ['/school/classe.webp'], createdAt: new Date() }
    ]);

    console.log("SEVERAL YEARS OF DATA GENERATED FOR demo_master");

  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
