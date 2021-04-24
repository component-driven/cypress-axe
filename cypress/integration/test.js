it('works!', () => {
	cy.visit('/');
	cy.injectAxe();
	cy.get('button[data-testid="test-btn"]').checkA11y();
	cy.checkA11y();
});
