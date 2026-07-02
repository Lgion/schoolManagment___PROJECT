import { NextResponse } from 'next/server';
import { requireAuth } from '../../lib/authWithFallback';
import dbConnect from '../../lib/dbConnect';
import Post from '../../_/models/ai/Post';
import Group from '../../_/models/ai/Group';

export async function GET(req) {
  try {
    const userId = await requireAuth(req, 'GET /api/admin/patch-demo');
    if (userId instanceof NextResponse) return userId;

    await dbConnect();

    // 1. Corriger les Annonces / Sondages
    // Trouver tous les posts globaux qui ont le mauvais schoolKey et les corriger
    const resultPosts = await Post.updateMany(
      { isGlobal: true, schoolKey: { $ne: 'demo_master' } },
      { $set: { schoolKey: 'demo_master', authorId: userId } }
    );

    // Forcer l'ajout de l'utilisateur ET du compte visiteur comme admins
    const resultGroups = await Group.collection.updateMany(
      { schoolKey: 'demo_master' },
      { 
        $addToSet: { 
          members: { 
            $each: [
              { userId: userId, role: 'ADMIN', userType: 'ADMIN' },
              { userId: 'user_fake_admin_123', role: 'ADMIN', userType: 'ADMIN' },
              { userId: 'user_admin_demo', role: 'ADMIN', userType: 'ADMIN' }
            ]
          } 
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Patch terminé ! ${resultPosts.modifiedCount} publications corrigées et vous êtes maintenant propriétaire de ${resultGroups.modifiedCount} groupes.`
    });
  } catch (error) {
    console.error('Erreur patch-demo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
