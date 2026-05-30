import { test, expect } from '../../src/fixtures/clientList.fixtures';

test.describe('Create Client Modal Tests', () => {
	test('@addClientModal @create_client_happy should create a new client successfully', async ({
		page,
		gotoCreateClientModal,
		fillBusinessNameStep,
		fillTradingNameStep,
		fillContactNameStep,
		fillNzbnStep,
		typeEmailWithValidationStep,
		typePhoneWithValidationStep,
		fillMobileStep,
		selectAccountManagerStep,
		selectAddressFromSuggestionStep,
		selectAssignBranchStep,
		clickSaveCreateClientStep,
		expectCreateClientModalClosedStep,
		expectAddClientSuccessMessageStep,
	}) => {
		const suffix = Date.now();
		const businessName = `Auto Client ${suffix}`;

		await gotoCreateClientModal();
		await fillBusinessNameStep(businessName);
		await fillTradingNameStep(`Auto Trading ${suffix}`);
		await fillContactNameStep('Automation User');
		await fillNzbnStep('1212345678901');
		await typePhoneWithValidationStep('0211234567');
		await typeEmailWithValidationStep(`auto.client.${suffix}@yopmail.com`);
		await fillMobileStep('0217654321');
		await selectAccountManagerStep('Owner NZ');
		await selectAddressFromSuggestionStep('Auckland');
		await selectAssignBranchStep();

		await clickSaveCreateClientStep();
		await expectCreateClientModalClosedStep();
		await expectAddClientSuccessMessageStep();

		const searchInput = page.locator('table input[type="search"]');
		await searchInput.fill(businessName);
		await expect(page.locator('table')).toContainText(businessName);
	});
});
