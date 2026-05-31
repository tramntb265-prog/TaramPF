import { Page, Locator, expect } from "@playwright/test";
import { ClientListPage } from "./clientList.page";

//const CLIENT_LIST_URL = 'https://dev.flexigrow.app/premium-funding/dashboards/clients/';

export class CreateClientModal {
    readonly page: Page;
    readonly modal: Locator;
    readonly openModal: Locator;
    readonly openAddClientButton: Locator;
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
    readonly addressSearchInput: Locator;
    readonly successMessage: Locator;
    readonly assignBranchCombobox: Locator;
    readonly cancelButton: Locator;
    readonly saveButton: Locator;
    readonly closeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.openModal = page
            .locator('[role="dialog"][data-state="open"]')
            .filter({ has: page.getByRole('heading', { name: /Add Client|Create New Client/i }) })
            .first();
        this.modal = page
            .locator('[role="dialog"]')
            .filter({ has: page.getByRole('heading', { name: /Add Client|Create New Client/i }) })
            .first();
        this.openAddClientButton = page.getByRole('button', { name: /Add Client|Create Client/i }).first();
        this.modalHeading = this.modal.getByRole('heading', { name: /Add Client|Create New Client/i }).first();
        this.businessNameInput = page.locator('input[name="businessName"]');
        this.tradingNameInput = page.locator('input[name="tradingName"]');
        this.contactNameInput = page.locator('input[name="contactName"]');
        this.nzbnInput = page.locator('input[name="ABN"]');
        this.phoneInput = page.locator('input[name="phone"]');
        this.emailInput = page.locator('input[name="email"]');
        this.mobileInput = page.locator('input[name="mobile"]');
        this.accountManagerCombobox = this.modal
            .locator('label', { hasText: /Account Manager/i })
            .first()
            .locator('xpath=following::button[@role="combobox"][1]');
        this.accountManagerEmailInput = page.locator('input[name="managerEmail"]');
        this.addressSearchButton = this.modal.getByRole('button', { name: /Search\.\.\./i }).first();
        this.addressSearchInput = this.page
            .locator('input[placeholder*="search" i], input[aria-label*="search" i]')
            .first();
        this.successMessage = this.page
            .locator('div[role="status"][aria-live="polite"]')
            .filter({ hasText: /add client successfully!?/i })
            .first();
        this.assignBranchCombobox = this.modal
            .locator('label', { hasText: /Assign to Branch/i })
            .first()
            .locator('xpath=following::button[@role="combobox"][1]');
        this.cancelButton = this.modal.getByRole('button', { name: 'Cancel', exact: true }).first();
        this.saveButton = this.modal.getByRole('button', { name: 'Save', exact: true }).first();
        this.closeButton = page.getByRole('button', { name: 'Close' });
    }

    async goto(): Promise<void> {
        const clientListPage = new ClientListPage(this.page);
        await clientListPage.goto();
        await expect(this.openAddClientButton).toBeVisible({ timeout: 10000 });
        await expect(this.openAddClientButton).toBeEnabled({ timeout: 10000 });
        await this.openAddClientButton.scrollIntoViewIfNeeded();
        await this.openAddClientButton.click({ trial: true });
        await this.openAddClientButton.click();
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
        const candidates = [
            this.accountManagerCombobox,
            this.modal.getByRole('combobox').first(),
        ];

        for (const candidate of candidates) {
            if (await candidate.isVisible().catch(() => false)) {
                await candidate.scrollIntoViewIfNeeded();
                await expect(candidate).toBeEnabled({ timeout: 10000 });
                await candidate.click({ trial: true });
                await candidate.click();
                return;
            }
        }

        throw new Error('Account Manager combobox is not visible in Add Client modal.');
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
        await expect(this.addressSearchButton).toBeVisible({ timeout: 10000 });
        await this.addressSearchButton.click();
    }

    async selectAddressFromSuggestion(searchText: string): Promise<void> {
        await this.clickAddressSearchButton();
        await expect(this.addressSearchInput).toBeVisible({ timeout: 10000 });
        await this.addressSearchInput.fill(searchText);

        const firstSuggestion = this.page
            .locator('[role="listbox"] [role="option"], [cmdk-list] [role="option"], [data-radix-popper-content-wrapper] [role="option"]')
            .first();

        await expect(firstSuggestion).toBeVisible({ timeout: 10000 });
        await firstSuggestion.click();
    }

    async clickAssignBranchCombobox(): Promise<void> {
        await this.assignBranchCombobox.click();
    }

    async selectAssignBranch(preferredBranchName?: string): Promise<void> {
        await this.clickAssignBranchCombobox();

        if (preferredBranchName && preferredBranchName.trim()) {
            const preferredName = preferredBranchName.trim();
            const preferredOption = this.page.getByRole('option', {
                name: new RegExp(`^\\s*${escapeForRegex(preferredName)}\\s*$`, 'i')
            }).first();

            if (await this.clickOptionWithRetry(preferredOption)) {
                return;
            }
        }

        const firstOption = this.page.getByRole('option').first();
        if (await this.clickOptionWithRetry(firstOption)) {
            return;
        }

        // Fallback for virtualized menus that frequently detach option nodes.
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
    }

    private async clickOptionWithRetry(option: Locator, maxAttempts: number = 3): Promise<boolean> {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await expect(option).toBeVisible({ timeout: 3000 });
                await option.click({ timeout: 3000 });
                return true;
            } catch {
                if (attempt === maxAttempts) {
                    return false;
                }
            }
        }

        return false;
    }

    async clickCancel(): Promise<void> {
        await this.clickModalActionButton(this.cancelButton);
    }

    async clickSave(): Promise<void> {
        await this.clickModalActionButton(this.saveButton);
    }

    private async clickModalActionButton(button: Locator): Promise<void> {
        await expect(this.modal).toBeVisible({ timeout: 10000 });
        await expect(button).toBeVisible({ timeout: 10000 });
        await expect(button).toBeEnabled({ timeout: 10000 });
        await button.scrollIntoViewIfNeeded();
        await button.click({ timeout: 10000 });
    }

    async expectClosed(): Promise<void> {
        await expect(this.openModal).toHaveCount(0, { timeout: 15000 });
        await expect(this.modal).not.toBeVisible({ timeout: 15000 });
    }

    async expectAddClientSuccessMessage(): Promise<void> {
        await expect(this.successMessage).toContainText(/add client successfully!?/i, { timeout: 15000 });
        await expect(this.successMessage).toBeVisible({ timeout: 15000 });
    }

    async expectAddClientSuccessAndModalClosed(): Promise<void> {
        await Promise.all([
            this.expectAddClientSuccessMessage(),
            this.expectClosed(),
        ]);
    }

    async clickClose(): Promise<void> {
        await this.closeButton.click();
    }

}

function escapeForRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}