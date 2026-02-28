import { auth } from '@clerk/nextjs/server';
import { cookies, headers } from 'next/headers';
import dbConnect from '../app/api/lib/dbConnect';
import User from '../app/api/_/models/ai/User';

export const Roles = {
    ADMIN: 'admin',
    TEACHER: 'enseignant', // Assuming "enseignant" or "teacher" based on PRD "Admin, Enseignant"
};

/**
 * Checks if the current authenticated user has the specified role.
 * @param {string} role - The role to check against (e.g. 'admin', 'enseignant').
 * @returns {Promise<boolean>} True if the user has the role, false otherwise.
 */
export const checkRole = async (role) => {
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

        const { userId, sessionClaims } = await auth();

        if (!userId) {
            return false;
        }

        // Clerk custom claims often reside in publicMetadata
        const userRole = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role;

        if (userRole) {
            return userRole === role;
        }

        // Fallback: If sessionClaims doesn't have the role yet (e.g. before token refresh),
        // check the database directly.
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
