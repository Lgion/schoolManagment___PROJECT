import { POST } from '../route';
import { NextResponse } from 'next/server';
import { checkRole, Roles } from '../../../../../utils/roles';

// Mock the dependencies
jest.mock('../../../../../utils/roles', () => ({
    checkRole: jest.fn(),
    Roles: { ADMIN: 'admin', TEACHER: 'teacher' }
}));

jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockResolvedValue({
                    response: {
                        text: () => JSON.stringify([{ nom: "Test", note: 15, confiance: 0.9 }])
                    }
                })
            })
        })),
        SchemaType: { ARRAY: "ARRAY", OBJECT: "OBJECT", STRING: "STRING", NUMBER: "NUMBER" }
    };
});

describe('POST /api/school_ai/extract-notes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = "test_key";
    });

    it('returns 403 if user is not admin or teacher', async () => {
        checkRole.mockResolvedValue(false);

        const request = new Request('http://localhost:3000/api/school_ai/extract-notes', {
            method: 'POST'
        });

        const response = await POST(request);
        expect(response.status).toBe(403);
    });

    it('returns 400 if no image is provided', async () => {
        checkRole.mockResolvedValueOnce(false).mockResolvedValueOnce(true); // Is Teacher

        const formData = new FormData();
        const request = new Request('http://localhost:3000/api/school_ai/extract-notes', {
            method: 'POST',
            body: formData
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBe('Image manquante ou format invalide');
    });
});
