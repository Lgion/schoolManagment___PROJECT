import { NextResponse } from 'next/server';
import { authWithFallback, getUserId } from '../lib/authWithFallback';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import dbConnect from '../lib/dbConnect';
import User from '../_/models/ai/User';
import { determineUserRole, buildRoleData } from '../lib/determineUserRole';

export async function POST(request) {
  console.log('🔄 Starting user sync...');

  try {
    // Récupérer les données utilisateur depuis le body de la requête
    const body = await request.json();
    const { clerkId, email, firstName, lastName } = body;

    console.log('📋 Received user data:', { clerkId, email, firstName, lastName });

    if (!clerkId || !email) {
      console.log('❌ Missing required user data');
      return NextResponse.json(
        { error: 'Données utilisateur manquantes (clerkId, email requis)' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Vérifier si l'utilisateur existe déjà
    let existingUser = await User.findOne({ clerkId });

    if (existingUser) {
      console.log('User already exists, updating...');
      // Mettre à jour les infos si nécessaire
      const { role, ref, childrenRefs } = await determineUserRole(email);

      existingUser.email = email;
      existingUser.role = role;
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;

      // Recomposer roleData proprement : nettoie automatiquement les refs
      // périmées quand le rôle change, et assainit les anciens documents
      // dont roleData aurait été mal typé (ObjectId, tableau, etc.).
      existingUser.roleData = buildRoleData(role, ref, childrenRefs);
      existingUser.markModified('roleData');

      await existingUser.save();

      // Peupler les références
      await existingUser.populate([
        { path: 'roleData.teacherRef' },
        { path: 'roleData.eleveRef' },
        { path: 'roleData.childrenRefs' }
      ]);

      // Update Clerk publicMetadata so middleware and sessionClaims have the correct role
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(clerkId, {
          publicMetadata: { role: existingUser.role }
        });
        console.log(`✅ Synced role '${existingUser.role}' to Clerk publicMetadata for ${clerkId}`);
      } catch (clerkErr) {
        console.error('⚠️ Failed to sync role to Clerk:', clerkErr);
      }

      return NextResponse.json({
        success: true,
        user: existingUser,
        message: 'Utilisateur mis à jour avec succès'
      });
    }

    // Créer un nouvel utilisateur
    console.log('Creating new user...');
    const { role, ref, childrenRefs } = await determineUserRole(email);
    const roleData = buildRoleData(role, ref, childrenRefs);

    const newUser = new User({
      clerkId,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      role,
      roleData,
      lastLogin: new Date(),
      loginCount: 1
    });

    await newUser.save();

    // Populer les références pour la réponse
    await newUser.populate([
      { path: 'roleData.teacherRef' },
      { path: 'roleData.eleveRef' },
      { path: 'roleData.childrenRefs' }
    ]);

    // Update Clerk publicMetadata
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkId, {
        publicMetadata: { role: newUser.role }
      });
      console.log(`✅ Synced role '${newUser.role}' to Clerk publicMetadata for ${clerkId}`);
    } catch (clerkErr) {
      console.error('⚠️ Failed to sync role to Clerk:', clerkErr);
    }

    console.log('User created successfully:', newUser);

    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'Utilisateur créé avec succès'
    });

  } catch (error) {
    console.error('❌ DETAILED ERROR syncing user:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors de la synchronisation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        name: process.env.NODE_ENV === 'development' ? error.name : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
