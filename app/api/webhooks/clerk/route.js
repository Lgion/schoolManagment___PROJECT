import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { NextResponse } from 'next/server';
import dbConnect from '../../lib/dbConnect';
import User from '../../_/models/ai/User';
import { determineUserRole, buildRoleData } from '../../lib/determineUserRole';

export async function POST(req) {
  try {
    // Garde : sans secret configuré, le constructeur Webhook échouerait de façon opaque
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      console.error('CLERK_WEBHOOK_SECRET non configuré');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Vérification de la signature Clerk
    const headerPayload = await headers();
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

    // Déterminer le rôle selon la logique partagée
    const { role, ref, childrenRefs } = await determineUserRole(email);
    const roleData = buildRoleData(role, ref, childrenRefs);

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
      const { role, ref, childrenRefs } = await determineUserRole(email);

      updateData.role = role;
      updateData.roleData = buildRoleData(role, ref, childrenRefs);
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
