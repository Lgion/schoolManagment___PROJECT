import { type AuthProvider } from '@seontechnologies/playwright-utils/auth-session';

const mockAuthProvider: AuthProvider = {
    getEnvironment: (options) => options.environment || 'local',
    getUserIdentifier: (options) => options.userIdentifier || 'default-user',

    extractToken: (storageState) => {
        const tokenEntry = storageState.origins?.[0]?.localStorage?.find((item: any) => item.name === 'auth_token');
        return tokenEntry?.value || null;
    },

    isTokenExpired: (storageState) => {
        const tokenEntry = storageState.origins?.[0]?.localStorage?.find((item: any) => item.name === 'auth_token');
        return !tokenEntry?.value;
    },

    manageAuthToken: async (request, options) => {
        const identifier = options.userIdentifier || 'default-user';
        let role = 'user';
        if (identifier === 'admin-user') role = 'admin';
        if (identifier === 'enseignant-user') role = 'prof'; // l'app utilise Roles.TEACHER = 'prof' (pas 'enseignant')
        if (identifier === 'parent-user') role = 'parent';
        if (identifier === 'eleve-user') role = 'eleve';

        const token = `mock-token-${role}`;
        return {
            cookies: [
                { name: 'mock_role', value: role, domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax', expires: Math.floor(Date.now() / 1000) + 86400 }
            ],
            origins: [
                {
                    origin: process.env.BASE_URL || 'http://localhost:3000',
                    localStorage: [
                        { name: 'auth_token', value: token },
                        { name: 'mock_role', value: role },
                    ],
                },
            ],
        };
    },
};

export default mockAuthProvider;
