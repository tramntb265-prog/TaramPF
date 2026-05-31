import { test, expect } from '../../src/fixtures/clientList.fixtures';

type RequiredFieldName = 'businessName' | 'contactName' | 'email' | 'mobile';

const REQUIRED_FIELD_NAMES: RequiredFieldName[] = ['businessName', 'contactName', 'email', 'mobile'];

const baselineValidData = {
	businessName: 'accounting service',
	tradingName: 'Mt Evan Account',
	contactName: 'Ms Evan',
	nzbn: '',
	phone: '0211234567',
	email: 'testy131@yopmail.com',
	mobile: '0219876543',
	assignBranch: 'Owner NZ',
};

const SQL_PAYLOADS = ["'", "' OR '1'='1", "'; DROP TABLE clients; --"];

async function fillModalFormWithBaseline(
	createClientModal: any,
	overrides?: Partial<Record<RequiredFieldName, string>> & {
		tradingName?: string;
		nzbn?: string;
		phone?: string;
		skipAssignBranch?: boolean;
	}
): Promise<void> {
	const data = {
		...baselineValidData,
		...overrides,
	};

	await createClientModal.fillBusinessName(data.businessName);
	await createClientModal.fillTradingName(data.tradingName);
	await createClientModal.fillContactName(data.contactName);
	await createClientModal.fillNzbn(data.nzbn);
	await createClientModal.fillPhone(data.phone);
	await createClientModal.fillEmail(data.email);
	await createClientModal.fillMobile(data.mobile);

	if (!overrides?.skipAssignBranch) {
		await createClientModal.selectAssignBranch(data.assignBranch);
	}
}

function requiredForInput(createClientModal: any, name: string) {
	return createClientModal.modal
		.locator(`input[name="${name}"]`)
		.locator('xpath=ancestor::div[contains(@class, "flex") and contains(@class, "flex-col")][1]//p')
		.filter({ hasText: /^Required$/i })
		.first();
}

function requiredForAssignBranch(createClientModal: any) {
	return createClientModal.assignBranchCombobox
		.locator('xpath=ancestor::div[contains(@class, "flex") and contains(@class, "flex-col")][1]//p')
		.filter({ hasText: /^Required$/i })
		.first();
}

async function expectOnlyRequiredError(
	createClientModal: any,
	missingField: RequiredFieldName | 'assignBranch'
): Promise<void> {
	for (const field of REQUIRED_FIELD_NAMES) {
		if (field === missingField) {
			await expect(requiredForInput(createClientModal, field)).toBeVisible();
		} else {
			await expect(requiredForInput(createClientModal, field)).toHaveCount(0);
		}
	}

	if (missingField === 'assignBranch') {
		await expect(requiredForAssignBranch(createClientModal)).toBeVisible();
	} else {
		await expect(requiredForAssignBranch(createClientModal)).toHaveCount(0);
	}
}

function assertNoSystemErrorLeaked(createClientModal: any) {
	const errorLeak = createClientModal.page
		.locator('text=/sql|syntax error|database error|exception|stack trace|internal server error/i')
		.first();

	return expect(errorLeak).toHaveCount(0);
}

