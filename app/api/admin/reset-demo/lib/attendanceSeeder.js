import AttendanceRecord from '../../../_/models/ai/AttendanceRecord';
import AttendanceEntry from '../../../_/models/ai/AttendanceEntry';

// Générer une date aléatoire pendant l'année scolaire (Sept à Juin)
const getRandomDateInYear = (yearStr) => {
    const startYear = parseInt(yearStr.split('-')[0]);
    const start = new Date(startYear, 8, 1); // Septembre
    const end = new Date(startYear + 1, 5, 30); // Juin
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export const generateAttendanceForClassYear = async (classe, elevesPopulated, yearStr, schoolKey, teacherId) => {
    // 10 sessions d'appel aléatoires par an
    const numSessions = 10;
    
    for (let i = 0; i < numSessions; i++) {
        const sessionDate = getRandomDateInYear(yearStr);
        // On normalise à minuit pour le record
        const normalizedDate = new Date(sessionDate);
        normalizedDate.setHours(0, 0, 0, 0);
        
        const period = Math.random() > 0.5 ? 'MATIN' : 'APRES_MIDI';
        
        // Vérifier si un appel existe déjà ce jour/période (très rare avec l'aléatoire mais possible)
        const existingRecord = await AttendanceRecord.findOne({ classId: classe._id, date: normalizedDate, period });
        if (existingRecord) continue;

        const record = new AttendanceRecord({
            schoolKey,
            classId: classe._id,
            teacherId,
            date: normalizedDate,
            period,
            createdAt: sessionDate
        });
        await record.save();

        const entries = [];
        for (const eleve of elevesPopulated) {
            let status = 'PRESENT';
            let comment = '';
            let motif = '';

            const rand = Math.random();
            if (rand < 0.05) {
                status = 'ABSENT';
                comment = 'Absence non justifiée';
                motif = 'Non justifié';
            } else if (rand < 0.08) {
                status = 'EXCUSED';
                comment = 'Certificat médical reçu';
                motif = 'Maladie';
            } else if (rand < 0.12) {
                status = 'LATE';
                comment = 'Retard de 15 minutes (Problème de bus)';
                motif = 'Transport';
            }

            entries.push({
                schoolKey,
                recordId: record._id,
                studentId: eleve._id,
                status,
                comment,
                classId: classe._id,
                date: normalizedDate
            });

            // Ajouter dans le tableau d'absences de l'élève si non PRÉSENT
            if (status !== 'PRESENT') {
                eleve.absences.push({
                    date: normalizedDate.getTime(),
                    motif: motif,
                    isJustified: status === 'EXCUSED'
                });
            }
        }

        if (entries.length > 0) {
            await AttendanceEntry.insertMany(entries);
        }
    }
};
