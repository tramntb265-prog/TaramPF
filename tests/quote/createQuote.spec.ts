import { test } from '../../src/fixtures/clientList.fixtures';
import { DashboardPage } from '../../src/pages/dashboard.page';
import { CreateQuotePage } from '../../src/pages/createQuote.page';

test.describe('Create Quote Tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('@quote_create @mcp_agentic_web should navigate left menu Quotes/Loans -> Quote -> Create', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        const createQuotePage = new CreateQuotePage(page);

        await dashboardPage.expectLoaded();
        await dashboardPage.openQuotesLoansSubmenu();
        await dashboardPage.openQuoteSubmenu();
        await dashboardPage.clickQuoteCreate();

        await createQuotePage.expectLoaded();
    });

    test('@quote_create @quote_create_add_client_minimum should add new client from Quote To and show correct client info', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        const createQuotePage = new CreateQuotePage(page);
        const timestamp = Date.now();

        const minimumClientData = {
            businessName: `Quote Client ${timestamp}`,
            contactName: `Quote Contact ${timestamp}`,
            phone: `021${String(timestamp).slice(-7)}`,
            email: `quote.client.${timestamp}@yopmail.com`,
            mobile: `021${String(timestamp).slice(-7)}`,
        };

        await dashboardPage.expectLoaded();
        await dashboardPage.openQuotesLoansSubmenu();
        await dashboardPage.openQuoteSubmenu();
        await dashboardPage.clickQuoteCreate();

        await createQuotePage.expectLoaded();
        await createQuotePage.addClientWithMinimumData(minimumClientData);
        await createQuotePage.expectQuoteToContainsClientInfo(minimumClientData);
    });
});
