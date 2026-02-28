import { type AuthProvider } from '@seontechnologies/playwright-utils/auth-session';

const mockAuthProvider: AuthProvider = {
    getEnvironment: (options) => options.environment || 'local',
    getUserIdentifier: (options) => options.userIdentifier || 'default-user',

    extractToken: (storageState) => {
        const tokenEntry = storageState.origins?.[0]?.localStorage?.find((item: any) => item.name === 'auth_token');
        return tokenEntry?.value || 'mock-token';
    },

    isTokenExpired: (storageState) => {
        return false;
    },

    manageAuthToken: async (request, options) => {
        const identifier = options.userIdentifier || 'default-user';
        let role = 'user';
        if (identifier === 'admin-user') role = 'admin';
        if (identifier === 'enseignant-user') role = 'enseignant';

        const token = `mock-token-${role}`;
        return {
            cookies: [
                { name: 'mock_role', value: role, domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' }
            ],
            origins: [
                {
                    origin: process.env.BASE_URL || 'http://localhost:3000',
                    localStorage: [
                        { name: 'auth_token', value: token },
                    ],
                },
            ],
        };
    },
};

export default mockAuthProvider;
