import { authWithFallback } from '../../lib/authWithFallback';
import { NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import dbConnect from '../../lib/dbConnect';
import User from '../../_/models/ai/User';
import Teacher from '../../_/models/ai/Teacher';
import Eleve from '../../_/models/ai/Eleve';

export async function GET(request, { params }) {
  try {
    // Vérification de l'authentification Clerk
    const authResult = await authWithFallback(request, 'GET /api/users/[clerkId]');
    if (!authResult.success) {
      return authResult.response;
    }
    const userId = authResult.userId;

    await dbConnect();
    const { clerkId } = await params;

    // Récupération des données utilisateur avec références
    const user = await User.findOne({ clerkId })
      .populate('roleData.teacherRef')
      .populate('roleData.eleveRef');

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérification des permissions (un utilisateur ne peut voir que ses propres données sauf admin)
    if (userId !== clerkId) {
      const currentUser = await User.findOne({ clerkId: userId });

      if (!currentUser || currentUser.role !== 'admin') {
        console.warn(`🔒 [API users/:clerkId] Access denied for ${userId} trying to read ${clerkId}`);
        return NextResponse.json(
          { error: 'Accès refusé - Droits administrateur requis.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const authResult = await authWithFallback(request, 'PATCH /api/users/[clerkId]');
    if (!authResult.success) {
      return authResult.response;
    }
    const userId = authResult.userId;

    await dbConnect();
    const { clerkId } = await params;
    const body = await request.json();

    // Vérification des permissions pour modification (seuls les admins peuvent modifier les rôles)
    const currentUser = await User.findOne({ clerkId: userId });

    if (!currentUser || (userId !== clerkId && currentUser.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // Mise à jour des données utilisateur
    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      {
        role: body.role,
        firstName: body.firstName,
        lastName: body.lastName,
        preferences: body.preferences,
        customPermissions: body.customPermissions
      },
      { new: true }
    ).populate('roleData.teacherRef').populate('roleData.eleveRef');

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
