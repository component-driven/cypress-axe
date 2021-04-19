import axe from 'axe-core';
import cliReporter from './cli-reporter';
import { assertViolations, isEmptyObjectorNull, logViolations } from './utils';

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
			checkA11y(options?: CypressAxeOptions, label?: string): void;
		}
	}
}

interface CypressAxeOptions {
	axeOptions?: axe.RunOptions;
	shouldFail?: (violations: axe.Result[]) => boolean;
	reporters?: typeof cliReporter[];
}

let CypressAxeDefaultConfig = {
	axeOptions: {},
	shouldFail: (violations: axe.Result[]) => violations.length > 0,
	reporters: [cliReporter],
};

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

export const configureCypressAxe = (options: CypressAxeOptions) => {
	CypressAxeDefaultConfig = { ...CypressAxeDefaultConfig, ...options };
};

const checkA11y = (context?: axe.ElementContext) => (
	options?: CypressAxeOptions,
	label?: string
) => {
	const { axeOptions, shouldFail, reporters } = {
		...CypressAxeDefaultConfig,
		...options,
	};

	cy.window({ log: false })
		.then((win) => {
			if (isEmptyObjectorNull(context)) {
				context = undefined;
			}

			return win.axe
				.run(context || win.document, axeOptions)
				.then(({ violations }) => violations);
		})
		.then((violations) => {
			if (violations.length) {
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
			if (violations.length && shouldFail(violations)) {
				logViolations(violations);
				assertViolations(violations);
				reporters.forEach((reporter) => {
					reporter({
						filename: process.cwd(),
						results: violations,
						label,
					});
				});
			}
		});
};

Cypress.Commands.add('injectAxe', injectAxe);

Cypress.Commands.add('configureAxe', configureAxe);

Cypress.Commands.add(
	'checkA11y',
	{ prevSubject: 'optional' },
	(subject?, options?: CypressAxeOptions, label?: string) => {
		checkA11y(subject)(options, label);
	}
);

Cypress.Commands.add('configureCypressAxe', configureCypressAxe);
