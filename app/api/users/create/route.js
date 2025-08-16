import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
import User from '../../_/models/ai/User';
import Teacher from '../../_/models/ai/Teacher';
import Eleve from '../../_/models/ai/Eleve';

// Fonction pour déterminer le rôle selon votre logique
async function determineUserRole(email) {
  try {
    // 1. Vérifier si c'est un admin via variable d'environnement
    const adminEmails = process.env.NEXT_PUBLIC_EMAIL_ADMIN?.split(' ') || [];
    if (adminEmails.includes(email)) {
      return { role: 'admin', ref: null };
    }

    await dbConnect();

    // 2. Vérifier si c'est un prof (email présent dans Teacher schema)
    const teacher = await Teacher.findOne({ 'email_$_email': email });
    if (teacher) {
      return { role: 'prof', ref: teacher._id };
    }

    // 3. Vérifier si c'est un élève (email présent dans Eleve schema)
    // Note: Les élèves peuvent avoir l'email dans parents.email ou autre champ
    const eleve = await Eleve.findOne({
      $or: [
        { 'parents.email': email },
        // Ajouter d'autres champs email si nécessaire
      ]
    });
    if (eleve) {
      return { role: 'eleve', ref: eleve._id };
    }

    // 4. Par défaut : rôle public
    return { role: 'public', ref: null };

  } catch (error) {
    console.error('Error determining user role:', error);
    return { role: 'public', ref: null };
  }
}

export async function POST(request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' }, 
        { status: 401 }
      );
    }

    await dbConnect();
    const body = await request.json();
    const { clerkId, email, firstName, lastName } = body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ clerkId });
    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Déterminer le rôle selon votre logique
    const { role, ref } = await determineUserRole(email);

    // Préparer les données roleData selon le rôle
    let roleData = {};
    if (role === 'prof' && ref) {
      roleData.teacherRef = ref;
    } else if (role === 'eleve' && ref) {
      roleData.eleveRef = ref;
    } else if (role === 'admin') {
      roleData.adminLevel = 'standard'; // ou 'super' selon vos besoins
    }

    // Créer le nouvel utilisateur
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

    const savedUser = await newUser.save();

    // Peupler les références avant de retourner
    const populatedUser = await User.findById(savedUser._id)
      .populate('roleData.teacherRef')
      .populate('roleData.eleveRef');

    return NextResponse.json(populatedUser, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' }, 
      { status: 500 }
    );
  }
}
