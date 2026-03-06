import { auth } from '@clerk/nextjs/server';
import { cookies, headers } from 'next/headers';
import dbConnect from '../app/api/lib/dbConnect';
import User from '../app/api/_/models/ai/User';
import { authWithFallback } from '../app/api/lib/authWithFallback';

export const Roles = {
    ADMIN: 'admin',
    TEACHER: 'prof', // Harmonisé avec le reste de l'application (prof)
};

/**
 * Checks if the current authenticated user has the specified role.
 * @param {string} role - The role to check against (e.g. 'admin', 'prof').
 * @param {Request} [request] - Optional request for robust auth
 * @returns {Promise<boolean>} True if the user has the role, false otherwise.
 */
export const checkRole = async (role, request = null) => {
    try {
        if (process.env.NEXT_PUBLIC_MODE === 'test') {
            const cookieStore = await cookies();
            let mockRole = cookieStore.get('mock_role')?.value;
            if (!mockRole) {
                const headersList = await headers();
                const authHeader = headersList.get('authorization');
                if (authHeader && authHeader.startsWith('Bearer mock-token-')) {
                    mockRole = authHeader.replace('Bearer mock-token-', '');
                }
            }
            if (mockRole) {
                return mockRole === role;
            }
        }

        let userId = null;
        let sessionClaims = null;

        if (request) {
            // Utiliser la méthode robuste si la requête est fournie
            const authResult = await authWithFallback(request, 'checkRole');
            if (authResult.success) {
                userId = authResult.userId;
                // Note: authWithFallback doesn't return sessionClaims in its current form, 
                // but we can fetch them from Clerk if needed or fallback to DB.
            }
        } else {
            // Fallback sur la méthode standard
            const authData = await auth();
            userId = authData.userId;
            sessionClaims = authData.sessionClaims;
        }

        if (!userId) {
            return false;
        }

        // 1. Tenter via sessionClaims (si disponible)
        const userRole = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;

        if (userRole) {
            return userRole === role;
        }

        // 2. Fallback DB : Plus lent mais fiable
        await dbConnect();
        const mongoUser = await User.findOne({ clerkId: userId }).select('role');
        if (mongoUser) {
            return mongoUser.role === role;
        }

        return false;
    } catch (error) {
        console.error('Error in checkRole:', error);
        return false;
    }
};
