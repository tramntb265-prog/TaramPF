import { test, expect } from '../../src/fixtures/clientList.fixtures';
import { DashboardPage } from '../../src/pages/dashboard.page';

test.describe('Client List Tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('@client_list should display the client list page', async ({ clientListPage }) => {
        await clientListPage.goto();
        await clientListPage.expectLoaded();
    });

    test('@client_list @client_list_search should filter table results while typing in search box', async ({ clientListPage }) => {
        await clientListPage.goto();

        const firstContactName = await clientListPage.getFirstContactName();
        const searchKeyword = firstContactName.slice(0, Math.min(4, firstContactName.length)).trim();
        expect(searchKeyword.length).toBeGreaterThan(0);

        await clientListPage.searchClientsByKeyInput(searchKeyword);
        await clientListPage.expectSearchResultsContain(searchKeyword);
    });

    test('@client_list @mcp_agentic_web should open Clients submenu and navigate to Manage', async ({ page, clientListPage }) => {
        const dashboardPage = new DashboardPage(page);

        await dashboardPage.expectLoaded();
        await dashboardPage.openClientsSubmenu();
        await dashboardPage.clickClientsManage();

        await clientListPage.expectLoaded();
    });

    test('@mcp_agentic_web @mcp_agentic_web_quote_create should open Quotes/Loans -> Quote -> Create from left menu', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);

        await dashboardPage.expectLoaded();
        await dashboardPage.openQuotesLoansSubmenu();
        await dashboardPage.openQuoteSubmenu();
        await dashboardPage.clickQuoteCreate();
    });
});
