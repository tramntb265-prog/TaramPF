import { Page, Locator, expect } from "@playwright/test";

const DASHBOARD_URL = 'https://dev.flexigrow.app/premium-funding/dashboards/';

export class DashboardPage {
    readonly page: Page;
    
    readonly searchBar: Locator;
    readonly loansBox: Locator;
    readonly quotesBox: Locator;
    readonly clientsMenuButton: Locator;
    readonly clientsManageLink: Locator;
    readonly quotesLoansMenuButton: Locator;
    readonly quotesLoansMenuSection: Locator;
    readonly quoteMenuToggle: Locator;
    readonly quoteCreateLink: Locator;
    readonly quoteCreateButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.searchBar = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'Search by' });
        this.loansBox = page.locator('div.rounded-xl')
            .filter({ has: page.getByText('Loans', { exact: true }) });
        this.quotesBox = page.locator('div.rounded-xl')
            .filter({ has: page.getByText('Quotes', { exact: true }) });
        this.clientsMenuButton = page.getByRole('button', { name: /^Clients$/i }).first();
        this.clientsManageLink = page.locator('a[href*="/client/list/"]', { hasText: /Manage/i }).first();
        this.quotesLoansMenuButton = page.getByRole('button', { name: /Quotes\s*\/\s*Loans/i }).first();
        this.quotesLoansMenuSection = this.quotesLoansMenuButton.locator('xpath=ancestor::li[1]').first();
        this.quoteMenuToggle = this.quotesLoansMenuSection
            .locator('button, a')
            .filter({ hasText: /^Quotes?$/i })
            .first();
        this.quoteCreateLink = this.quotesLoansMenuSection
            .locator('a[href*="quote" i][href*="create" i], a:has-text("Create")')
            .first();
        this.quoteCreateButton = this.quotesLoansMenuSection
            .locator('button:has-text("Create")')
            .first();
    }

    async goto(): Promise<void> {
        await this.page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
        await this.expectLoaded();
    }

    async expectLoaded(): Promise<void> {
        await expect(this.page).toHaveURL(DASHBOARD_URL), { timeout: 100000 };
        await expect(this.searchBar).toBeVisible({ timeout: 20000 });
        await expect(this.loansBox).toBeVisible({ timeout: 20000 });
        await expect(this.quotesBox).toBeVisible({ timeout: 20000 });
        console.log('Dashboard page loaded successfully');
    }

    async openClientsSubmenu(): Promise<void> {
        await expect(this.clientsMenuButton).toBeVisible({ timeout: 10000 });

        if (await this.clientsManageLink.isVisible().catch(() => false)) {
            return;
        }

        await this.clientsMenuButton.click();
        await expect(this.clientsManageLink).toBeVisible({ timeout: 10000 });
    }

    async clickClientsManage(): Promise<void> {
        await this.openClientsSubmenu();
        await this.clientsManageLink.click();
        await expect(this.page).toHaveURL(/\/client\/list\/?/, { timeout: 15000 });
    }

    async openQuotesLoansSubmenu(): Promise<void> {
        await expect(this.quotesLoansMenuButton).toBeVisible({ timeout: 10000 });

        const globalQuoteToggle = this.page.locator('button, a').filter({ hasText: /^Quotes?$/i }).first();
        const globalCreateEntry = this.page.locator('a, button').filter({ hasText: /^Create$/i }).first();

        const expanded = await this.quotesLoansMenuButton.getAttribute('aria-expanded');
        if (expanded !== 'true') {
            await this.quotesLoansMenuButton.click();
        }

        await expect
            .poll(async () => {
                return (
                    (await this.quoteMenuToggle.isVisible().catch(() => false)) ||
                    (await this.quoteCreateLink.isVisible().catch(() => false)) ||
                    (await this.quoteCreateButton.isVisible().catch(() => false)) ||
                    (await globalQuoteToggle.isVisible().catch(() => false)) ||
                    (await globalCreateEntry.isVisible().catch(() => false))
                );
            }, { timeout: 10000 })
            .toBeTruthy();
    }

    async openQuoteSubmenu(): Promise<void> {
        await this.openQuotesLoansSubmenu();

        if (
            await this.quoteCreateLink.isVisible().catch(() => false) ||
            await this.quoteCreateButton.isVisible().catch(() => false)
        ) {
            return;
        }

        await expect(this.quoteMenuToggle).toBeVisible({ timeout: 10000 });
        await this.quoteMenuToggle.click();

        await expect
            .poll(async () => {
                return (
                    (await this.quoteCreateLink.isVisible().catch(() => false)) ||
                    (await this.quoteCreateButton.isVisible().catch(() => false))
                );
            }, { timeout: 10000 })
            .toBeTruthy();
    }

    async clickQuoteCreate(): Promise<void> {
        await this.openQuoteSubmenu();

        if (await this.quoteCreateLink.isVisible().catch(() => false)) {
            await this.quoteCreateLink.click();
        } else if (await this.quoteCreateButton.isVisible().catch(() => false)) {
            await this.quoteCreateButton.click();
        } else {
            await this.page.getByRole('link', { name: /^Create$/i }).first().click();
        }

        await expect(this.page).toHaveURL(/quote/i, { timeout: 15000 });
    }

}