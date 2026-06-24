import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
import Institution from '../../_/models/ai/Institution';
import SchoolSettings from '../../_/models/ai/SchoolSettings';
import Classe from '../../_/models/ai/Classe';
import Eleve from '../../_/models/ai/Eleve';
import Teacher from '../../_/models/ai/Teacher';

export async function POST(request) {
  try {
    const { name, type } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Le nom de l\'école est requis' }, { status: 400 });
    }

    const schoolType = type || 'classique';
    await dbConnect();

    // 1. Générer une clé unique sandbox_xxxxxx
    const randId = Math.random().toString(36).substring(2, 8);
    const schoolKey = `sandbox_${randId}`;

    let schoolName = name;
    let seededClasses = [];
    let seededStudents = [];
    let seededTeacher = null;
    let homepageTitle = name;
    let homepageTexts = [];
    let homepagePhoto = '/ecole_testes/photo.jpg';

    // 2. Définir les templates de seeding
    if (schoolType === 'magique') {
      schoolName = `Académie de Magie ${name}`;
      homepageTitle = `🧙‍♂️ ${schoolName}`;
      homepageTexts = [
        "Bienvenue dans votre prestigieux établissement de sorcellerie !",
        "Ici, la gestion des cours de potion, de défense contre les forces du mal et de quidditch se fait en un clin d'œil.",
        "Utilisez le sélecteur de rôles flottant en bas à droite pour explorer l'espace en tant que Directeur (Admin), Professeur (McGonagall) ou élève (Harry Potter) !"
      ];
      homepagePhoto = '/school/classe.webp';

      seededClasses = [
        { niveau: 'Magie 1', alias: 'Gryffondor', annee: '2026-2027' },
        { niveau: 'Magie 2', alias: 'Serpentard', annee: '2026-2027' }
      ];

      seededTeacher = {
        nom: 'McGonagall',
        prenoms: ['Minerva'],
        sexe: 'F',
        naissance_$_date: new Date('1935-10-04').getTime(),
        adresse_$_map: 'Château de Poudlard, Écosse',
        phone_$_tel: '+33609080706',
        email_$_email: 'minerva@hogwarts.uk',
        photo_$_file: '/school/prof.webp'
      };

      seededStudents = [
        {
          nom: 'Potter',
          prenoms: ['Harry'],
          sexe: 'M',
          naissance_$_date: '31/07/2012',
          adresse_$_map: '4 Privet Drive, Little Whinging',
          parents: { mere: 'Lily Potter', pere: 'James Potter', phone: '+33600000001', email: 'lily@potter.com' },
          classIndex: 0
        },
        {
          nom: 'Granger',
          prenoms: ['Hermione'],
          sexe: 'F',
          naissance_$_date: '19/09/2012',
          adresse_$_map: 'Londres, Angleterre',
          parents: { mere: 'Mme Granger', pere: 'M. Granger', phone: '+33600000002', email: 'grangers@dentists.com' },
          classIndex: 0
        },
        {
          nom: 'Malefoy',
          prenoms: ['Drago'],
          sexe: 'M',
          naissance_$_date: '05/06/2012',
          adresse_$_map: 'Manoir Malefoy, Wiltshire',
          parents: { mere: 'Narcissa Malefoy', pere: 'Lucius Malefoy', phone: '+33600000003', email: 'lucius@malfoy.com' },
          classIndex: 1
        }
      ];

    } else if (schoolType === 'scientifique') {
      schoolName = `Institut des Sciences ${name}`;
      homepageTitle = `⚛️ ${schoolName}`;
      homepageTexts = [
        "Bienvenue dans l'établissement des esprits les plus brillants !",
        "Suivez les travaux pratiques, les formules de physiques et les algorithmes informatiques de vos génies en herbe.",
        "Le sélecteur de rôles vous permet d'analyser l'application à travers le regard de Marie Curie ou d'Albert Einstein."
      ];
      homepagePhoto = '/school/classe.webp';

      seededClasses = [
        { niveau: 'Physique', alias: 'Newton', annee: '2026-2027' },
        { niveau: 'Informatique', alias: 'Turing', annee: '2026-2027' }
      ];

      seededTeacher = {
        nom: 'Curie',
        prenoms: ['Marie'],
        sexe: 'F',
        naissance_$_date: new Date('1867-11-07').getTime(),
        adresse_$_map: 'Laboratoire de Physique, Paris',
        phone_$_tel: '+33699887766',
        email_$_email: 'marie.curie@radium.org',
        photo_$_file: '/school/prof.webp'
      };

      seededStudents = [
        {
          nom: 'Einstein',
          prenoms: ['Albert'],
          sexe: 'M',
          naissance_$_date: '14/03/2015',
          adresse_$_map: 'Ulm, Allemagne',
          parents: { mere: 'Pauline Einstein', pere: 'Hermann Einstein', phone: '+33644444444', email: 'einstein@relativity.org' },
          classIndex: 0
        },
        {
          nom: 'Lovelace',
          prenoms: ['Ada'],
          sexe: 'F',
          naissance_$_date: '10/12/2016',
          adresse_$_map: 'Londres, Royaume-Uni',
          parents: { mere: 'Lady Byron', pere: 'Lord Byron', phone: '+33655555555', email: 'lovelace@computing.org' },
          classIndex: 1
        }
      ];

    } else {
      // Classique
      schoolName = `École Primaire ${name}`;
      homepageTitle = `🏫 ${schoolName}`;
      homepageTexts = [
        "Bienvenue sur la plateforme de gestion scolaire simplifiée.",
        "Nous réinventons le suivi de la vie scolaire au primaire : pas de fioriture, une interface moderne et fluide.",
        "Explorez dès maintenant les dossiers élèves, les absences, le tableau d'affichage et les paiements scolaires."
      ];
      homepagePhoto = '/school/classe.webp';

      seededClasses = [
        { niveau: 'CP', alias: 'Classe A', annee: '2026-2027' },
        { niveau: 'CE1', alias: 'Classe B', annee: '2026-2027' }
      ];

      seededTeacher = {
        nom: 'Martin',
        prenoms: ['Jean-Michel'],
        sexe: 'M',
        naissance_$_date: new Date('1980-05-15').getTime(),
        adresse_$_map: '12 Rue des Écoles, Paris',
        phone_$_tel: '+33611223344',
        email_$_email: 'jm.martin@education.fr',
        photo_$_file: '/school/prof.webp'
      };

      seededStudents = [
        {
          nom: 'Dubois',
          prenoms: ['Lucas'],
          sexe: 'M',
          naissance_$_date: '12/04/2020',
          adresse_$_map: '15 Avenue de la Gare, Paris',
          parents: { mere: 'Sophie Dubois', pere: 'Pierre Dubois', phone: '+33677889900', email: 'dubois@family.com' },
          classIndex: 0
        },
        {
          nom: 'Bernard',
          prenoms: ['Emma'],
          sexe: 'F',
          naissance_$_date: '25/08/2019',
          adresse_$_map: '4 Boulevard Victor Hugo, Paris',
          parents: { mere: 'Julie Bernard', pere: 'Marc Bernard', phone: '+33688990011', email: 'bernard@family.com' },
          classIndex: 1
        }
      ];
    }

    // 3. Créer l'Institution
    const inst = new Institution({
      schoolKey,
      name: schoolName,
      logo: '/school/logo.webp',
      ownerClerkId: null, // Sera lié lors de la conversion d'inscription
      isReal: false
    });
    await inst.save();

    // 4. Créer les Paramètres de l'école (SchoolSettings)
    const settings = new SchoolSettings({
      schoolKey,
      feeDefinitions: [
        {
          id: 'scol_cash',
          label: 'Frais Scolaires',
          unit: '€',
          targets: [
            { key: 'interne', label: 'Tarif Pensionnaire', amount: 450 },
            { key: 'externe', label: 'Tarif Externe', amount: 150 }
          ]
        },
        {
          id: 'cantine',
          label: 'Cantine Mensuelle',
          unit: '€',
          targets: [
            { key: 'cantine_midi', label: 'Repas du Midi', amount: 80 }
          ]
        }
      ],
      targets: [
        {
          key: 'isInterne',
          options: ['Pensionnaire', 'Externe']
        },
        {
          key: 'doCantinePlan',
          options: ['Inscrit', 'Non-inscrit']
        }
      ],
      homepage: {
        title: homepageTitle,
        texts: homepageTexts,
        photo: homepagePhoto
      }
    });
    await settings.save();

    // 5. Créer les Classes
    const createdClasses = [];
    for (const clData of seededClasses) {
      const cl = new Classe({
        schoolKey,
        annee: clData.annee,
        niveau: clData.niveau,
        alias: clData.alias,
        photo: '/school/classe.webp',
        moyenne_trimetriel: ["", "", ""]
      });
      await cl.save();
      createdClasses.push(cl);
    }

    // 6. Créer l'Enseignant et le lier aux classes
    const classIds = createdClasses.map(c => c._id);
    const teacher = new Teacher({
      schoolKey,
      ...seededTeacher,
      current_classes: classIds
    });
    await teacher.save();

    // Lier l'enseignant aux classes créées (Mongoose post-save le fait aussi mais on le sécurise)
    for (const cl of createdClasses) {
      cl.professeur = [teacher._id];
      await cl.save();
    }

    // 7. Créer les Élèves
    const currentSchoolYear = '2026-2027';
    for (const stData of seededStudents) {
      const matchedClass = createdClasses[stData.classIndex];
      const student = new Eleve({
        schoolKey,
        current_classe: matchedClass._id,
        nom: stData.nom,
        prenoms: stData.prenoms,
        sexe: stData.sexe,
        naissance_$_date: stData.naissance_$_date,
        adresse_$_map: stData.adresse_$_map,
        parents: stData.parents,
        scolarity_fees_$_checkbox: { [currentSchoolYear]: false },
        bolobi_class_history_$_ref_µ_classes: { [currentSchoolYear]: matchedClass._id.toString() },
        school_history: { [currentSchoolYear]: schoolName },
        absences: [],
        notes: { [currentSchoolYear]: {} },
        compositions: { [currentSchoolYear]: false },
        bonus: [],
        manus: [],
        commentaires: [],
        documents: []
      });
      await student.save();

      // Ajouter l'élève dans la liste de la classe
      matchedClass.eleves.push(student._id);
      await matchedClass.save();
    }

    // 8. Définir les cookies d'activation côté client dans la réponse
    const response = NextResponse.json({
      success: true,
      schoolKey,
      name: schoolName,
      message: 'Sandbox créée et peuplée avec succès.'
    });

    response.cookies.set('x-school-key', schoolKey, { path: '/', maxAge: 86400 });
    response.cookies.set('is_landing_demo', 'true', { path: '/', maxAge: 86400 });
    response.cookies.set('force_falsy', 'true', { path: '/', maxAge: 86400 });
    response.cookies.set('mock_role', 'admin', { path: '/', maxAge: 86400 });

    return response;

  } catch (err) {
    console.error('❌ Failed to create sandbox:', err);
    return NextResponse.json({ error: 'Erreur lors de la création du bac à sable', details: err.message }, { status: 500 });
  }
}
