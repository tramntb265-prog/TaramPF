import { Page, Locator, expect } from "@playwright/test";

const DASHBOARD_URL = 'https://dev.flexigrow.app/premium-funding/dashboards/';

export class DashboardPage {
    readonly page: Page;
    
    readonly searchBar: Locator;
    readonly loansBox: Locator;
    readonly quotesBox: Locator;

    constructor(page: Page) {
        this.page = page;
        this.searchBar = page.locator('button[aria-haspopup="dialog"]').filter({ hasText: 'Search by' });
        this.loansBox = page.locator('div.rounded-xl')
            .filter({ has: page.getByText('Loans', { exact: true }) });
        this.quotesBox = page.locator('div.rounded-xl')
            .filter({ has: page.getByText('Quotes', { exact: true }) });
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

}