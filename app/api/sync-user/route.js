import { NextResponse } from 'next/server';
import { authWithFallback, getUserId } from '../lib/authWithFallback';
import { currentUser, clerkClient } from '@clerk/nextjs/server';
import dbConnect from '../lib/dbConnect';
import User from '../_/models/ai/User';
import Teacher from '../_/models/ai/Teacher';
import Eleve from '../_/models/ai/Eleve';

// Fonction pour déterminer le rôle utilisateur
async function determineUserRole(email) {
  try {
    // 1. Vérifier si c'est un admin (depuis les variables d'environnement)
    const adminEmails = process.env.NEXT_PUBLIC_EMAIL_ADMIN?.split(' ') || [];
    console.log('Admin emails from env:', adminEmails);
    console.log('Checking email:', email);

    if (adminEmails.includes(email)) {
      console.log('User is admin!');
      return { role: 'admin', ref: null };
    }

    // 2. Vérifier si c'est un enseignant
    console.log('🔍 Searching for teacher with email:', email);
    console.log('📚 Teacher collection name:', Teacher.collection.name);
    const teacher = await Teacher.findOne({ 'email_$_email': email });
    console.log('📋 Teacher search result:', teacher);

    if (teacher) {
      console.log('✅ User is teacher:', teacher._id);
      return { role: 'prof', ref: teacher._id };
    } else {
      console.log('❌ No teacher found with this email');

      // Debug: Lister tous les enseignants pour vérifier
      const allTeachers = await Teacher.find({}, 'email_$_email nom prenom').limit(10);
      console.log('📚 All teachers in DB (first 10):', allTeachers);
    }

    // 3. Vérifier si c'est un élève
    console.log('🔍 Searching for student with email:', email);
    const eleve = await Eleve.findOne({ 'email_$_email': email });
    console.log('📋 Student search result:', eleve);

    if (eleve) {
      console.log('✅ User is student:', eleve._id);
      return { role: 'eleve', ref: eleve._id };
    } else {
      console.log('❌ No student found with this email');
    }

    // 4. Par défaut : public
    console.log('User is public');
    return { role: 'public', ref: null };
  } catch (error) {
    console.error('Error determining user role:', error);
    return { role: 'public', ref: null };
  }
}

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

    console.log('🔌 Connecting to MongoDB...');
    const connection = await dbConnect();
    console.log('✅ MongoDB connected');
    console.log('📊 Database name:', connection.connection.db.databaseName);
    console.log('🔗 Connection string (partial):', process.env.MONGODB_URI?.substring(0, 50) + '...');

    // Vérifier les collections disponibles
    const collections = await connection.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));

    // Vérifier si l'utilisateur existe déjà
    let existingUser = await User.findOne({ clerkId });

    if (existingUser) {
      console.log('User already exists, updating...');
      // Mettre à jour les infos si nécessaire
      const { role, ref } = await determineUserRole(email);

      existingUser.email = email;
      existingUser.role = role;
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;

      // Mettre à jour les références selon le rôle (schéma actuel)
      // Assainir les anciens documents où roleData pourrait être un ObjectId ou autre type
      if (!existingUser.roleData || typeof existingUser.roleData !== 'object' || Array.isArray(existingUser.roleData)) {
        existingUser.roleData = {};
      }
      if (role === 'prof' && ref) {
        existingUser.roleData.teacherRef = ref;
        if (existingUser.roleData.eleveRef) delete existingUser.roleData.eleveRef;
      } else if (role === 'eleve' && ref) {
        existingUser.roleData.eleveRef = ref;
        if (existingUser.roleData.teacherRef) delete existingUser.roleData.teacherRef;
      } else {
        // Rôles admin/public: nettoyer les refs spécifiques
        if (existingUser.roleData.teacherRef) delete existingUser.roleData.teacherRef;
        if (existingUser.roleData.eleveRef) delete existingUser.roleData.eleveRef;
      }

      await existingUser.save();

      // Peupler les références
      await existingUser.populate([
        { path: 'roleData.teacherRef' },
        { path: 'roleData.eleveRef' }
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
    const { role, ref } = await determineUserRole(email);

    // Préparer les données roleData selon le rôle (schéma actuel)
    let roleData = {};
    if (role === 'prof' && ref) {
      roleData.teacherRef = ref;
    } else if (role === 'eleve' && ref) {
      roleData.eleveRef = ref;
    } else if (role === 'admin') {
      roleData.adminLevel = 'standard';
    }

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
      { path: 'roleData.eleveRef' }
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
        details: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
