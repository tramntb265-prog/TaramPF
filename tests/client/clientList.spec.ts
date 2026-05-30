import { test } from '../../src/fixtures/clientList.fixtures';

test.describe('Client List Tests', () => {
    test('@client_list should display the client list page', async ({ clientListPage }) => {
        await clientListPage.goto();
        await clientListPage.expectLoaded();
    }); 
});
