// API RESTful pour les médias
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const BASE_PATH = path.join(process.cwd(), 'public/school');
const CLASSES_PATH = path.join(process.cwd(), 'public/school/classes');

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
    const formData = await request.formData();
    const type = formData.get('type');
    const payload = JSON.parse(formData.get('payload') || '{}');
    const entityType = formData.get('entityType');
    const files = formData.getAll('file');
    
    console.log("\n🚀 === DÉBUT UPLOAD MEDIA ===");
    console.log('📝 FormData reçue:');
    console.log('   - type:', type);
    console.log('   - entityType:', entityType);
    console.log('   - payload:', payload);
    console.log('   - files count:', files.length);
    console.log("=================================");
    
    if (!type || !files.length) {
      return NextResponse.json({ error: 'Champs requis manquants (type, file)' }, { status: 400 });
    }

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
      const customNames = JSON.parse(formData.get('documentsMeta') || '[]');
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
    console.error('Erreur upload:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
  }
}
