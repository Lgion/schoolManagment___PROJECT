const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker/locale/fr');

const MONGODB_URI = process.env.MONGODB_sample_URI;
const SAMPLE_DIR = path.join(process.cwd(), 'public', 'sample');
const SOURCE_DIR = path.join(process.cwd(), 'public', 'school');

const MODEL_CLASSE = 'ai_Ecole_St_Martin';
const MODEL_ELEVE = 'ai_Eleves_Ecole_St_Martin';
const MODEL_TEACHER = 'ai_Profs_Ecole_St_Martin';
const MODEL_USER = 'ai_Users_Ecole_St_Martin';
const MODEL_SETTINGS = 'SchoolSettings';
const MODEL_SUBJECT = 'Subject';
const MODEL_SCHEDULE = 'Schedule';

function getYearStr(yearOffset = 0) {
    const now = new Date();
    const start = now.getFullYear() + yearOffset;
    return `${start}-${start + 1}`;
}

const YEARS = [getYearStr(-2), getYearStr(-1), getYearStr(0)];
const NIVEAUX = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
const ALIASES = ['A', 'B'];

const SUBJECTS_DATA = [
    { nom: 'Mathématiques', code: 'MATH', couleur: '#e74c3c', niveaux: false, dureeDefaut: 60 },
    { nom: 'Français', code: 'FR', couleur: '#3498db', niveaux: false, dureeDefaut: 60 },
    { nom: 'Histoire-Géo', code: 'HG', couleur: '#f39c12', niveaux: false, dureeDefaut: 45 },
    { nom: 'Sciences', code: 'SCI', couleur: '#2ecc71', niveaux: false, dureeDefaut: 45 }
];

function cleanAndCreateDir(dir) {
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
}

function copyPhoto(type, destFolderName) {
    const destFolder = path.join(SAMPLE_DIR, type, destFolderName);
    fs.mkdirSync(destFolder, { recursive: true });
    let sourcePhoto = type === 'classes' ? 'classe.webp' : (type === 'students' ? 'student.webp' : 'prof.webp');
    const sourcePath = path.join(SOURCE_DIR, sourcePhoto);
    const destPath = path.join(destFolder, 'photo.webp');
    if (fs.existsSync(sourcePath)) fs.copyFileSync(sourcePath, destPath);
    return `/sample/${type}/${destFolderName}/photo.webp`;
}

