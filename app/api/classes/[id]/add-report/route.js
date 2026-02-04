import dbConnect from '../../../lib/dbConnect';
import Classe from '../../../_/models/ai/Classe';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    try {
        await dbConnect();

        const { id } = await params;
        const body = await request.json();
        const { teacherId, teacherName, content } = body;

        if (!teacherId || !content) {
            return NextResponse.json({
                success: false,
                error: 'Champs obligatoires manquants (teacherId, content)'
            }, { status: 400 });
        }

        const report = {
            teacherId,
            teacherName,
            content,
            createdAt: new Date()
        };

        const updated = await Classe.findByIdAndUpdate(
            id,
            { $push: { reports: report } },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return NextResponse.json({
                success: false,
                error: 'Classe non trouvée'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: updated
        });

    } catch (error) {
        console.error('❌ [API] Erreur lors de l\'ajout du rapport:', error);
        return NextResponse.json({
            success: false,
            error: 'Erreur serveur lors de l\'ajout du rapport'
        }, { status: 500 });
    }
}
