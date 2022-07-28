import * as axe from 'axe-core';

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

export type AlertLevels =
	| false
	| ['minor' | 'moderate' | 'serious' | 'critical'];

export const injectAxe = () => {
	const fileName =
		typeof require?.resolve === 'function'
			? require.resolve('axe-core/axe.min.js')
			: 'node_modules/axe-core/axe.min.js';
	cy.readFile<string>(fileName).then((source) =>
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
	failOn: AlertLevels = false
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
			const violated =
				failOn &&
				Array.isArray(failOn) &&
				Boolean(failOn.length) &&
				violations.filter((v) => v.impact && failOn.includes(v.impact));

			if (violated) {
				assert.equal(
					violated.length,
					0,
					`Failure set on errors type ${failOn}
					${violated.length} accessibility violation${violated.length === 1 ? '' : 's'} ${
						violated.length === 1 ? 'was' : 'were'
					} detected`
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