async function generate() {
    try {
        console.log('🔌 Connexion à MongoDB Sample...');
        await mongoose.connect(MONGODB_URI);
        await mongoose.connection.db.dropDatabase();
        
        cleanAndCreateDir(path.join(SAMPLE_DIR, 'classes'));
        cleanAndCreateDir(path.join(SAMPLE_DIR, 'students'));
        cleanAndCreateDir(path.join(SAMPLE_DIR, 'teachers'));

        const SchemaOpts = { strict: false, versionKey: false };
        const TeacherModel = mongoose.model(MODEL_TEACHER, new mongoose.Schema({}, SchemaOpts));
        const ClasseModel = mongoose.model(MODEL_CLASSE, new mongoose.Schema({}, SchemaOpts));
        const StudentModel = mongoose.model(MODEL_ELEVE, new mongoose.Schema({ createdAt: { type: String, default: () => Date.now().toString() } }, SchemaOpts));
        const SettingsModel = mongoose.model(MODEL_SETTINGS, new mongoose.Schema({}, SchemaOpts));
        const SubjectModel = mongoose.model(MODEL_SUBJECT, new mongoose.Schema({}, SchemaOpts));
        const ScheduleModel = mongoose.model(MODEL_SCHEDULE, new mongoose.Schema({}, SchemaOpts));
        const UserModel = mongoose.model(MODEL_USER, new mongoose.Schema({}, SchemaOpts));

        await SettingsModel.create({
            schoolKey: 'default',
            feeDefinitions: [
                { id: 'scol_cash', label: 'Frais Scolaires (Espèce)', unit: 'F', targets: [{ key: 'Interne', label: 'Interne', amount: 45000 }, { key: 'Externe', label: 'Externe', amount: 18000 }] },
                { id: 'scol_nature', label: 'Frais Scolaires (Nature)', unit: 'kg', targets: [{ key: 'Interne', label: 'Interne', amount: 50 }, { key: 'Externe', label: 'Externe', amount: 25 }] }
            ],
            targets: [{ key: 'isInterne', options: ['Interne', 'Externe'] }]
        });

        const insertedSubjects = await SubjectModel.insertMany(SUBJECTS_DATA);

        // 1. Teachers (12 total)
        const teachers = [];
        for (let i = 0; i < 12; i++) {
            const nom = faker.person.lastName().toUpperCase();
            const prenom = faker.person.firstName();
            teachers.push({
                _id: new mongoose.Types.ObjectId(),
                nom, prenoms: [prenom],
                naissance_$_date: faker.date.between({ from: '1970-01-01', to: '1995-01-01' }).getTime().toString(),
                photo_$_file: copyPhoto('teachers', `${nom}-${prenom}-${Date.now()}`),
                current_classes_$_ref_µ_classes: [],
                createdAt: Date.now().toString()
            });
        }

        // 2. Physical Classes (12 total)
        const physicalClasses = [];
        for (const niveau of NIVEAUX) {
            for (const alias of ALIASES) {
                physicalClasses.push({
                    _id: new mongoose.Types.ObjectId(),
                    niveau, alias,
                    photo_$_file: copyPhoto('classes', `${niveau}-${alias}-${Date.now()}`),
                    history: []
                });
            }
        }

        // 3. Pre-initialize yearDataByClass for EVERY year and EVERY class
        const yearDataByClass = {};
        physicalClasses.forEach((pc, idx) => {
            const cid = pc._id.toString();
            yearDataByClass[cid] = {};
            YEARS.forEach(year => {
                const ts1 = new Date(`${year.split('-')[0]}-11-15T12:00:00Z`).getTime().toString();
                const ts2 = new Date(`${year.split('-')[0]}-12-20T12:00:00Z`).getTime().toString();
                const ts3 = new Date(`${year.split('-')[1]}-03-10T12:00:00Z`).getTime().toString();
                const coeffs = {};
                insertedSubjects.forEach(sub => coeffs[sub._id.toString()] = faker.number.int({ min: 1, max: 4 }));
                
                yearDataByClass[cid][year] = {
                    annee: year,
                    eleves: [],
                    professeur: [teachers[idx]._id], // One stable teacher per physical class
                    coefficients: coeffs,
                    compositions: [[ts1, true], [ts2, false], [ts3, true]],
                    moyenne_trimetriel: ["12.5", "13.0", "14.2"],
                    createdAt: Date.now().toString(),
                    homework: {}, reports: [], commentaires: []
                };
                
                // Track current classes for teachers
                if (year === YEARS[2]) {
                    teachers[idx].current_classes_$_ref_µ_classes.push(cid);
                }
            });
        });

        // 4. Students Generation & Assignment
        let students = [];
        // Increase initial count for more density
        for (let i = 0; i < 100; i++) {
            const cIdx = faker.number.int({ min: 0, max: physicalClasses.length - 1 });
            students.push(createInitialStudent(YEARS[0], physicalClasses[cIdx]._id, insertedSubjects));
        }

        for (let yIdx = 0; yIdx < YEARS.length; yIdx++) {
            const year = YEARS[yIdx];
            // New arrivals for Y-1 and Y-0
            const arrivals = yIdx === 1 ? 15 : (yIdx === 2 ? 15 : 0);
            for (let i = 0; i < arrivals; i++) {
                const cIdx = faker.number.int({ min: 0, max: physicalClasses.length - 1 });
                students.push(createInitialStudent(year, physicalClasses[cIdx]._id, insertedSubjects));
            }

            students.forEach(s => {
                let classId;
                if (yIdx === 0) {
                    classId = s.current_classe;
                } else {
                    const prevYearStr = YEARS[yIdx - 1];
                    const prevCId = s.bolobi_class_history_$_ref_µ_classes[prevYearStr];
                    if (prevCId) {
                        const pIdx = physicalClasses.findIndex(pc => pc._id.toString() === prevCId.toString());
                        const nextLevelIdx = pIdx + 2; 
                        if (nextLevelIdx < physicalClasses.length) {
                            classId = physicalClasses[nextLevelIdx]._id; 
                            s.current_classe = classId;
                            s.bolobi_class_history_$_ref_µ_classes[year] = classId;
                            addFees(s, year);
                            addAcademicData(s, year, insertedSubjects);
                        } else {
                            s.current_classe = null; // Graduated
                        }
                    } else if (s.bolobi_class_history_$_ref_µ_classes[year]) {
                         // Was a new arrival for this specific year
                         classId = s.bolobi_class_history_$_ref_µ_classes[year];
                    }
                }

                if (classId) {
                    const cid = classId.toString();
                    if (yearDataByClass[cid] && yearDataByClass[cid][year]) {
                        yearDataByClass[cid][year].eleves.push(s._id);
                    }
                }
            });
        }

        // 5. Finalize Classes
        const currentYearStr = YEARS[2];
        const finalClasses = physicalClasses.map(pc => {
            const cid = pc._id.toString();
            const current = yearDataByClass[cid][currentYearStr];
            const history = [
                yearDataByClass[cid][YEARS[0]],
                yearDataByClass[cid][YEARS[1]]
            ];
            
            return {
                ...pc,
                ...current,
                history
            };
        });

        const schedules = finalClasses.map((c, idx) => ({
            classeRef: c._id,
            anneeScolaire: currentYearStr,
            semestreMode: 'trimestre',
            joursOuverts: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
            heureDebutJournee: '08:00',
            heureFinJournee: '15:00',
            creneaux: [
                { id: new mongoose.Types.ObjectId().toString(), jour: 'lundi', heureDebut: '08:00', heureFin: '09:00', subjectRef: insertedSubjects[0]._id, profRef: teachers[idx]._id },
            ]
        }));

        await UserModel.create({ clerkId: 'user_fake_admin_123', email: 'admin@school.com', firstName: 'Admin', lastName: 'System', role: 'admin', roleData: { adminLevel: 'super' } });
        
        await TeacherModel.insertMany(teachers);
        await ClasseModel.insertMany(finalClasses);
        await StudentModel.insertMany(students);
        await ScheduleModel.insertMany(schedules);

        console.log(`✅ Succès: 12 classes générées avec structure complète.`);
        process.exit(0);
    } catch (e) { console.error(e); process.exit(1); }
}

