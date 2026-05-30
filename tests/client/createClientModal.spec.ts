import { test, expect } from '../../src/fixtures/clientList.fixtures';

test.describe('Create Client Modal Tests', () => {
	test('@addClientModal @ACM001 should render popup controls and core inputs', async ({
		createClientModal,
		gotoCreateClientModal,
	}) => {
		await gotoCreateClientModal();

		await expect(createClientModal.modalHeading).toBeVisible();
		await expect(createClientModal.saveButton).toBeVisible();
		await expect(createClientModal.saveButton).toBeEnabled();
		await expect(createClientModal.cancelButton).toBeVisible();
		await expect(createClientModal.cancelButton).toBeEnabled();
		await expect(createClientModal.closeButton).toBeVisible();
		await expect(createClientModal.closeButton).toBeEnabled();

		await expect(createClientModal.businessNameInput).toBeVisible();
		await expect(createClientModal.tradingNameInput).toBeVisible();
		await expect(createClientModal.contactNameInput).toBeVisible();
		await expect(createClientModal.nzbnInput).toBeVisible();
		await expect(createClientModal.phoneInput).toBeVisible();
		await expect(createClientModal.emailInput).toBeVisible();
		await expect(createClientModal.mobileInput).toBeVisible();

		await expect(createClientModal.addressSearchButton).toContainText(/Search/i);
	});

	test('@addClientModal @ACMM002 should show Required only for mandatory fields on empty submit', async ({
		createClientModal,
		gotoCreateClientModal,
		clickSaveCreateClientStep,
	}) => {
		await gotoCreateClientModal();
		await clickSaveCreateClientStep();

		const requiredForInput = (name: string) =>
			createClientModal.modal
				.locator(`input[name="${name}"]`)
				.locator('xpath=ancestor::div[contains(@class, "flex") and contains(@class, "flex-col")][1]//p')
				.filter({ hasText: /^Required$/i })
				.first();

		const requiredForAssignBranch = createClientModal.assignBranchCombobox
			.locator('xpath=ancestor::div[contains(@class, "flex") and contains(@class, "flex-col")][1]//p')
			.filter({ hasText: /^Required$/i })
			.first();

		await expect(requiredForInput('businessName')).toBeVisible();
		await expect(requiredForInput('contactName')).toBeVisible();
		await expect(requiredForInput('email')).toBeVisible();
		await expect(requiredForInput('mobile')).toBeVisible();
		await expect(requiredForAssignBranch).toBeVisible();

		await expect(requiredForInput('tradingName')).toHaveCount(0);
		await expect(requiredForInput('ABN')).toHaveCount(0);
		await expect(requiredForInput('phone')).toHaveCount(0);
	});
});
