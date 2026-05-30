import { Page, Locator, expect } from "@playwright/test";
import { ClientListPage } from "./clientList.page";

//const CLIENT_LIST_URL = 'https://dev.flexigrow.app/premium-funding/dashboards/clients/';

export class CreateClientModal {
    readonly page: Page;
    readonly modal: Locator;
    readonly modalFooter: Locator;
    readonly createClientButton: Locator;
    readonly modalHeading: Locator;
    readonly businessNameInput: Locator;
    readonly tradingNameInput: Locator;
    readonly contactNameInput: Locator;
    readonly nzbnInput: Locator;
    readonly phoneInput: Locator;
    readonly emailInput: Locator;
    readonly mobileInput: Locator;
    readonly accountManagerCombobox: Locator;
    readonly accountManagerEmailInput: Locator;
    readonly addressSearchButton: Locator;
    readonly assignBranchCombobox: Locator;
    readonly cancelButton: Locator;
    readonly saveButton: Locator;
    readonly closeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.modal = page.getByRole('dialog', { name: /Add Client|Create New Client/i });
        this.modalFooter = this.modal.locator('div.w-full.flex.gap-2.justify-end.mt-4');
        this.createClientButton = page.getByRole('button', { name: 'Create Client' });
        this.modalHeading = page.getByRole('heading', { name: /Add Client|Create New Client/i });
        this.businessNameInput = page.locator('input[name="businessName"]');
        this.tradingNameInput = page.locator('input[name="tradingName"]');
        this.contactNameInput = page.locator('input[name="contactName"]');
        this.nzbnInput = page.locator('input[name="ABN"]');
        this.phoneInput = page.locator('input[name="phone"]');
        this.emailInput = page.locator('input[name="email"]');
        this.mobileInput = page.locator('input[name="mobile"]');
        this.accountManagerCombobox = page.getByRole('combobox', { name: 'Account Manager' });
        this.accountManagerEmailInput = page.locator('input[name="managerEmail"]');
        this.addressSearchButton = page.getByRole('button', { name: /Search\.\.\./i });
        this.assignBranchCombobox = page.getByRole('combobox', { name: 'Assign to Branch*' });
        this.cancelButton = this.modalFooter.getByRole('button', { name: 'Cancel', exact: true });
        this.saveButton = this.modalFooter.getByRole('button', { name: 'Save', exact: true });
        this.closeButton = page.getByRole('button', { name: 'Close' });
    }

    async goto(): Promise<void> {
        const clientListPage = new ClientListPage(this.page);
        await clientListPage.goto();
        await this.createClientButton.click();
        await this.expectLoaded();
    }

    async expectLoaded(): Promise<void> {
        await expect(this.modal).toBeVisible({ timeout: 20000 });
        await expect(this.modalHeading).toBeVisible({ timeout: 20000 });
    }

    async fillBusinessName(value: string): Promise<void> {
        await this.businessNameInput.fill(value);
    }

    async fillTradingName(value: string): Promise<void> {
        await this.tradingNameInput.fill(value);
    }

    async fillContactName(value: string): Promise<void> {
        await this.contactNameInput.fill(value);
    }

    async fillNzbn(value: string): Promise<void> {
        await this.nzbnInput.fill(value);
    }

    async fillPhone(value: string): Promise<void> {
        await this.phoneInput.fill(value);
    }

    async fillEmail(value: string): Promise<void> {
        await this.emailInput.fill(value);
    }

    async typeEmailWithValidation(value: string): Promise<void> {
        await this.emailInput.click();
        await this.emailInput.clear();
        await this.emailInput.pressSequentially(value, { delay: 40 });
        await this.emailInput.blur();
    }

    async typePhoneWithValidation(value: string): Promise<void> {
        await this.phoneInput.click();
        await this.phoneInput.clear();
        await this.phoneInput.pressSequentially(value, { delay: 40 });
        await this.phoneInput.blur();
    }

    async expectEmailInvalid(): Promise<void> {
        const ariaInvalid = await this.emailInput.getAttribute('aria-invalid');
        if (ariaInvalid !== null) {
            await expect(this.emailInput).toHaveAttribute('aria-invalid', 'true');
            return;
        }

        const isInvalid = await this.emailInput.evaluate((el) => {
            const input = el as HTMLInputElement;
            return input.checkValidity() === false;
        });
        expect(isInvalid).toBeTruthy();
    }

    async expectPhoneInvalid(): Promise<void> {
        const ariaInvalid = await this.phoneInput.getAttribute('aria-invalid');
        if (ariaInvalid !== null) {
            await expect(this.phoneInput).toHaveAttribute('aria-invalid', 'true');
            return;
        }

        const isInvalid = await this.phoneInput.evaluate((el) => {
            const input = el as HTMLInputElement;
            return input.checkValidity() === false;
        });
        expect(isInvalid).toBeTruthy();
    }

    async fillMobile(value: string): Promise<void> {
        await this.mobileInput.fill(value);
    }

    async clickAccountManagerCombobox(): Promise<void> {
        await this.accountManagerCombobox.click();
    }

    async selectAccountManager(searchText: string = 'testy'): Promise<void> {
        await this.clickAccountManagerCombobox();

        const ownerNzOption = this.page.getByRole('option', { name: /Owner NZ/i }).first();
        if (await ownerNzOption.isVisible().catch(() => false)) {
            await ownerNzOption.click();
            return;
        }

        const inputValue = searchText.trim();
        if (!inputValue) {
            return;
        }

        const searchInput = this.page.locator('input[placeholder*="search" i], input[aria-label*="search" i]').first();
        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.fill(inputValue);
        }

        const roleOption = this.page.getByRole('option', { name: new RegExp(escapeForRegex(inputValue), 'i') }).first();
        if (await roleOption.isVisible().catch(() => false)) {
            await roleOption.click();
            return;
        }

        const textOption = this.page.locator('[role="listbox"] *', { hasText: inputValue }).first();
        await textOption.click();
    }

    async clickAddressSearchButton(): Promise<void> {
        await this.addressSearchButton.click();
    }

    async clickAssignBranchCombobox(): Promise<void> {
        await this.assignBranchCombobox.click();
    }

    async selectAssignBranch(preferredBranchName?: string): Promise<void> {
        await this.clickAssignBranchCombobox();

        if (preferredBranchName && preferredBranchName.trim()) {
            const preferredOption = this.page
                .getByRole('option', { name: new RegExp(escapeForRegex(preferredBranchName), 'i') })
                .first();
            if (await preferredOption.isVisible().catch(() => false)) {
                await preferredOption.click();
                return;
            }
        }

        const firstOption = this.page.locator('[role="listbox"] [role="option"]').first();
        await expect(firstOption).toBeVisible({ timeout: 5000 });
        await firstOption.click();
    }

    async clickCancel(): Promise<void> {
        await this.clickModalActionButton(this.cancelButton);
    }

    async clickSave(): Promise<void> {
        await this.clickModalActionButton(this.saveButton);
    }

    private async clickModalActionButton(button: Locator): Promise<void> {
        await expect(this.modal).toBeVisible({ timeout: 10000 });
        await expect(this.modalFooter).toBeVisible({ timeout: 10000 });
        await expect(button).toBeVisible({ timeout: 10000 });
        await expect(button).toBeEnabled({ timeout: 10000 });
        await button.scrollIntoViewIfNeeded();
        await button.click({ timeout: 10000 });
    }

    async expectClosed(): Promise<void> {
        await expect(this.modal).not.toBeVisible({ timeout: 15000 });
    }

    async clickClose(): Promise<void> {
        await this.closeButton.click();
    }

}

function escapeForRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}