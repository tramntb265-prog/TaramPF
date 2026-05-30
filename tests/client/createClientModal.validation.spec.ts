import { test } from '../../src/fixtures/clientList.fixtures';

test.describe('Create Client Modal Validation', () => {
    test('@addClientModal @create_client_validation should validate email and phone while typing', async ({
        gotoCreateClientModal,
        typeEmailWithValidationStep,
        typePhoneWithValidationStep,
        expectEmailInvalidStep,
        expectPhoneInvalidStep,
    }) => {
        await gotoCreateClientModal();

        await typeEmailWithValidationStep('invalid-email');
        await expectEmailInvalidStep();

        await typePhoneWithValidationStep('abc');
        await expectPhoneInvalidStep();

        await typeEmailWithValidationStep('testy131@yopmail.com');
        await typePhoneWithValidationStep('0211234567');
    });
});
