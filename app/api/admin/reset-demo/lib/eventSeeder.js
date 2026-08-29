export const generateEvents = async (Event, schoolKey, teachers, classes, getRandomDateInYear, currentYearStr) => {
    // 1. Evènements Globaux (École)
    const globalEvents = [
        { title: "Rentrée Scolaire", desc: "Accueil des élèves et parents", type: "AUTRE", daysFromStart: 0, duration: 240 },
        { title: "Réunion Parents-Professeurs", desc: "Présentation de l'année et des objectifs", type: "REUNION", daysFromStart: 20, duration: 120 },
        { title: "Semaine Culturelle", desc: "Expositions et ateliers découverte", type: "AUTRE", daysFromStart: 100, duration: 1440 },
        { title: "Kermesse de fin d'année", desc: "Fête de l'école avec stands et spectacles", type: "AUTRE", daysFromStart: 280, duration: 360 },
        { title: "Fermeture Hivernale", desc: "L'école sera fermée pendant les vacances", type: "FERMETURE", daysFromStart: 115, duration: 14400 } // 10 jours
    ];

    // 2. Evènements de Classe (Conseils de classe, Sorties)
    const classEvents = [
        { title: "Sortie au Musée", desc: "Visite guidée sur l'histoire locale", type: "SORTIE", daysFromStart: 45, duration: 240 },
        { title: "Conseil de Classe T1", desc: "Bilan du premier trimestre", type: "REUNION", daysFromStart: 90, duration: 90 },
        { title: "Évaluation Nationale", desc: "Épreuve standardisée", type: "EVALUATION", daysFromStart: 180, duration: 180 },
        { title: "Conseil de Classe T3", desc: "Bilan annuel et passages", type: "REUNION", daysFromStart: 270, duration: 90 }
    ];

    const adminId = "user_admin_demo";
    
    // Convertir l'année (ex: "2023-2024") en date de rentrée (1er Septembre)
    const yearStart = new Date(currentYearStr.split('-')[0] + "-09-01T08:00:00Z").getTime();
    
    const eventsToInsert = [];

    // Ajouter les évènements globaux
    for (const ge of globalEvents) {
        const start = new Date(yearStart + (ge.daysFromStart * 24 * 60 * 60 * 1000));
        const end = new Date(start.getTime() + (ge.duration * 60 * 1000));
        eventsToInsert.push({
            schoolKey,
            title: ge.title,
            description: ge.desc,
            startDate: start,
            endDate: end,
            isGlobal: true,
            classId: null,
            location: "Cour principale / Préau",
            type: ge.type,
            createdBy: adminId,
            createdAt: new Date(start.getTime() - 15 * 24 * 60 * 60 * 1000) // Créé 15 jours avant
        });
    }

    // Ajouter les évènements de classe
    for (const c of classes) {
        for (const ce of classEvents) {
            const start = new Date(yearStart + (ce.daysFromStart * 24 * 60 * 60 * 1000));
            // Ajouter un peu d'aléatoire pour que les classes n'aient pas tout en même temps
            start.setHours(start.getHours() + Math.floor(Math.random() * 6));
            
            const end = new Date(start.getTime() + (ce.duration * 60 * 1000));
            eventsToInsert.push({
                schoolKey,
                title: `${ce.title} - ${c.nom}`,
                description: ce.desc,
                startDate: start,
                endDate: end,
                isGlobal: false,
                classId: c._id,
                location: "Salle de classe",
                type: ce.type,
                createdBy: teachers.length > 0 ? teachers[0].clerkId : adminId,
                createdAt: new Date(start.getTime() - 10 * 24 * 60 * 60 * 1000)
            });
        }
    }

    await Event.insertMany(eventsToInsert);
};
