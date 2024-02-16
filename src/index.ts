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
	interval?: number;
	retries?: number;
}

export interface InjectOptions {
	axeCorePath?: string;
}

export const injectAxe = (injectOptions?: InjectOptions) => {
	const fileName =
		injectOptions?.axeCorePath ||
		(typeof require?.resolve === 'function'
			? require.resolve('axe-core/axe.min.js')
			: 'node_modules/axe-core/axe.min.js');
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

function summarizeResults(
	includedImpacts: string[] | undefined,
	violations: axe.Result[]
): axe.Result[] {
	return includedImpacts &&
		Array.isArray(includedImpacts) &&
		Boolean(includedImpacts.length)
		? violations.filter((v) => v.impact && includedImpacts.includes(v.impact))
		: violations;
}

const checkA11y = (
	context?: axe.ElementContext,
	options?: Options,
	resultsCallback?: (results: axe.AxeResults) => void,
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
			if (isEmptyObjectorNull(resultsCallback)) {
				violationCallback = undefined;
			}
			if (isEmptyObjectorNull(violationCallback)) {
				violationCallback = undefined;
			}
			const { includedImpacts, interval, retries, ...axeOptions } =
				options || {};
			let remainingRetries = retries || 0;
			function runAxeCheck(): Promise<{ results: axe.AxeResults, violationResults: axe.Result[] }> {
				return win.axe
					.run(context || win.document, axeOptions)
					.then((results) => {
						const violationResults = summarizeResults(includedImpacts, results.violations);
						if (violationResults.length > 0 && remainingRetries > 0) {
							remainingRetries--;
							return new Promise((resolve) => {
								setTimeout(resolve, interval || 1000);
							}).then(runAxeCheck);
						} else {
							return { results, violationResults };
						}
					});
			}
			return runAxeCheck();
		})
		.then(({ results, violationResults }) => {
			if (resultsCallback) {
				resultsCallback(results)
			}

			if (violationResults.length) {
				if (violationCallback) {
					violationCallback(violationResults);
				}
				violationResults.forEach((v) => {
					const selectors = v.nodes
						.reduce<string[]>((acc, node) => acc.concat(node.target), [])
						.join(', ');

					Cypress.log({
						$el: Cypress.$(selectors),
						name: 'a11y error!',
						consoleProps: () => v,
						message: `${v.id} on ${v.nodes.length} Node${v.nodes.length === 1 ? '' : 's'
							}`,
					});
				});
			}

			return cy.wrap(violationResults, { log: false });
		})
		.then((violations) => {
			if (!skipFailures) {
				assert.equal(
					violations.length,
					0,
					`${violations.length} accessibility violation${violations.length === 1 ? '' : 's'
					} ${violations.length === 1 ? 'was' : 'were'} detected`
				);
			} else if (violations.length) {
				Cypress.log({
					name: 'a11y violation summary',
					message: `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'
						} ${violations.length === 1 ? 'was' : 'were'} detected`,
				});
			}
		});
};

Cypress.Commands.add('injectAxe', injectAxe);

Cypress.Commands.add('configureAxe', configureAxe);

Cypress.Commands.add('checkA11y', checkA11y);
