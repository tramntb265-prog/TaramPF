import { Page, Locator, expect } from "@playwright/test";

const CLIENT_LIST_URL = 'https://dev.flexigrow.app/client/list/';

export class ClientListPage {
    readonly page: Page;
    readonly clientTable: Locator;
    readonly clientRows: Locator;

    readonly clientTableSearchInput: Locator;
    readonly createClientButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.clientTable = page.locator('table');
        this.clientRows = this.clientTable.locator('tbody tr');
        this.clientTableSearchInput = this.clientTable.locator('input[type="search"]');
        this.createClientButton = page.getByRole('button', { name: 'Add Client' });
    }

    async goto(): Promise<void> {
        await this.page.goto(CLIENT_LIST_URL, { waitUntil: 'domcontentloaded' });
        await this.expectLoaded();
    }

    async expectLoaded(): Promise<void> {
        await expect(this.clientTable).toBeVisible({ timeout: 20000 });
        console.log('Client list page loaded successfully');
    }

}