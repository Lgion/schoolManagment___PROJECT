import Subject from '../../../_/models/ai/Subject';
import ReportCard from '../../../_/models/ai/ReportCard';
import Classe from '../../../_/models/ai/Classe';
import mongoose from 'mongoose';

const subjectDefinitions = [
    { nom: '[Démo] Mathématiques', code: 'D_MATH', couleur: '#e74c3c', dureeDefaut: 60, niveaux: false },
    { nom: '[Démo] Français', code: 'D_FR', couleur: '#3498db', dureeDefaut: 60, niveaux: false },
    { nom: '[Démo] Histoire/Géo', code: 'D_HG', couleur: '#f39c12', dureeDefaut: 60, niveaux: ['CE1', 'CE2', 'CM1', 'CM2'] },
    { nom: '[Démo] Sciences', code: 'D_SCI', couleur: '#2ecc71', dureeDefaut: 60, niveaux: ['CE1', 'CE2', 'CM1', 'CM2'] },
    { nom: '[Démo] Éveil', code: 'D_EV', couleur: '#9b59b6', dureeDefaut: 60, niveaux: ['CP'] },
    { nom: '[Démo] Sport (EPS)', code: 'D_EPS', couleur: '#e67e22', dureeDefaut: 120, niveaux: false },
    { nom: '[Démo] Anglais', code: 'D_ANG', couleur: '#1abc9c', dureeDefaut: 45, niveaux: false }
];

// Génération des matières dans la BDD
export const seedSubjects = async (schoolKey) => {
    const createdSubjects = [];
    for (const def of subjectDefinitions) {
        const sub = await Subject.findOneAndUpdate(
            { code: def.code },
            { $set: { ...def, schoolKey } },
            { upsert: true, new: true }
        );
        createdSubjects.push(sub);
    }
    return createdSubjects;
};

// Obtenir les coefficients selon le niveau
export const getCoefficientsForNiveau = (niveau, subjects) => {
    const isCP = niveau.startsWith('CP');
    const coefs = {};
    for (const sub of subjects) {
        if (sub.niveaux && sub.niveaux !== false && !sub.niveaux.some(n => niveau.includes(n))) {
            continue; // Matière non applicable pour ce niveau
        }
        
        if (sub.code === 'MATH' || sub.code === 'FR') {
            coefs[sub._id.toString()] = isCP && sub.code === 'MATH' ? 2 : 3;
        } else if (sub.code === 'HG' || sub.code === 'SCI') {
            coefs[sub._id.toString()] = 2;
        } else if (sub.code === 'EV') {
            coefs[sub._id.toString()] = 1;
        } else {
            coefs[sub._id.toString()] = 1; // EPS, Anglais
        }
    }
    return coefs;
};

// Générer les notes pour un élève (3 trimestres, plusieurs devoirs)
export const generateStudentNotes = (niveau, subjects, profileType = 'MOYEN') => {
    const coefs = getCoefficientsForNiveau(niveau, subjects);
    const applicableSubjects = subjects.filter(sub => coefs[sub._id.toString()]);
    
    const trimesters = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
    const notes = {};

    const getBaseScore = () => {
        if (profileType === 'EXCELLENT') return 15 + Math.random() * 4;
        if (profileType === 'DIFFICULTES') return 7 + Math.random() * 5;
        return 10 + Math.random() * 5;
    };

    trimesters.forEach(trim => {
        const trimNotes = [];
        applicableSubjects.forEach(sub => {
            const baseScore = getBaseScore();
            // 3 évaluations par matière
            trimNotes.push({ matiere: sub.nom, subjectId: sub._id.toString(), coef: "1", devoir: "DM", note: Math.min(20, (baseScore + (Math.random()*2-1)).toFixed(1)) });
            trimNotes.push({ matiere: sub.nom, subjectId: sub._id.toString(), coef: "1", devoir: "IS", note: Math.min(20, (baseScore - 1 + (Math.random()*2)).toFixed(1)) });
            trimNotes.push({ matiere: sub.nom, subjectId: sub._id.toString(), coef: "2", devoir: "EF", note: Math.min(20, (baseScore + (Math.random()*1)).toFixed(1)) });
        });
        notes[trim] = trimNotes;
    });
    return notes;
};

