import { mergeTests, test as base } from '@playwright/test';
import { test as apiRequestFixture } from '@seontechnologies/playwright-utils/api-request/fixtures';
import { createAuthFixtures } from '@seontechnologies/playwright-utils/auth-session/fixtures';
import { setAuthProvider } from '@seontechnologies/playwright-utils/auth-session';
import { test as interceptFixture } from '@seontechnologies/playwright-utils/intercept-network-call/fixtures';
import mockAuthProvider from './mock-auth-provider';

// Register auth provider before creating the fixtures
setAuthProvider(mockAuthProvider);

const authFixture = base.extend(createAuthFixtures());

const logFixture = base.extend<{ log: { step: (msg: string) => Promise<void>, info: (msg: string) => void, warn: (msg: string) => void, error: (msg: string) => void } }>({
    log: async ({ }, use) => {
        await use({
            step: async (msg: string) => { await base.step(msg, async () => { }); },
            info: (msg: string) => { console.log(msg); },
            warn: (msg: string) => { console.warn(msg); },
            error: (msg: string) => { console.error(msg); },
        });
    }
});

// Merge all utilities into a single composable test object
export const test = mergeTests(
    apiRequestFixture,
    authFixture,
    logFixture,
    interceptFixture
);

export { expect } from '@playwright/test';
