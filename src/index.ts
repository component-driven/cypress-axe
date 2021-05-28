import axe from 'axe-core';
import {
	assertViolations,
	consoleReporter,
	isEmptyOrNullObject,
} from './utils';
import type { CypressAxeOptions } from './types';

let defaultCypressAxeConfig = {
	axeOptions: {},
	shouldFail: (violations: axe.Result[]) => violations,
	violationsCb: consoleReporter,
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
	defaultCypressAxeConfig = { ...defaultCypressAxeConfig, ...options };
};

const checkA11y = (params: {
	context?: axe.ElementContext;
	options?: CypressAxeOptions;
	label?: string;
}) => {
	const { context, label } = params;
	const { axeOptions, shouldFail, violationsCb } = {
		...defaultCypressAxeConfig,
		...params.options,
	};

	cy.window({ log: false })
		.then((win) => {
			const subject = isEmptyOrNullObject(context) ? undefined : context;
			return win.axe
				.run(subject || win.document, axeOptions)
				.then(({ violations }) => violations);
		})
		.then((violations) => cy.wrap(violations, { log: false }))
		.then((violations) => shouldFail(violations))
		.then((failableViolations) => {
			if (failableViolations.length) {
				violationsCb({
					filename: Cypress.spec.name,
					results: failableViolations,
					label,
				});
			}
			return new Promise(resolve => resolve(failableViolations));
		})
		.then((failableViolations) => assertViolations(failableViolations as axe.Result[]));
};

Cypress.Commands.add('injectAxe', injectAxe);

Cypress.Commands.add('configureAxe', configureAxe);

Cypress.Commands.add('configureCypressAxe', configureCypressAxe);

Cypress.Commands.add(
	'checkA11y',
	{ prevSubject: 'optional' },
	(context, options?: CypressAxeOptions, label?: string) => {
		checkA11y({ context, options, label });
	}
);