test.describe('Create Client Modal Tests', () => {
	test.describe.configure({ mode: 'serial' });

	test('@addClientModal @ACM001 should render popup controls and core inputs', async ({
		createClientModal,
	}) => {
		await createClientModal.goto();

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
	}) => {
		await createClientModal.goto();
		await createClientModal.clickSave();

		await expect(requiredForInput(createClientModal, 'businessName')).toBeVisible();
		await expect(requiredForInput(createClientModal, 'contactName')).toBeVisible();
		await expect(requiredForInput(createClientModal, 'email')).toBeVisible();
		await expect(requiredForInput(createClientModal, 'mobile')).toBeVisible();
		await expect(requiredForAssignBranch(createClientModal)).toBeVisible();

		await expect(requiredForInput(createClientModal, 'tradingName')).toHaveCount(0);
		await expect(requiredForInput(createClientModal, 'ABN')).toHaveCount(0);
		await expect(requiredForInput(createClientModal, 'phone')).toHaveCount(0);
	});

	test('@addClientModal @ACM003 should enforce each mandatory field independently', async ({
		createClientModal,
	}) => {
		type MatrixOverrides = Partial<Record<RequiredFieldName, string>> & { skipAssignBranch?: boolean };
		const matrixCases: { missing: RequiredFieldName | 'assignBranch'; overrides: MatrixOverrides }[] = [
			{ missing: 'businessName', overrides: { businessName: '' } },
			{ missing: 'contactName', overrides: { contactName: '' } },
			{ missing: 'email', overrides: { email: '' } },
			{ missing: 'mobile', overrides: { mobile: '' } },
			{ missing: 'assignBranch', overrides: { skipAssignBranch: true } },
		];

		for (const testCase of matrixCases) {
			await createClientModal.goto();
			await fillModalFormWithBaseline(createClientModal, testCase.overrides);

			await createClientModal.clickSave();
			await expectOnlyRequiredError(createClientModal, testCase.missing);
			await createClientModal.clickCancel();
			await createClientModal.expectClosed();
		}
	});

	test('@addClientModal @ACM004 should validate invalid email while address remains untouched', async ({
		createClientModal,
	}) => {
		await createClientModal.goto();
		await fillModalFormWithBaseline(createClientModal, { email: 'ddd' });

		await createClientModal.clickSave();
		await createClientModal.expectEmailInvalid();

		await createClientModal.fillEmail('testy131@yopmail.com');
		await createClientModal.clickSave();
		await expect(createClientModal.emailInput).not.toHaveAttribute('aria-invalid', 'true');

		await expect(createClientModal.addressSearchInput).not.toBeVisible();
	});

	test('@addClientModal @ACM005 should safely handle SQL payloads in text inputs', async ({
		createClientModal,
	}) => {
		const targetInputs = [
			{ name: 'businessName', input: createClientModal.businessNameInput },
			{ name: 'tradingName', input: createClientModal.tradingNameInput },
			{ name: 'contactName', input: createClientModal.contactNameInput },
			{ name: 'ABN', input: createClientModal.nzbnInput },
			{ name: 'phone', input: createClientModal.phoneInput },
			{ name: 'email', input: createClientModal.emailInput },
			{ name: 'mobile', input: createClientModal.mobileInput },
		];

		for (const field of targetInputs) {
			for (const payload of SQL_PAYLOADS) {
				await createClientModal.goto();
				await fillModalFormWithBaseline(createClientModal);

				await field.input.fill(payload);
				await expect(field.input).toHaveValue(payload);

				await createClientModal.clickSave();
				await expect(createClientModal.modal).toBeVisible();
				await assertNoSystemErrorLeaked(createClientModal);
				await expect(createClientModal.successMessage).toHaveCount(0);

				await createClientModal.clickCancel();
				await createClientModal.expectClosed();
			}
		}
	});

	test('@addClientModal @ACM010 should create a new client with mandatory fields only', async ({
		createClientModal,
	}) => {
		const timestamp = Date.now();
		const mandatoryOnlyData = {
			businessName: `Auto Mandatory ${timestamp}`,
			contactName: `Auto Contact ${timestamp}`,
			phone: `021${String(timestamp).slice(-7)}`,
			email: `mandatory.${timestamp}@yopmail.com`,
			mobile: `021${String(timestamp).slice(-7)}`,
		};

		await createClientModal.goto();
		await createClientModal.selectAssignBranch();

		await createClientModal.fillBusinessName(mandatoryOnlyData.businessName);
		await createClientModal.fillContactName(mandatoryOnlyData.contactName);
		await createClientModal.fillPhone(mandatoryOnlyData.phone);
		await createClientModal.fillEmail(mandatoryOnlyData.email);
		await createClientModal.fillMobile(mandatoryOnlyData.mobile);

		await expect(createClientModal.tradingNameInput).toHaveValue('');
		await expect(createClientModal.nzbnInput).toHaveValue('');
		await expect(createClientModal.phoneInput).toHaveValue(mandatoryOnlyData.phone);

		await createClientModal.clickSave();
		await createClientModal.expectAddClientSuccessAndModalClosed();
	});
});
