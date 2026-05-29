import { test } from '../../src/fixtures/auth.fixtures';
import { ClientListPage } from '../../src/pages/clientList.page';

test.describe('Client List Tests', () => {
    let clientListPage: ClientListPage;

    // 1. Remove the test.beforeAll block entirely from here

    test.beforeEach(async ({ page }) => {
        // Naming { page } here automatically handles the login/refresh once!
        clientListPage = new ClientListPage(page);
        await clientListPage.goto();
    });

    test('@client_list should display the client list page', async ({ page }) => {
        // This test reuses the clean, validated page context setup above
        await clientListPage.expectLoaded();
    }); 
});
