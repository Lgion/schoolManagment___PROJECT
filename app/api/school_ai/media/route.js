// API RESTful pour les médias avec support Cloudinary
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import cloudinaryService from '../../../../services/cloudinaryService';
import { Datas } from '../../_/models/Datas';
import dbConnect from '../../lib/dbConnect';
import { checkRole, Roles } from '../../../../utils/roles';

const BASE_PATH = path.join(process.cwd(), 'public/school');
const CLASSES_PATH = path.join(process.cwd(), 'public/school/classes');

// Fonction pour sauvegarder un fichier localement
const saveFileLocally = async (file, type, payload, entityType) => {
  const targetDir = getTargetDir(type, payload);
  await fs.promises.mkdir(targetDir, { recursive: true });

  if (entityType === 'classe') {
    // Conversion webp obligatoire
    const destPath = path.join(targetDir, 'photo.webp');

    console.log('🖼️ === TRAITEMENT PHOTO CLASSE LOCAL ===');
    console.log('   - targetDir:', targetDir);
    console.log('   - destPath:', destPath);
    console.log('   - file.name:', file.name);
    console.log('   - file.size:', file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    await sharp(buffer).webp().toFile(destPath);

    let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');

    console.log('✅ === PHOTO CLASSE SAUVÉE LOCALEMENT ===');
    console.log('   - Fichier créé à:', destPath);
    console.log('   - URL publique:', publicPath);
    console.log('   - Dossier existe:', fs.existsSync(targetDir));
    console.log('   - Fichier existe:', fs.existsSync(destPath));
    console.log("=================================");

    return { path: publicPath, type: 'classe' };

  } else if (entityType === 'eleve') {
    // --- Cas élève ---
    const { prenoms, nom, naissance_$_date } = payload;
    const eleveFolder = `${nom}-${prenoms}-${naissance_$_date}`.replace(/--+/g, '-');
    const destDir = path.join(BASE_PATH, 'students', eleveFolder);
    await fs.promises.mkdir(destDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const destPath = path.join(destDir, 'photo.webp');
      await sharp(buffer).webp().toFile(destPath);
      let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');
      console.log(`✅ Photo élève sauvée localement: ${publicPath}`);
      return { path: publicPath, type: 'eleve' };
    } else {
      const ext = path.extname(file.name || '');
      let destName = file.name || ('document' + Date.now() + ext);
      const destPath = path.join(destDir, destName);
      await fs.promises.writeFile(destPath, buffer);
      let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');
      console.log(`✅ Document élève sauvé localement: ${publicPath}`);
      return { path: publicPath, type: 'eleve' };
    }

  } else if (entityType === 'enseignant') {
    // --- Cas enseignant ---
    const { prenoms, nom } = payload;
    const enseignantFolder = `${nom}-${prenoms}`.replace(/--+/g, '-').replace(",", '-');
    const destDir = path.join(BASE_PATH, 'teachers', enseignantFolder);
    await fs.promises.mkdir(destDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const destPath = path.join(destDir, 'photo.webp');
    await sharp(buffer).webp().toFile(destPath);

    let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');
    console.log(`✅ Photo enseignant sauvée localement: ${publicPath}`);
    return { path: publicPath, type: 'enseignant' };

  } else {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name || '');
    const destPath = path.join(targetDir, 'photo' + ext);
    await fs.promises.writeFile(destPath, buffer);
    let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');
    console.log(`✅ Fichier générique sauvé localement: ${publicPath}`);
    return { path: publicPath, type: 'generic' };
  }
};

// 🔍 DÉTECTION D'ENVIRONNEMENT
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';
const isLocalhost = !isProduction && !isVercel;

console.log('🌍 ENVIRONNEMENT DÉTECTÉ:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  isProduction,
  isVercel,
  isLocalhost
});

const getTargetDir = (type, payload) => {
  console.log('🔍 DEBUG getTargetDir - type:', type);
  console.log('🔍 DEBUG getTargetDir - type[0]:', type[0]);
  console.log('🔍 DEBUG getTargetDir - payload:', payload);

  if (type === 'classe') {
    // Structure: /public/school/classes/{niveau-alias}/{annee}/
    const annee = String(payload.annee || '').replace(/[^a-zA-Z0-9-]/g, '');
    const niveau = String(payload.niveau || '').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    const alias = String(payload.alias || '').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
    const classeFolder = `${niveau}-${alias}`;
    const finalPath = path.join(CLASSES_PATH, classeFolder, annee);

    console.log('📁 DEBUG CLASSE PATH CONSTRUCTION:');
    console.log('   - annee:', annee);
    console.log('   - niveau:', niveau);
    console.log('   - alias:', alias);
    console.log('   - classeFolder:', classeFolder);
    console.log('   - CLASSES_PATH:', CLASSES_PATH);
    console.log('   - finalPath:', finalPath);

    return finalPath;
  }
  let safeName = ""
  if (type === 'student') return path.join(BASE_PATH, 'students', safeName);
  if (type === 'teacher') return path.join(BASE_PATH, 'teachers', safeName);
  // default: school root
  return BASE_PATH;
};

