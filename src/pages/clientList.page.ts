import { Page, Locator, expect } from "@playwright/test";

const CLIENT_LIST_URL = 'https://dev.flexigrow.app/client/list/';

export class ClientListPage {
    readonly page: Page;
    readonly clientListCard: Locator;
    readonly clientTable: Locator;
    readonly clientRows: Locator;
    readonly clientTableHeaders: Locator;
    readonly contactNameHeaderButton: Locator;
    readonly businessNameHeaderButton: Locator;
    readonly tradingNameHeaderButton: Locator;
    readonly mobileHeaderButton: Locator;

    readonly clientTableSearchInput: Locator;
    readonly viewButton: Locator;
    readonly createClientButton: Locator;

    readonly rowActionMenuButtons: Locator;
    readonly contactNameButtons: Locator;

    readonly rowsPerPageLabel: Locator;
    readonly rowsPerPageCombobox: Locator;
    readonly paginationSummary: Locator;
    readonly firstPageButton: Locator;
    readonly previousPageButton: Locator;
    readonly nextPageButton: Locator;
    readonly lastPageButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.clientListCard = page.locator('div.bg-card.rounded-lg.shadow').first();
        this.clientTable = this.clientListCard.locator('table').first();
        this.clientRows = this.clientTable.locator('tbody tr');
        this.clientTableHeaders = this.clientTable.locator('thead th');
        this.contactNameHeaderButton = this.clientTable.getByRole('button', { name: /Contact Name/i }).first();
        this.businessNameHeaderButton = this.clientTable.getByRole('button', { name: /Business Name/i }).first();
        this.tradingNameHeaderButton = this.clientTable.getByRole('button', { name: /Trading Name/i }).first();
        this.mobileHeaderButton = this.clientTable.getByRole('button', { name: /Mobile/i }).first();

        this.clientTableSearchInput = page.getByPlaceholder(/Search Clients/i).first();
        this.viewButton = page.getByRole('button', { name: /^View$/ }).first();
        this.createClientButton = page.getByRole('button', { name: /Add Client|Create Client/i }).first();

        this.rowActionMenuButtons = this.clientTable.getByRole('button', { name: /Open menu/i });
        this.contactNameButtons = this.clientTable.locator('tbody tr td:first-child button');

        this.rowsPerPageLabel = page.getByText('Rows per page').first();
        this.rowsPerPageCombobox = page.getByRole('combobox').filter({ has: page.getByText(/^\d+$/) }).first();
        this.paginationSummary = page.locator('text=/Page\s+\d+\s+of\s+\d+/i').first();
        this.firstPageButton = page.getByRole('button', { name: /Go to first page/i }).first();
        this.previousPageButton = page.getByRole('button', { name: /Go to previous page/i }).first();
        this.nextPageButton = page.getByRole('button', { name: /Go to next page/i }).first();
        this.lastPageButton = page.getByRole('button', { name: /Go to last page/i }).first();
    }

    async goto(): Promise<void> {
        await this.page.goto(CLIENT_LIST_URL, { waitUntil: 'domcontentloaded' });
        await this.expectLoaded();
    }

    async expectLoaded(): Promise<void> {
        await expect(this.clientListCard).toBeVisible({ timeout: 20000 });
        await expect(this.clientTable).toBeVisible({ timeout: 20000 });
        await expect(this.clientTableSearchInput).toBeVisible({ timeout: 20000 });
        console.log('Client list page loaded successfully');
    }

    async searchClients(keyword: string): Promise<void> {
        await expect(this.clientTableSearchInput).toBeVisible({ timeout: 10000 });
        await this.clientTableSearchInput.fill(keyword);
    }

    async searchClientsByKeyInput(keyword: string): Promise<void> {
        await expect(this.clientTableSearchInput).toBeVisible({ timeout: 10000 });
        await this.clientTableSearchInput.click();
        await this.clientTableSearchInput.clear();
        await this.clientTableSearchInput.pressSequentially(keyword, { delay: 60 });
        await expect(this.clientTableSearchInput).toHaveValue(keyword);
    }

    async getFirstContactName(): Promise<string> {
        await expect(this.contactNameButtons.first()).toBeVisible({ timeout: 10000 });
        return (await this.contactNameButtons.first().innerText()).trim();
    }

    async expectSearchResultsContain(keyword: string): Promise<void> {
        const normalizedKeyword = keyword.trim().toLowerCase();

        await expect
            .poll(async () => {
                const rows = await this.clientRows.allTextContents();
                const normalizedRows = rows
                    .map((row) => row.replace(/\s+/g, ' ').trim().toLowerCase())
                    .filter(Boolean);

                if (normalizedRows.length === 0) {
                    return false;
                }

                return normalizedRows.every((row) => row.includes(normalizedKeyword));
            }, {
                timeout: 10000,
                message: `Expected all search result rows to contain "${keyword}"`,
            })
            .toBeTruthy();
    }

    getRowByContactName(name: string): Locator {
        return this.clientRows
            .filter({ has: this.page.getByRole('button', { name: new RegExp(name, 'i') }) })
            .first();
    }

    getRowActionMenuButtonByIndex(index: number): Locator {
        return this.rowActionMenuButtons.nth(index);
    }

}