import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
import { requireAuth } from '../../lib/authWithFallback';

import Institution from '../../_/models/ai/Institution';
import SchoolSettings from '../../_/models/ai/SchoolSettings';
import Classe from '../../_/models/ai/Classe';
import Eleve from '../../_/models/ai/Eleve';
import Teacher from '../../_/models/ai/Teacher';
import Post from '../../_/models/ai/Post';
import Group from '../../_/models/ai/Group';
import GroupMessage from '../../_/models/ai/GroupMessage';
import Schedule from '../../_/models/ai/Schedule';
import User from '../../_/models/ai/User';
import ReportCard from '../../_/models/ai/ReportCard';
import AttendanceRecord from '../../_/models/ai/AttendanceRecord';
import AttendanceEntry from '../../_/models/ai/AttendanceEntry';
import PointTransaction from '../../_/models/ai/PointTransaction';
import PointLabel from '../../_/models/ai/PointLabel';
import Subject from '../../_/models/ai/Subject';
import Event from '../../_/models/ai/Event';
import Article from '../../_/models/ai/Article';

import { seedSubjects, generateStudentNotes, generateReportCardsForYear, getCoefficientsForNiveau, convertNotesToCompositions } from './lib/academicSeeder';
import { generateAttendanceForClassYear } from './lib/attendanceSeeder';
import { seedPointLabels, generateBehaviorAndAdminForClassYear } from './lib/behaviorSeeder';
import { generateScheduleForClass } from './lib/scheduleSeeder';
import { generateSocialForClassYear, generateGlobalSocialData } from './lib/socialSeeder';
import { generateFinancialsForClassYear } from './lib/financialSeeder';
import { generateEvents } from './lib/eventSeeder';
import { generateBlogAndPosts } from './lib/blogSeeder';
import { generateGroupsAndMessages } from './lib/groupSeeder';

