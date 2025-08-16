import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
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
      
      if (ref) {
        existingUser.roleData = ref;
      }
      
      await existingUser.save();
      
      // Populer les références
      if (existingUser.role === 'prof') {
        await existingUser.populate('roleData');
      } else if (existingUser.role === 'eleve') {
        await existingUser.populate('roleData');
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

    // Préparer les données roleData selon le rôle
    let roleData = null;
    if (role === 'prof' && ref) {
      roleData = ref;
    } else if (role === 'eleve' && ref) {
      roleData = ref;
    }

    const newUser = new User({
      clerkId,
      email,
      firstName,
      lastName,
      role,
      roleData,
      metadata: {
        createdAt: new Date(),
        lastLogin: new Date(),
        source: 'manual_sync'
      }
    });

    await newUser.save();

    // Populer les références pour la réponse
    if (newUser.role === 'prof') {
      await newUser.populate('roleData');
    } else if (newUser.role === 'eleve') {
      await newUser.populate('roleData');
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
