import { test as base, expect } from '@playwright/test';
import { ClientListPage } from '../pages/clientList.page';
import { CreateClientModal } from '../pages/createClient.modal';

type ClientListFixtures = {
	clientListPage: ClientListPage;
	createClientModal: CreateClientModal;
	gotoCreateClientModal: () => Promise<void>;
	fillBusinessNameStep: (value: string) => Promise<void>;
	fillTradingNameStep: (value: string) => Promise<void>;
	fillContactNameStep: (value: string) => Promise<void>;
	fillNzbnStep: (value: string) => Promise<void>;
	fillPhoneStep: (value: string) => Promise<void>;
	fillEmailStep: (value: string) => Promise<void>;
	typePhoneWithValidationStep: (value: string) => Promise<void>;
	typeEmailWithValidationStep: (value: string) => Promise<void>;
	expectPhoneInvalidStep: () => Promise<void>;
	expectEmailInvalidStep: () => Promise<void>;
	fillMobileStep: (value: string) => Promise<void>;
	clickAccountManagerStep: () => Promise<void>;
	selectAccountManagerStep: (searchText?: string) => Promise<void>;
	clickAddressSearchStep: () => Promise<void>;
	selectAddressFromSuggestionStep: (searchText: string) => Promise<void>;
	clickAssignBranchStep: () => Promise<void>;
	selectAssignBranchStep: (preferredBranchName?: string) => Promise<void>;
	clickCancelCreateClientStep: () => Promise<void>;
	clickSaveCreateClientStep: () => Promise<void>;
	clickCloseCreateClientStep: () => Promise<void>;
	expectCreateClientModalClosedStep: () => Promise<void>;
	expectAddClientSuccessMessageStep: () => Promise<void>;
};

export const test = base.extend<ClientListFixtures>({
	clientListPage: async ({ page }, use) => {
		await use(new ClientListPage(page));
	},

	createClientModal: async ({ page }, use) => {
		await use(new CreateClientModal(page));
	},

	gotoCreateClientModal: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.goto();
		});
	},

	fillBusinessNameStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.fillBusinessName(value);
		});
	},

	fillTradingNameStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.fillTradingName(value);
		});
	},

	fillContactNameStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.fillContactName(value);
		});
	},

	fillNzbnStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.fillNzbn(value);
		});
	},

	fillPhoneStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.fillPhone(value);
		});
	},

	fillEmailStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.fillEmail(value);
		});
	},

	typePhoneWithValidationStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.typePhoneWithValidation(value);
		});
	},

	typeEmailWithValidationStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.typeEmailWithValidation(value);
		});
	},

	expectPhoneInvalidStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.expectPhoneInvalid();
		});
	},

	expectEmailInvalidStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.expectEmailInvalid();
		});
	},

	fillMobileStep: async ({ createClientModal }, use) => {
		await use(async (value: string) => {
			await createClientModal.fillMobile(value);
		});
	},

	clickAccountManagerStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.clickAccountManagerCombobox();
		});
	},

	selectAccountManagerStep: async ({ createClientModal }, use) => {
		await use(async (searchText?: string) => {
			await createClientModal.selectAccountManager(searchText);
		});
	},

	clickAddressSearchStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.clickAddressSearchButton();
		});
	},

	selectAddressFromSuggestionStep: async ({ createClientModal }, use) => {
		await use(async (searchText: string) => {
			await createClientModal.selectAddressFromSuggestion(searchText);
		});
	},

	clickAssignBranchStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.clickAssignBranchCombobox();
		});
	},

	selectAssignBranchStep: async ({ createClientModal }, use) => {
		await use(async (preferredBranchName?: string) => {
			await createClientModal.selectAssignBranch(preferredBranchName);
		});
	},

	clickCancelCreateClientStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.clickCancel();
		});
	},

	clickSaveCreateClientStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.clickSave();
		});
	},

	clickCloseCreateClientStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.clickClose();
		});
	},

	expectCreateClientModalClosedStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.expectClosed();
		});
	},

	expectAddClientSuccessMessageStep: async ({ createClientModal }, use) => {
		await use(async () => {
			await createClientModal.expectAddClientSuccessMessage();
		});
	},
});

export { expect };