const getRandomDateInYear = (yearStr) => {
  const startYear = parseInt(yearStr.split('-')[0]);
  const start = new Date(startYear, 8, 1); // Septembre
  const end = new Date(startYear + 1, 5, 30); // Juin
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export async function POST(request) {
  try {
    const userId = await requireAuth(request, 'POST /api/admin/reset-demo');
    if (userId instanceof NextResponse) return userId;

    await dbConnect();

    const schoolKey = 'demo_master';

    // 1. PURGE
    const models = [Institution, SchoolSettings, Classe, Eleve, Teacher, Post, Group, GroupMessage, Schedule, ReportCard, AttendanceRecord, AttendanceEntry, PointTransaction, PointLabel, Subject, Event, Article];
    for (const model of models) {
      if (model) await model.deleteMany({ schoolKey });
    }

    // 2. INSTITUTION & SETTINGS
    const inst = new Institution({ schoolKey, name: "École Primaire d'Excellence", isReal: false, ownerClerkId: userId });
    await inst.save();

    const settings = new SchoolSettings({
      schoolKey,
      feeDefinitions: [
        { id: 'scol', label: 'Scolarité', unit: '€', targets: [{ key: 'all', label: 'Base', amount: 350 }] },
        { id: 'cantine', label: 'Cantine', unit: '€', targets: [
          { key: 'doRegime', label: 'Demi-pensionnaire', amount: 120 },
          { key: 'doRegime', label: 'Externe', amount: 0 }
        ]},
        { id: 'transport', label: 'Transport', unit: '€', targets: [
          { key: 'doTransport', label: 'Zone A', amount: 80 },
          { key: 'doTransport', label: 'Zone B', amount: 120 },
          { key: 'doTransport', label: 'Pas de transport', amount: 0 }
        ]}
      ],
      targets: [
        { key: 'all', options: ['Base'] },
        { key: 'doRegime', options: ['Demi-pensionnaire', 'Externe'] },
        { key: 'doTransport', options: ['Zone A', 'Zone B', 'Pas de transport'] }
      ],
      homepage: { title: `🏫 Démo Complète - ESMP`, texts: ["Explorez cette démo avec 6 ans d'historique (Notes, Appels, Paiements...)."], photo: '/school/classe.webp' }
    });
    await settings.save();

    // 3. INITIALISATION DE LA DONNÉE GLOBALE
    const subjects = await seedSubjects(schoolKey);
    const pointLabels = await seedPointLabels(schoolKey);

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
        profileType: i % 3 === 0 ? 'EXCELLENT' : (i % 3 === 1 ? 'MOYEN' : 'DIFFICULTES'),
        eleveDoc: null,
      });
    }

    const classesDocs = [];
    for (let c = 0; c < timeline.length; c++) {
      const { niveau, alias } = timeline[c];
      const isTeacher1 = c < 4;
      const activeTeacherId = isTeacher1 ? teacher1._id : teacher2._id;
      const currentClasse = new Classe({
        schoolKey, annee: timeline[0].year, niveau, alias, photo: '/school/classe.webp', moyenne_trimetriel: ["", "", ""],
        professeur: [activeTeacherId], eleves: [], history: [], createdAt: (+new Date()).toString(),
        coefficients: getCoefficientsForNiveau(niveau, subjects)
      });
      await currentClasse.save();
      classesDocs.push(currentClasse);
    }

    // 4. BOUCLE TEMPORELLE (Génération de la profondeur)
    for (let y = 0; y < timeline.length; y++) {
      const { year } = timeline[y];
      const activeClassIndex = y;

      for (let c = 0; c < classesDocs.length; c++) {
        const classe = classesDocs[c];
        
        // Enregistrer l'historique de l'année précédente avant de réinitialiser la classe pour la nouvelle année
        if (classe.annee && classe.annee !== year) {
          const snapshot = {
            annee: classe.annee,
            professeur: [...classe.professeur],
            eleves: [...classe.eleves],
            coefficients: { ...classe.coefficients }
          };
          if (!classe.history) classe.history = [];
          if (!classe.history.some(h => h.annee === snapshot.annee)) {
            classe.history.push(snapshot);
          }
        }

        classe.annee = year;
        classe.eleves = [];
        const isT1 = c < 4;
        classe.professeur = [isT1 ? teacher1._id : teacher2._id];
      }

      const currentClasse = classesDocs[activeClassIndex];
      const isTeacher1 = activeClassIndex < 4;
      const activeTeacherId = isTeacher1 ? teacher1._id : teacher2._id;
      const teacherName = isTeacher1 ? 'M. Martin' : 'Mme Dubois';

      if (isTeacher1 && !teacher1.current_classes.includes(currentClasse._id)) teacher1.current_classes.push(currentClasse._id);
      if (!isTeacher1 && !teacher2.current_classes.includes(currentClasse._id)) teacher2.current_classes.push(currentClasse._id);

      // Traitement des élèves
      const activeStudentsDocs = [];
      for (const sData of studentsData) {
        if (y >= sData.joinYearIndex) {
          if (!sData.eleveDoc) {
            sData.eleveDoc = new Eleve({
              schoolKey, nom: sData.nom, prenoms: sData.prenoms, sexe: sData.sexe,
              naissance_$_date: sData.naissance_$_date, adresse_$_map: '123 Rue de la République',
              parents: { mere: `Mme ${sData.nom}`, pere: `M. ${sData.nom}`, phone: '+33612345678', email: 'parent@mail.com' },
              scolarity_fees_$_checkbox: {}, school_history: {}, bolobi_class_history_$_ref_µ_classes: {},
              notes: {}, compositions: {}, absences: [], bonus: [], manus: [], commentaires: [], targetsList: {
                all: ['Base'],
                doRegime: Math.random() > 0.5 ? 'Demi-pensionnaire' : 'Externe',
                doTransport: Math.random() > 0.6 ? 'Zone A' : (Math.random() > 0.5 ? 'Zone B' : 'Pas de transport')
              }
            });
          }

          const eleve = sData.eleveDoc;
          eleve.current_classe = currentClasse._id;
          eleve.school_history[year] = inst.name;
          eleve.bolobi_class_history_$_ref_µ_classes[year] = currentClasse._id.toString();
          
          // Générer les notes au format brut (nécessaires pour le calcul des bulletins ReportCards)
          const rawNotes = generateStudentNotes(currentClasse.niveau, subjects, sData.profileType);
          if (!eleve.notes) eleve.notes = {};
          eleve.notes[year] = rawNotes;
          
          // Convertir et renseigner les compositions au format moderne pour l'affichage
          eleve.compositions[year] = convertNotesToCompositions(rawNotes, year);

          currentClasse.eleves.push(eleve._id);
          activeStudentsDocs.push(eleve);
        }
      }

      for (const classe of classesDocs) await classe.save();

      // --- DÉLÉGATION DE LA GÉNÉRATION PROFONDE ---
      await generateScheduleForClass(currentClasse, subjects, schoolKey, activeTeacherId, userId, year);
      await generateAttendanceForClassYear(currentClasse, activeStudentsDocs, year, schoolKey, activeTeacherId);
      await generateBehaviorAndAdminForClassYear(currentClasse, activeStudentsDocs, year, schoolKey, activeTeacherId, pointLabels, getRandomDateInYear);
      await generateSocialForClassYear(currentClasse, year, schoolKey, activeTeacherId, teacherName, getRandomDateInYear);
      await generateReportCardsForYear(currentClasse, activeStudentsDocs, year, schoolKey);

      // Bilan Trimestriel du professeur pour la classe
      if (!currentClasse.reports) currentClasse.reports = [];
      const reportDate = getRandomDateInYear(year);
      currentClasse.reports.push({
          period: "Trimestre 1",
          content: `Un premier trimestre encourageant pour cette classe de ${currentClasse.niveau}.`,
          date: reportDate,
          createdAt: reportDate
      });
      await currentClasse.save();

      // --- NOUVEAUX SEEDERS (Finances, Evènements, Blog, Groupes) ---
      await generateFinancialsForClassYear(currentClasse, activeStudentsDocs, year, getRandomDateInYear);
      for (const eleve of activeStudentsDocs) {
        eleve.markModified('school_history');
        eleve.markModified('bolobi_class_history_$_ref_µ_classes');
        eleve.markModified('notes');
        eleve.markModified('compositions');
        eleve.markModified('scolarity_fees_$_checkbox');
        await eleve.save();
      }

      const adminId = userId;
      await generateEvents(Event, schoolKey, [teacher1, teacher2], [currentClasse], getRandomDateInYear, year);
      await generateBlogAndPosts(Article, Post, schoolKey, adminId, getRandomDateInYear, year);
      await generateGroupsAndMessages(Group, GroupMessage, schoolKey, adminId, [teacher1, teacher2], activeStudentsDocs, getRandomDateInYear, year);

      // --- ARCHIVAGE ---
      if (y < timeline.length - 1) {
        for (const classe of classesDocs) {
          const snapshot = {
            annee: classe.annee,
            eleves: (classe.eleves || []).map(id => id.toString()),
            professeur: (classe.professeur || []).map(id => id.toString()),
            homework: classe.homework || {},
            compositions: [...(classe.compositions || [])],
            coefficients: classe.coefficients || {},
            moyenne_trimetriel: [...(classe.moyenne_trimetriel || ["", "", ""])],
            commentaires: [...(classe.commentaires || [])],
            schedules: [...(classe.schedules || [])],
            currentScheduleId: classe.currentScheduleId,
            createdAt: classe.createdAt,
            cloudinary: classe.cloudinary,
            reports: [...(classe.reports || [])],
            migratedAt: +new Date()
          };
          classe.history.push(snapshot);
          classe.markModified('history');
          await classe.save();
        }
      }
    }

    // Sauvegarde finale des élèves
    for (const sData of studentsData) {
      if (sData.eleveDoc) {
        sData.eleveDoc.markModified('school_history');
        sData.eleveDoc.markModified('bolobi_class_history_$_ref_µ_classes');
        sData.eleveDoc.markModified('notes');
        sData.eleveDoc.markModified('compositions');
        sData.eleveDoc.markModified('scolarity_fees_$_checkbox');
        await sData.eleveDoc.save();
      }
    }
    await teacher1.save();
    await teacher2.save();

    await generateGlobalSocialData(schoolKey, userId, getRandomDateInYear);

    return NextResponse.json({ success: true, message: 'Démo réinitialisée avec succès (Données profondes générées avec succès).' });

  } catch (err) {
    console.error('❌ Reset Demo Error:', err);
    return NextResponse.json({ error: 'Erreur lors de la réinitialisation' }, { status: 500 });
  }
}
