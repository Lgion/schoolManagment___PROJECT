export const generateBlogAndPosts = async (Article, Post, schoolKey, adminId, getRandomDateInYear, currentYearStr) => {
    // Convertir l'année (ex: "2023-2024") en date de rentrée (1er Septembre)
    const yearStart = new Date(currentYearStr.split('-')[0] + "-09-01T08:00:00Z").getTime();
    
    // 1. Articles de Blog
    const articlesToInsert = [
        {
            title: `Bilan de la rentrée scolaire ${currentYearStr}`,
            content: `### Une rentrée sous le signe de la réussite\n\nNous sommes très heureux d'avoir accueilli nos élèves pour cette nouvelle année scolaire **${currentYearStr}**.\n\n- Effectifs stables\n- Nouveaux équipements sportifs\n- Projets pédagogiques innovants\n\nMerci à tous les parents pour leur confiance !`,
            coverImage: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
            daysFromStart: 10,
            tags: ["Rentrée", "Actualités"]
        },
        {
            title: "Préparation des examens : nos conseils",
            content: `### Comment bien réviser ?\n\nLa période des examens approche à grands pas. Voici quelques conseils pour nos élèves :\n\n1. **Faites des fiches** de synthèse régulièrement.\n2. **Dormez au moins 8 heures** par nuit.\n3. **Mangez équilibré** et évitez les excès de sucre.\n\nBon courage à tous !`,
            coverImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
            daysFromStart: 150,
            tags: ["Pédagogie", "Conseils"]
        }
    ];

    for (const art of articlesToInsert) {
        const pubDate = new Date(yearStart + (art.daysFromStart * 24 * 60 * 60 * 1000));
        await Article.create({
            schoolKey,
            title: art.title,
            content: art.content,
            coverImage: art.coverImage,
            authorId: adminId,
            authorName: "Direction",
            authorRole: "admin",
            status: "PUBLISHED",
            tags: art.tags,
            publishedAt: pubDate,
            createdAt: pubDate,
            updatedAt: pubDate
        });
    }

    // 2. Annonces et Sondages globaux
    const postsToInsert = [
        {
            type: "ANNOUNCEMENT",
            content: "Rappel important : La réunion d'information pour les classes de CP se tiendra ce vendredi à 18h en salle polyvalente.",
            daysFromStart: 15
        },
        {
            type: "POLL",
            content: "Nous réfléchissons à organiser un voyage scolaire au printemps. Quelle destination a votre préférence ?",
            pollQuestion: "Destination du voyage scolaire",
            pollOptions: [
                { id: "opt1", text: "Londres (Anglais)", voters: [] },
                { id: "opt2", text: "Madrid (Espagnol)", voters: [] },
                { id: "opt3", text: "Rome (Histoire)", voters: [] }
            ],
            daysFromStart: 45
        }
    ];

    for (const post of postsToInsert) {
        const pubDate = new Date(yearStart + (post.daysFromStart * 24 * 60 * 60 * 1000));
        
        // Simuler quelques votes aléatoires pour le sondage
        if (post.type === "POLL") {
            const votesToDistribute = 15;
            for (let i = 0; i < votesToDistribute; i++) {
                const optIndex = Math.floor(Math.random() * post.pollOptions.length);
                post.pollOptions[optIndex].voters.push(`voter_dummy_${i}`);
            }
        }

        await Post.create({
            schoolKey,
            isGlobal: true,
            authorId: adminId,
            authorName: "Direction",
            type: post.type,
            content: post.content,
            pollQuestion: post.pollQuestion,
            pollOptions: post.pollOptions,
            createdAt: pubDate
        });
    }
};
