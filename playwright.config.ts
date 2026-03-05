import { defineConfig, devices } from '@playwright/test';

import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
    testDir: './tests',
    globalSetup: require.resolve('./tests/support/global-setup'),
    timeout: 60 * 1000,
    expect: {
        timeout: 10000
    },
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: [
        ['html'],
        ['junit', { outputFile: 'test-results/results.xml' }],
        ['list']
    ],
    use: {
        actionTimeout: 15 * 1000,
        navigationTimeout: 30 * 1000,
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        testIdAttribute: 'data-testid'
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        }
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        env: {
            NEXT_PUBLIC_MODE: 'test'
        },
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
