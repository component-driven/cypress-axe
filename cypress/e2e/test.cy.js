it('works!', () => {
	cy.visit('/');
	cy.injectAxe();
	cy.checkA11y(undefined, { retries: 20, interval: 10 });
});
