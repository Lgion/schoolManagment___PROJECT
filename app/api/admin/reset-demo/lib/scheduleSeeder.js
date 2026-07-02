import Schedule from '../../../_/models/ai/Schedule';

const timeSlots = [
    { start: "08:30", end: "09:30" },
    { start: "09:30", end: "10:30" },
    // BREAK 10:30 - 10:45
    { start: "10:45", end: "11:45" },
    // BREAK 11:45 - 13:30
    { start: "13:30", end: "14:30" },
    { start: "14:30", end: "15:30" },
    // BREAK 15:30 - 15:45
    { start: "15:45", end: "16:45" }
];

export const generateScheduleForClass = async (classe, subjects, schoolKey, teacherId, userId, yearStr) => {
    const events = [];
    const days = [1, 2, 4, 5]; // Lundi, Mardi, Jeudi, Vendredi
    
    // Filtrer les matières applicables pour cette classe
    const applicableSubjects = subjects.filter(sub => {
        if (!sub.niveaux || sub.niveaux === false) return true;
        return sub.niveaux.some(n => classe.niveau.includes(n));
    });

    if (applicableSubjects.length === 0) return;

    for (const day of days) {
        // Pauses fixes
        events.push({ dayOfWeek: day, startTime: "10:30", endTime: "10:45", type: "BREAK", label: "Récréation" });
        events.push({ dayOfWeek: day, startTime: "11:45", endTime: "13:30", type: "BREAK", label: "Pause Déjeuner" });
        events.push({ dayOfWeek: day, startTime: "15:30", endTime: "15:45", type: "BREAK", label: "Récréation" });

        // Affecter des matières aux créneaux
        let slotIndex = 0;
        timeSlots.forEach(slot => {
            // Sélection pseudo-aléatoire basée sur l'heure et le jour pour avoir une grille cohérente
            // Les maths et le français plutôt le matin
            let sub;
            if (slotIndex < 2) {
                const cores = applicableSubjects.filter(s => s.code === 'MATH' || s.code === 'FR');
                sub = cores.length > 0 ? cores[(day + slotIndex) % cores.length] : applicableSubjects[0];
            } else if (slotIndex === 2) {
                const sciences = applicableSubjects.filter(s => s.code === 'HG' || s.code === 'SCI' || s.code === 'EV');
                sub = sciences.length > 0 ? sciences[day % sciences.length] : applicableSubjects[1 % applicableSubjects.length];
            } else {
                const others = applicableSubjects.filter(s => s.code !== 'MATH' && s.code !== 'FR');
                sub = others.length > 0 ? others[(day + slotIndex) % others.length] : applicableSubjects[0];
            }

            events.push({
                dayOfWeek: day,
                startTime: slot.start,
                endTime: slot.end,
                type: "COURSE",
                subjectId: sub._id,
                teacherId: teacherId.toString(),
                label: sub.nom
            });

            slotIndex++;
        });
    }

    const schedule = new Schedule({
        schoolKey,
        classeId: classe._id,
        createdBy: userId,
        events,
        label: `Emploi du temps ${classe.niveau} ${classe.alias} - ${yearStr}`
    });

    await schedule.save();
    return schedule;
};
