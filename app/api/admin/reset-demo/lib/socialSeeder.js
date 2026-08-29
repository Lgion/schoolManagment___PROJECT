import Post from '../../../_/models/ai/Post';
import Group from '../../../_/models/ai/Group';
import GroupMessage from '../../../_/models/ai/GroupMessage';

export const generateSocialForClassYear = async (classe, yearStr, schoolKey, teacherId, teacherName, getRandomDate) => {
    // 1. Groupes de discussion
    const group = new Group({
        schoolKey, 
        creatorId: teacherId.toString(), 
        name: `Parents & Profs - ${classe.niveau} ${classe.alias} (${yearStr})`,
        members: [
            { userId: teacherId.toString(), role: 'ADMIN', userType: 'TEACHER' }, 
            { userId: 'parent_demo_id', role: 'MEMBER', userType: 'PARENT' },
            { userId: 'parent_demo_2', role: 'MEMBER', userType: 'PARENT' }
        ],
        invitationCode: Math.random().toString(36).substring(2, 8).toUpperCase()
    });
    await group.save();

    // Messages dans le groupe (échelonnés dans l'année)
    const msgs = [
        { senderId: teacherId.toString(), senderName: teacherName, content: `Bonjour à tous, bienvenue dans le groupe de la classe pour cette nouvelle année scolaire.` },
        { senderId: 'parent_demo_id', senderName: 'Parent Délégué', content: `Merci ! Hâte de commencer cette nouvelle année.` },
        { senderId: teacherId.toString(), senderName: teacherName, content: `N'oubliez pas la réunion de rentrée prévue vendredi soir.` },
        { senderId: 'parent_demo_2', senderName: 'Maman de Lucas', content: `Bonjour, pourriez-vous renvoyer la liste des fournitures pour les arts plastiques ?` },
        { senderId: teacherId.toString(), senderName: teacherName, content: `Bien sûr, je vous l'envoie de suite.` }
    ];

    for (let i = 0; i < msgs.length; i++) {
        await GroupMessage.create({
            schoolKey,
            groupId: group._id,
            senderId: msgs[i].senderId,
            senderName: msgs[i].senderName,
            content: msgs[i].content,
            createdAt: getRandomDate(yearStr) // Les dates seront un peu en désordre, mais c'est OK pour la démo
        });
    }

    // 2. Mur de la classe (Posts)
    await Post.create([
        { 
            schoolKey, classId: classe._id, isGlobal: false, 
            authorId: teacherId.toString(), authorName: teacherName, 
            content: `Rappel : contrôle d'histoire-géographie la semaine prochaine. Révisez le chapitre 3.`, 
            createdAt: getRandomDate(yearStr) 
        },
        { 
            schoolKey, classId: classe._id, isGlobal: false, 
            authorId: teacherId.toString(), authorName: teacherName, 
            content: `La sortie scolaire au musée des sciences s'est très bien passée. Merci aux parents accompagnateurs !`, 
            mediaUrls: ['/school/classe.webp'],
            createdAt: getRandomDate(yearStr) 
        }
    ]);
};

export const generateGlobalSocialData = async (schoolKey, adminId, getRandomDate) => {
    const currentYearStr = "2025-2026"; // Pour les posts les plus récents

    // Sondage global
    await Post.create({
        schoolKey, isGlobal: true, authorId: adminId, authorName: 'Direction',
        type: 'POLL',
        pollQuestion: 'Quel thème souhaitez-vous pour la kermesse de cette année ?',
        pollOptions: [
            { id: '1', text: 'Les Jeux Olympiques', voters: ['parent_demo_id'] },
            { id: '2', text: 'Le système solaire', voters: ['parent_demo_2', adminId] },
            { id: '3', text: 'Les animaux de la savane', voters: [] }
        ],
        createdAt: new Date()
    });

    // Annonces globales
    await Post.create([
        { 
            schoolKey, isGlobal: true, authorId: adminId, authorName: 'Direction', 
            content: `🚨 **Alerte Météo**\nEn raison des fortes chutes de neige prévues demain, les transports scolaires pourraient être perturbés. L'école restera ouverte pour l'accueil.`, 
            createdAt: getRandomDate("2024-2025") 
        },
        { 
            schoolKey, isGlobal: true, authorId: adminId, authorName: 'Direction', 
            content: `🎉 **Photos de classe**\nLes photos de l'année sont enfin disponibles à la commande sur l'espace parent.`, 
            createdAt: getRandomDate("2023-2024") 
        }
    ]);
};