// Calculer et générer les ReportCards de fin d'année pour une classe et ses élèves
export const generateReportCardsForYear = async (classe, elevesPopulated, yearStr, schoolKey) => {
    // Ne générer les bulletins que pour la dernière année (par exemple) ou toutes.
    // L'exercice demande de montrer les fonctionnalités. On peut générer pour le Trimestre 1 et 2
    const trimesters = ['TRIMESTRE_1', 'TRIMESTRE_2'];
    
    for (const period of trimesters) {
        const periodKey = period === 'TRIMESTRE_1' ? 'Trimestre 1' : 'Trimestre 2';
        
        let classTotalAverage = 0;
        let validStudentsCount = 0;

        for (const eleve of elevesPopulated) {
            const studentNotes = eleve.notes[yearStr]?.[periodKey] || [];
            if (studentNotes.length === 0) continue;

            const subjectsMap = {};
            let sumCoefs = 0;
            let sumScores = 0;

            studentNotes.forEach(n => {
                if (!subjectsMap[n.subjectId]) {
                    subjectsMap[n.subjectId] = { totalScore: 0, totalCoef: 0, name: n.matiere, key: n.subjectId };
                }
                const c = parseFloat(n.coef) || 1;
                subjectsMap[n.subjectId].totalScore += parseFloat(n.note) * c;
                subjectsMap[n.subjectId].totalCoef += c;
            });

            const subjectsLines = [];
            for (const subId in subjectsMap) {
                const subData = subjectsMap[subId];
                const avg = subData.totalScore / subData.totalCoef;
                let appreciation = "Travail convenable.";
                if (avg >= 15) appreciation = "Très bon travail.";
                if (avg < 10) appreciation = "Des lacunes, il faut s'accrocher.";
                
                subjectsLines.push({
                    schoolKey,
                    key: subId,
                    name: subData.name,
                    average: parseFloat(avg.toFixed(2)),
                    classAverage: parseFloat((avg + (Math.random()*2-1)).toFixed(2)), // Fake class avg
                    classMin: Math.max(0, parseFloat((avg - 4).toFixed(2))),
                    classMax: Math.min(20, parseFloat((avg + 4).toFixed(2))),
                    appreciation
                });
                
                // On utilise les coefs de la classe pour la moyenne générale
                const classCoef = parseFloat(classe.coefficients?.[subId]) || 1;
                sumScores += avg * classCoef;
                sumCoefs += classCoef;
            }

            const globalAverage = sumCoefs > 0 ? parseFloat((sumScores / sumCoefs).toFixed(2)) : 0;
            classTotalAverage += globalAverage;
            validStudentsCount++;

            let generalApp = "Bon trimestre dans l'ensemble.";
            if (globalAverage >= 15) generalApp = "Excellent trimestre. Félicitations du conseil de classe.";
            if (globalAverage < 10) generalApp = "Trimestre difficile, un ressaisissement est attendu.";

            const rc = new ReportCard({
                studentId: eleve._id,
                classId: classe._id,
                period,
                schoolYear: yearStr,
                globalAverage,
                classGeneralAverage: 0, // Sera MAJ plus tard
                rank: 0,
                classSize: elevesPopulated.length,
                mention: globalAverage >= 16 ? "Très Bien" : globalAverage >= 14 ? "Bien" : globalAverage >= 12 ? "Assez Bien" : "",
                source: "compositions",
                subjects: subjectsLines,
                generalAppreciation: generalApp,
                isClassSummary: false
            });
            await rc.save();
        }

        // Mettre à jour la moyenne de classe sur les bulletins
        const actualClassAvg = validStudentsCount > 0 ? parseFloat((classTotalAverage / validStudentsCount).toFixed(2)) : 0;
        await ReportCard.updateMany(
            { classId: classe._id, schoolYear: yearStr, period },
            { $set: { classGeneralAverage: actualClassAvg } }
        );
    }
};

export const convertNotesToCompositions = (notes, yearStr) => {
    const startYear = parseInt(yearStr.split('-')[0]);
    const trimesters = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
    
    // Définir les dates fixes réalistes pour les devoirs par trimestre
    const dateConfig = [
        // Trimestre 1
        {
            DM: new Date(startYear, 9, 15, 10, 0).getTime().toString(),
            IS: new Date(startYear, 10, 10, 14, 0).getTime().toString(),
            EF: new Date(startYear, 11, 5, 9, 0).getTime().toString()
        },
        // Trimestre 2
        {
            DM: new Date(startYear + 1, 0, 20, 10, 0).getTime().toString(),
            IS: new Date(startYear + 1, 1, 15, 14, 0).getTime().toString(),
            EF: new Date(startYear + 1, 2, 10, 9, 0).getTime().toString()
        },
        // Trimestre 3
        {
            DM: new Date(startYear + 1, 3, 18, 10, 0).getTime().toString(),
            IS: new Date(startYear + 1, 4, 12, 14, 0).getTime().toString(),
            EF: new Date(startYear + 1, 5, 8, 9, 0).getTime().toString()
        }
    ];

    return trimesters.map((trimKey, index) => {
        const trimNotes = notes[trimKey] || [];
        const config = dateConfig[index];
        
        const result = { officiel: {}, unOfficiel: {} };

        // Initialiser les objets pour chaque date d'évaluation dans la catégorie officiel
        result.officiel[config.DM] = {};
        result.officiel[config.IS] = {};
        result.officiel[config.EF] = {};

        trimNotes.forEach(noteItem => {
            const evalType = noteItem.devoir; // 'DM' | 'IS' | 'EF'
            const dateTs = config[evalType];
            if (dateTs) {
                // La note de composition attend un objet { note: number, sur: number }
                result.officiel[dateTs][noteItem.matiere] = {
                    note: parseFloat(noteItem.note),
                    sur: 20
                };
            }
        });

        // Optionnel: nettoyer les évaluations vides si pas de notes
        Object.keys(result.officiel).forEach(ts => {
            if (Object.keys(result.officiel[ts]).length === 0) {
                delete result.officiel[ts];
            }
        });

        return result;
    });
};
