import { checkRole, Roles } from '../../../../utils/roles';
import { authWithFallback } from '../../lib/authWithFallback';
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Construct Gemini instance
// Make sure to add GEMINI_API_KEY to your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request) {
    try {
        const authResult = await authWithFallback(request, 'POST /api/school_ai/extract-notes');
        if (!authResult.success) {
            return authResult.response;
        }

        // 1. Role-Based Access Control (RBAC) - Restrict to Admin/Teacher
        const isAdmin = await checkRole(Roles.ADMIN, request);
        const isTeacher = await checkRole(Roles.TEACHER, request);

        if (!isAdmin && !isTeacher) {
            return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Configuration serveur incomplète (Clé IA manquante)' }, { status: 500 });
        }

        // 2. Image Parsing
        const formData = await request.formData();
        const file = formData.get('image');

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'Image manquante ou format invalide' }, { status: 400 });
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString('base64');
        const mimeType = file.type;

        // Immediately zero out the original ArrayBuffer to satisfy NFR-SEC-2 Data Ephemerality
        new Uint8Array(arrayBuffer).fill(0);

        if (!mimeType.startsWith('image/')) {
            buffer.fill(0);
            return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
        }

        // 3. Connect to Google Gemini Vision API with Structured Prompt
        // Using gemini-2.5-flash for speed and vision capabilities
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    description: "Liste des notes des élèves extraites du document manuscrit.",
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            nom: { type: SchemaType.STRING, description: "Nom complet de l'élève" },
                            note: { type: SchemaType.NUMBER, description: "Note obtenue par l'élève, classiquement sur 20" },
                            confiance: { type: SchemaType.NUMBER, description: "Score de confiance OCR entre 0.0 et 1.0 (1.0 = sûr à 100%, 0.1 = très incertain, illisible)" }
                        },
                        required: ["nom", "note", "confiance"]
                    }
                }
            }
        });

        const prompt = `Tu es un assistant spécialisé dans l'extraction de notes scolaires à partir de photos de copies ou de relevés manuscrits.
Analyse cette image. Extrais chaque ligne correspondant à un élève. 
Retourne son nom complet (ou prénom selon ce qui est écrit), la note associée (un nombre, attention aux demi-points, ex: 12.5), et attribue un score de confiance (entre 0 et 1) sur ta capacité à lire la ligne correctement. Si la note ou le nom est très mal écrit, mets un score de confiance de 0.5 ou moins.`;

        const imageParts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType
                }
            }
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        let responseText = result.response.text();

        // Strip markdown code fences if Gemini provides them despite responseMimeType
        responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();

        // 4. Data Validation (Task 2)
        let extractedData = [];
        try {
            extractedData = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Gemini a retourné un JSON invalide", parseError);
            // Clean up
            buffer.fill(0);
            return NextResponse.json({ error: 'Le format de réponse de l\'IA est invalide' }, { status: 502 });
        }

        if (!Array.isArray(extractedData)) {
            extractedData = [extractedData]; // Fallback if API returned single object instead of array
        }

        // Sanitize and validate
        const sanitizedData = extractedData.map(item => {
            let note = parseFloat(item.note);
            // Relaxed clamp to 0-100 logic to handle different grading systems
            if (isNaN(note)) note = 0;
            if (note < 0) note = 0;
            if (note > 100) note = 100;

            let conf = parseFloat(item.confiance);
            if (isNaN(conf)) conf = 0.5;
            if (conf < 0) conf = 0;
            if (conf > 1) conf = 1;

            return {
                nom: item.nom || "Inconnu",
                note: note,
                confiance: conf
            };
        });

        // 5. Ensure Security and Data Privacy (NFR-SEC-2)
        // Wipe Image buffer
        buffer.fill(0);

        return NextResponse.json({
            success: true,
            data: sanitizedData
        });

    } catch (error) {
        console.error('Erreur API Gemini extract-notes:', error);
        return NextResponse.json({
            error: 'Erreur lors du traitement de l\'image par l\'IA',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}
