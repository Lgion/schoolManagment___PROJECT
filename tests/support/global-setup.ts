import { authStorageInit, setAuthProvider, configureAuthSession, authGlobalInit } from '@seontechnologies/playwright-utils/auth-session';
import mockAuthProvider from './mock-auth-provider';

async function globalSetup() {
    authStorageInit();

    configureAuthSession({
        authStoragePath: process.cwd() + '/.auth',
        debug: true,
    });

    setAuthProvider(mockAuthProvider);

    await authGlobalInit({
        userIdentifiers: ['default-user', 'admin-user', 'enseignant-user']
    });
}

export default globalSetup;
