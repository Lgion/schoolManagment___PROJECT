import { headers } from 'next/headers';
import { Webhook } from 'svix';
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

    // 3. Vérifier si c'est un élève (email dans parents ou autre champ)
    const eleve = await Eleve.findOne({
      $or: [
        { 'parents.email': email },
        // Ajouter d'autres champs email si nécessaire selon votre structure
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

export async function POST(req) {
  try {
    // Vérification de la signature Clerk
    const headerPayload = headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing svix headers' }, 
        { status: 400 }
      );
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return NextResponse.json(
        { error: 'Verification error' }, 
        { status: 400 }
      );
    }

    const { id, email_addresses, first_name, last_name } = evt.data;
    const eventType = evt.type;

    await dbConnect();

    // Gestion des événements Clerk
    switch (eventType) {
      case 'user.created':
        await handleUserCreated({
          clerkId: id,
          email: email_addresses[0]?.email_address,
          firstName: first_name,
          lastName: last_name
        });
        break;

      case 'user.updated':
        await handleUserUpdated({
          clerkId: id,
          email: email_addresses[0]?.email_address,
          firstName: first_name,
          lastName: last_name
        });
        break;

      case 'user.deleted':
        await handleUserDeleted(id);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json(
      { message: 'Webhook processed successfully' }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' }, 
      { status: 500 }
    );
  }
}

// Création d'un nouvel utilisateur
async function handleUserCreated(userData) {
  try {
    const { clerkId, email, firstName, lastName } = userData;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ clerkId });
    if (existingUser) {
      console.log('User already exists:', clerkId);
      return;
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
      roleData.adminLevel = 'standard';
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

    await newUser.save();
    console.log('User created successfully:', { clerkId, email, role });

  } catch (error) {
    console.error('Error creating user:', error);
  }
}

// Mise à jour utilisateur
async function handleUserUpdated(userData) {
  try {
    const { clerkId, email, firstName, lastName } = userData;

    // Récupérer l'utilisateur existant
    const existingUser = await User.findOne({ clerkId });
    if (!existingUser) {
      // Si l'utilisateur n'existe pas, le créer
      await handleUserCreated(userData);
      return;
    }

    // Vérifier si le rôle a changé (si l'email a changé)
    let updateData = {
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      updatedAt: new Date()
    };

    // Si l'email a changé, recalculer le rôle
    if (existingUser.email !== email) {
      const { role, ref } = await determineUserRole(email);
      
      updateData.role = role;
      updateData.roleData = {};
      
      if (role === 'prof' && ref) {
        updateData.roleData.teacherRef = ref;
      } else if (role === 'eleve' && ref) {
        updateData.roleData.eleveRef = ref;
      } else if (role === 'admin') {
        updateData.roleData.adminLevel = 'standard';
      }
    }

    await User.findOneAndUpdate({ clerkId }, updateData);
    console.log('User updated successfully:', clerkId);

  } catch (error) {
    console.error('Error updating user:', error);
  }
}

// Suppression utilisateur
async function handleUserDeleted(clerkId) {
  try {
    await User.findOneAndDelete({ clerkId });
    console.log('User deleted successfully:', clerkId);
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}
