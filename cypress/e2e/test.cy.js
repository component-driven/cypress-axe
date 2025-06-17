it('works!', () => {
	cy.visit('/');
	cy.injectAxe();
	cy.checkA11y(undefined, { retries: 0, interval: 10 });
});

it('Check reportOnly flag passes tests', () => {
	cy.visit('https://www.ibm.com/in-en/careers/search');
	cy.injectAxe();
	cy.checkA11y({ reportOnly: true }, { retries: 0, interval: 10 });
});