function createInitialStudent(year, classId, subjects) {
    const id = new mongoose.Types.ObjectId();
    const ts = Date.now();
    const nom = faker.person.lastName().toUpperCase();
    const prenom = faker.person.firstName();
    const photo = copyPhoto('students', `${nom}-${prenom}-${ts}`);
    const student = {
        _id: id, nom, prenoms: [prenom],
        sexe: faker.helpers.arrayElement(['F', 'M']),
        naissance_$_date: faker.date.between({ from: '2014-01-01', to: '2019-12-31' }).toISOString().split('T')[0],
        photo_$_file: photo,
        targetsList: { isInterne: faker.helpers.arrayElement(['Interne', 'Externe']) },
        scolarity_fees_$_checkbox: {},
        bolobi_class_history_$_ref_µ_classes: { [year]: classId },
        current_classe: classId,
        notes: {}, compositions: {}, moyenne_trimetriel: {},
        createdAt: ts.toString()
    };
    addFees(student, year);
    addAcademicData(student, year, subjects);
    return student;
}

function addFees(s, y) {
    const isI = s.targetsList.isInterne === 'Interne';
    s.scolarity_fees_$_checkbox[y] = { "Trimestre 1": [{ feeId: 'scol_cash', amount: isI ? 45000 : 18000, timestamp: Date.now() }] };
}

function addAcademicData(s, y, subs) {
    const yearStart = parseInt(y.split('-')[0]);
    const ts1 = new Date(`${yearStart}-11-15T12:00:00Z`).getTime().toString();
    const ts3 = new Date(`${yearStart + 1}-03-10T12:00:00Z`).getTime().toString();

    const t1 = { officiel: { [ts1]: {} }, unOfficiel: {} };
    const t2 = { officiel: {}, unOfficiel: {} };
    const t3 = { officiel: { [ts3]: {} }, unOfficiel: {} };

    subs.forEach(sub => {
        t1.officiel[ts1][sub.nom] = { note: faker.number.float({ min: 4, max: 20, fractionDigits: 1 }), sur: 20 };
        t3.officiel[ts3][sub.nom] = { note: faker.number.float({ min: 5, max: 20, fractionDigits: 1 }), sur: 20 };
    });

    s.compositions[y] = [t1, t2, t3];
    s.moyenne_trimetriel[y] = ["12.00", "11.00", "13.00"];
}

generate();
