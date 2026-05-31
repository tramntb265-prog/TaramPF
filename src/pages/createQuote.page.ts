import { Page, Locator, expect } from "@playwright/test";

export type MinimumClientData = {
    businessName: string;
    contactName: string;
    phone: string;
    email: string;
    mobile: string;
};

export class CreateQuotePage {
    readonly page: Page;
    readonly createActionButton: Locator;
    readonly anyForm: Locator;
    readonly quoteToSection: Locator;
    readonly addClientInQuoteToButton: Locator;

    readonly clientPickerDialog: Locator;
    readonly addNewClientButtonInPicker: Locator;

    readonly addClientModal: Locator;
    readonly addClientModalHeading: Locator;
    readonly businessNameInput: Locator;
    readonly contactNameInput: Locator;
    readonly phoneInput: Locator;
    readonly emailInput: Locator;
    readonly mobileInput: Locator;
    readonly assignBranchCombobox: Locator;
    readonly saveClientButton: Locator;
    readonly addClientSuccessMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.createActionButton = page.getByRole('button', { name: /^Create$/i }).first();
        this.anyForm = page.locator('form').first();

        this.quoteToSection = page
            .locator('section, div')
            .filter({ hasText: /Quote To/i })
            .first();
        this.addClientInQuoteToButton = this.quoteToSection.getByRole('button', { name: /Add Client|Create Client/i }).first();

        this.clientPickerDialog = page
            .locator('[role="dialog"]')
            .filter({ has: page.getByRole('heading', { name: /^Client$/i }) })
            .first();
        this.addNewClientButtonInPicker = this.clientPickerDialog.getByRole('button', { name: /Add New Client/i }).first();

        this.addClientModal = page
            .locator('[role="dialog"]')
            .filter({ has: page.getByRole('heading', { name: /Add Client|Create New Client/i }) })
            .first();
        this.addClientModalHeading = this.addClientModal
            .getByRole('heading', { name: /Add Client|Create New Client/i })
            .first();

        this.businessNameInput = page.locator('input[name="businessName"]').first();
        this.contactNameInput = page.locator('input[name="contactName"]').first();
        this.phoneInput = page.locator('input[name="phone"]').first();
        this.emailInput = page.locator('input[name="email"]').first();
        this.mobileInput = page.locator('input[name="mobile"]').first();

        this.assignBranchCombobox = this.addClientModal
            .locator('label', { hasText: /Assign to Branch/i })
            .first()
            .locator('xpath=following::button[@role="combobox"][1]');
        this.saveClientButton = this.addClientModal.getByRole('button', { name: /^Save$/i }).first();
        this.addClientSuccessMessage = page
            .locator('div[role="status"][aria-live="polite"]')
            .filter({ hasText: /add client successfully!?/i })
            .first();
    }

    async expectLoaded(): Promise<void> {
        await expect(this.page).toHaveURL(/quote/i, { timeout: 15000 });

        await expect
            .poll(async () => {
                return (
                    (await this.anyForm.isVisible().catch(() => false)) ||
                    (await this.createActionButton.isVisible().catch(() => false))
                );
            }, { timeout: 10000, message: 'Expected Create Quote screen to show a form or create action.' })
            .toBeTruthy();
    }

    async openAddClientFromQuoteTo(): Promise<void> {
        if (await this.addClientInQuoteToButton.isVisible().catch(() => false)) {
            await this.addClientInQuoteToButton.click();
        } else {
            await this.page.getByRole('button', { name: /Add Client|Create Client/i }).first().click();
        }

        const hasDirectAddClientModal = await this.addClientModalHeading.isVisible().catch(() => false);
        if (hasDirectAddClientModal) {
            return;
        }

        const hasClientPicker = await this.clientPickerDialog.isVisible().catch(() => false);
        if (hasClientPicker) {
            await expect(this.addNewClientButtonInPicker).toBeVisible({ timeout: 10000 });
            await this.addNewClientButtonInPicker.click();
        }

        await expect(this.addClientModalHeading).toBeVisible({ timeout: 10000 });
    }

    async selectAssignBranch(): Promise<void> {
        await expect(this.assignBranchCombobox).toBeVisible({ timeout: 10000 });
        await this.assignBranchCombobox.click();

        const firstOption = this.page.getByRole('option').first();
        if (await this.clickOptionWithRetry(firstOption)) {
            return;
        }

        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
    }

    async addClientWithMinimumData(data: MinimumClientData): Promise<void> {
        await this.openAddClientFromQuoteTo();

        // In this form, selecting branch can trigger a re-render that clears typed values.
        await this.selectAssignBranch();

        await this.businessNameInput.fill(data.businessName);
        await this.contactNameInput.fill(data.contactName);
        await this.phoneInput.fill(data.phone);
        await this.emailInput.fill(data.email);
        await this.mobileInput.fill(data.mobile);

        await expect(this.businessNameInput).toHaveValue(data.businessName);
        await expect(this.contactNameInput).toHaveValue(data.contactName);
        await expect(this.phoneInput).toHaveValue(data.phone);
        await expect(this.emailInput).toHaveValue(data.email);
        await expect(this.mobileInput).toHaveValue(data.mobile);

        await this.saveClientButton.click();

        await Promise.all([
            expect(this.addClientSuccessMessage).toBeVisible({ timeout: 15000 }),
            expect(this.addClientModal).not.toBeVisible({ timeout: 15000 }),
        ]);
    }

    async expectQuoteToContainsClientInfo(data: MinimumClientData): Promise<void> {
        await expect(this.quoteToSection).toBeVisible({ timeout: 10000 });

        const normalizedContactName = normalizeText(data.contactName);
        const normalizedBusinessName = normalizeText(data.businessName);

        await expect
            .poll(async () => {
                const sectionText = normalizeText(await this.quoteToSection.innerText());
                return (
                    sectionText.includes(normalizedContactName) &&
                    sectionText.includes(normalizedBusinessName)
                );
            }, {
                timeout: 15000,
                message: 'Expected Quote To section to display the newly added client info.',
            })
            .toBeTruthy();
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
}

function normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim().toLowerCase();
}