export async function POST(request) {
  try {
    const isAdmin = await checkRole(Roles.ADMIN);
    const isTeacher = await checkRole(Roles.TEACHER);
    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }
    const formData = await request.formData();
    const type = formData.get('type');
    const payload = JSON.parse(formData.get('payload') || '{}');
    const entityType = formData.get('entityType');
    const files = formData.getAll('file');

    console.log("\n🚀 === DÉBUT UPLOAD MEDIA (CLOUDINARY) ===");
    console.log('📝 FormData reçue:');
    console.log('   - type:', type);
    console.log('   - entityType:', entityType);
    console.log('   - payload:', payload);
    console.log('   - files count:', files.length);
    console.log("=================================");

    if (!type || !files.length) {
      return NextResponse.json({ error: 'Champs requis manquants (type, file)' }, { status: 400 });
    }

    // 🚀 NOUVEAU : Upload direct vers Cloudinary
    const cloudinaryResults = [];
    const localResults = [];

    for (const file of files) {
      try {
        console.log(`☁️ Upload vers Cloudinary: ${file.name}`);

        // Convertir le fichier en buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Déterminer le dossier Cloudinary selon le type d'entité
        let folder = 'school';
        let tags = [entityType || type];

        if (entityType === 'eleve') {
          folder = 'school/eleves';
          // Créer un nom de fichier basé sur les données de l'élève
          const eleveFolder = `${payload.nom}-${payload.prenoms}-${payload['naissance_$_date'] || Date.now()}`;
          folder = `school/eleves/${eleveFolder}`;
          tags.push('student', payload.nom);
        } else if (entityType === 'enseignant') {
          folder = 'school/enseignants';
          const profFolder = `${payload.nom}-${payload.prenoms}`;
          folder = `school/enseignants/${profFolder}`;
          tags.push('teacher', payload.nom);
        } else if (entityType === 'classe') {
          folder = 'school/classes';
          const classeFolder = `${payload.niveau?.toLowerCase()}-${payload.alias}/${payload.annee}`;
          folder = `school/classes/${classeFolder}`;
          tags.push('class', payload.niveau, payload.annee);
        }

        // Upload vers Cloudinary (initialiser d'abord le service)
        cloudinaryService.init();

        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinaryService.cloudinary.uploader.upload_stream({
            folder,
            resource_type: 'auto',
            tags,
            transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto', format: 'webp' }]
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          });
          stream.end(buffer);
        });

        console.log(`✅ Upload Cloudinary réussi:`, {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          folder
        });

        cloudinaryResults.push({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          folder,
          originalName: file.name
        });

        // 🏠 NOUVEAU : Upload local en parallèle si localhost, sinon sauvegarde MongoDB
        if (!isVercel && !isProduction) {
          console.log('🏠 Localhost détecté - sauvegarde locale en parallèle...');
          try {
            const localResult = await saveFileLocally(file, type, payload, entityType);
            localResults.push(localResult);
            console.log(`✅ Sauvegarde locale réussie: ${localResult.path}`);
          } catch (localError) {
            console.warn(`⚠️ Erreur sauvegarde locale (non bloquante): ${localError.message}`);
          }
        } else {
          // 💾 NOUVEAU : Sauvegarde des infos dans MongoDB pour traitement ultérieur
          console.log('☁️ Production détectée - sauvegarde des infos dans MongoDB...');
          try {
            await dbConnect();

            const fallbackData = {
              cloudinaryUrl: uploadResult.secure_url,
              cloudinaryPublicId: uploadResult.public_id,
              originalFileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              entityType,
              entityPayload: payload,
              uploadType: type,
              uploadedAt: new Date(),
              processed: false
            };

            await Datas.create({
              key: 'cloudinaryFallback',
              value: fallbackData,
              option: {
                targetPath: getTargetDir(type, payload),
                needsLocalPersistence: true,
                priority: 'high'
              }
            });

            console.log(`💾 Infos sauvegardées dans MongoDB pour traitement ultérieur`);
          } catch (mongoError) {
            console.warn(`⚠️ Erreur sauvegarde MongoDB (non bloquante): ${mongoError.message}`);
          }
        }

      } catch (uploadError) {
        console.error(`❌ Erreur upload Cloudinary pour ${file.name}:`, uploadError);

        // 🚨 NOUVEAU : Éviter le fallback local sur Vercel
        if (isVercel || isProduction) {
          console.error('🚫 Environnement de production détecté - pas de fallback local possible');
          return NextResponse.json({
            error: `Erreur upload Cloudinary: ${uploadError.message}. Le stockage local n'est pas disponible en production.`,
            cloudinaryError: true,
            environment: 'production'
          }, { status: 500 });
        }

        // Fallback vers stockage local seulement en localhost
        console.log('🏠 Localhost détecté - tentative de fallback local...');
        return await handleLocalUpload(type, payload, entityType, files);
      }
    }

    // Retourner les URLs Cloudinary (priorité) + infos locales
    const paths = cloudinaryResults.map(result => result.url);

    console.log('🎉 Upload Cloudinary terminé avec succès:', paths);
    if (localResults.length > 0) {
      console.log('🏠 Sauvegardes locales:', localResults.map(r => r.path));
    }

    return NextResponse.json({
      paths,
      cloudinaryResults,
      localResults: localResults.length > 0 ? localResults : undefined,
      success: true
    });

  } catch (error) {
    console.error('❌ Erreur générale upload:', error);

    // 🚨 NOUVEAU : Message d'erreur spécifique selon l'environnement
    if (isVercel || isProduction) {
      return NextResponse.json({
        error: `Erreur upload en production: ${error.message}. Vérifiez la configuration Cloudinary.`,
        environment: 'production'
      }, { status: 500 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Fonction de fallback pour le stockage local
async function handleLocalUpload(type, payload, entityType, files) {
  try {
    console.log('📁 Fallback vers stockage local...');

    const targetDir = getTargetDir(type, payload);
    await fs.promises.mkdir(targetDir, { recursive: true });

    if (entityType === 'classe') {
      // Conversion webp obligatoire
      const file = files[0];
      const destPath = path.join(targetDir, 'photo.webp');

      console.log('🖼️ === TRAITEMENT PHOTO CLASSE ===');
      console.log('   - targetDir:', targetDir);
      console.log('   - destPath:', destPath);
      console.log('   - file.name:', file.name);
      console.log('   - file.size:', file.size);

      const buffer = Buffer.from(await file.arrayBuffer());
      await sharp(buffer).webp().toFile(destPath);

      let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');

      console.log('✅ === PHOTO CLASSE SAUVÉE ===');
      console.log('   - Fichier créé à:', destPath);
      console.log('   - URL publique:', publicPath);
      console.log('   - Dossier existe:', fs.existsSync(targetDir));
      console.log('   - Fichier existe:', fs.existsSync(destPath));
      console.log("=================================");

      return NextResponse.json({ paths: [publicPath] });

    } else if (entityType === 'eleve') {
      // --- Cas élève ---
      const { prenoms, nom, naissance_$_date } = payload;
      const eleveFolder = `${nom}-${prenoms}-${naissance_$_date}`.replace(/--+/g, '-');
      const destDir = path.join(BASE_PATH, 'students', eleveFolder);
      await fs.promises.mkdir(destDir, { recursive: true });

      let paths = [];
      const customNames = []; // Pas d'accès à formData dans cette fonction
      let docIdx = 0;

      for (let file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const isImage = file.type.startsWith('image/');
        let isPhoto = false;
        if (isImage && !paths.some(p => p.endsWith('photo.webp'))) isPhoto = true;

        if (isPhoto) {
          const destPath = path.join(destDir, 'photo.webp');
          await sharp(buffer).webp().toFile(destPath);
          let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');
          paths.push(publicPath);
        } else {
          const ext = path.extname(file.name || '');
          let destName = customNames[docIdx] ? customNames[docIdx] : (file.name || ('document' + Date.now() + ext));
          if (!destName.endsWith(ext)) destName += ext;
          const destPath = path.join(destDir, destName);
          await fs.promises.writeFile(destPath, buffer);
          let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');
          paths.push(publicPath);
          docIdx++;
        }
      }
      return NextResponse.json({ paths });

    } else if (entityType === 'enseignant') {
      // --- Cas enseignant ---
      const { prenoms, nom } = payload;
      const enseignantFolder = `${nom}-${prenoms}`.replace(/--+/g, '-').replace(",", '-');
      const destDir = path.join(BASE_PATH, 'teachers', enseignantFolder);
      await fs.promises.mkdir(destDir, { recursive: true });

      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());
      const destPath = path.join(destDir, 'photo.webp');
      await sharp(buffer).webp().toFile(destPath);

      let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');
      return NextResponse.json({ paths: [publicPath] });

    } else {
      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name || '');
      const destPath = path.join(targetDir, 'photo' + ext);
      await fs.promises.writeFile(destPath, buffer);
      let publicPath = destPath.replace(path.join(process.cwd(), 'public'), '');
      return NextResponse.json({ paths: [publicPath] });
    }

  } catch (error) {
    console.error('❌ Erreur upload local:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'upload local' }, { status: 500 });
  }
}
