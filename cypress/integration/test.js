it('works!', () => {
	cy.visit('/');
	cy.injectAxe();
	cy.get('button[id="only"]').checkA11y();
	cy.checkA11y();
});
