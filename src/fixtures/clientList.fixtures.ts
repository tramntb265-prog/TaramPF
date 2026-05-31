import { test as base, expect } from '@playwright/test';
import { ClientListPage } from '../pages/clientList.page';
import { CreateClientModal } from '../pages/createClient.modal';
import { DashboardPage } from '../pages/dashboard.page';

type ClientListFixtures = {
	openDashboardPerTest: void;
	clientListPage: ClientListPage;
	createClientModal: CreateClientModal;
};

export const test = base.extend<ClientListFixtures>({
	openDashboardPerTest: [
		async ({ page }, use) => {
			const dashboardPage = new DashboardPage(page);
			await dashboardPage.goto();
			await use();
		},
		{ auto: true },
	],

	clientListPage: async ({ page }, use) => {
		await use(new ClientListPage(page));
	},

	createClientModal: async ({ page }, use) => {
		await use(new CreateClientModal(page));
	},
});

export { expect };
