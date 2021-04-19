import axe from 'axe-core';

export function logViolations(violations: axe.Result[]) {
	Cypress.log({
		name: 'a11y violation summary',
		message: `${violations.length} accessibility violation${
			violations.length === 1 ? '' : 's'
		} ${violations.length === 1 ? 'was' : 'were'} detected`,
	});
}
