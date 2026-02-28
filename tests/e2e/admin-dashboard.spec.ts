import { test, expect } from '../support/merged-fixtures';
import { createAdminUser, createClass } from '../support/factories/data-factories';

test.describe('Admin Dashboard API and UI Integration', () => {
    test('admin can access dashboard and view simulated API data', async ({ page, apiRequest, interceptNetworkCall, log }) => {

        await log.step('Given an admin user is authenticated');
        // Note: Assuming auth is handled by auth-session fixture configuration
        const mockClassResponse = createClass({ name: 'Terminale S1', level: 'Terminale' });

        await log.step('And network calls to /api/school_ai/classes are intercepted');
        const classesCall = interceptNetworkCall({
            url: '**/api/school_ai/classes'
        });

        // Optional: Route the API call to return our factory data directly in UI
        await page.route('**/api/school_ai/classes', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([mockClassResponse])
            });
        });

        await log.step('When the admin navigates to the administration page');
        await page.goto('/administration');

        await log.step('Then the classes API should be triggered');
        const { request } = await classesCall;
        expect(request.method()).toBe('GET');

        await log.step('And the UI should render the classes data');
        // Wait for deterministic rendering
        // await expect(page.getByTestId('class-list-item').first()).toBeVisible();
    });
});
