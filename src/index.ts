import axe from 'axe-core';

declare global {
	interface Window {
		axe: typeof axe;
	}
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Cypress {
		interface Chainable {
			injectAxe: typeof injectAxe;
			configureAxe: typeof configureAxe;
			checkA11y: typeof checkA11y;
		}
	}
}

export interface Options extends axe.RunOptions {
	includedImpacts?: string[];
}

export const injectAxe = () => {
	cy.readFile<string>(require.resolve('axe-core/axe.min.js')).then((source) =>
		cy.window({ log: false }).then((window) => {
			window.eval(source);
		})
	);
};

export const configureAxe = (configurationOptions = {}) => {
	cy.window({ log: false }).then((win) => {
		return win.axe.configure(configurationOptions);
	});
};

function isEmptyObjectorNull(value: any) {
	if (value == null) {
		return true;
	}
	return Object.entries(value).length === 0 && value.constructor === Object;
}

const checkA11y = (
	context?: axe.ElementContext,
	options?: Options,
	violationCallback?: (violations: axe.Result[]) => void,
	skipFailures = false
) => {
	cy.window({ log: false })
		.then((win) => {
			if (isEmptyObjectorNull(context)) {
				context = undefined;
			}
			if (isEmptyObjectorNull(options)) {
				options = undefined;
			}
			if (isEmptyObjectorNull(violationCallback)) {
				violationCallback = undefined;
			}
			const { includedImpacts, ...axeOptions } = options || {};
			return win.axe
				.run(context || win.document, axeOptions)
				.then(({ violations }) => {
					return includedImpacts &&
						Array.isArray(includedImpacts) &&
						Boolean(includedImpacts.length)
						? violations.filter(
								(v) => v.impact && includedImpacts.includes(v.impact)
						  )
						: violations;
				});
		})
		.then((violations) => {
			if (violations.length) {
				if (violationCallback) {
					violationCallback(violations);
				}
				violations.forEach((v) => {
					const selectors = v.nodes
						.reduce<string[]>((acc, node) => acc.concat(node.target), [])
						.join(', ');

					Cypress.log({
						$el: Cypress.$(selectors),
						name: 'a11y error!',
						consoleProps: () => v,
						message: `${v.id} on ${v.nodes.length} Node${
							v.nodes.length === 1 ? '' : 's'
						}`,
					});
				});
			}

			return cy.wrap(violations, { log: false });
		})
		.then((violations) => {
			if (!skipFailures) {
				assert.equal(
					violations.length,
					0,
					`${violations.length} accessibility violation${
						violations.length === 1 ? '' : 's'
					} ${violations.length === 1 ? 'was' : 'were'} detected`
				);
			} else if (violations.length) {
				Cypress.log({
					name: 'a11y violation summary',
					message: `${violations.length} accessibility violation${
						violations.length === 1 ? '' : 's'
					} ${violations.length === 1 ? 'was' : 'were'} detected`,
				});
			}
		});
};

Cypress.Commands.add('injectAxe', injectAxe);

Cypress.Commands.add('configureAxe', configureAxe);

Cypress.Commands.add('checkA11y', checkA11y);
