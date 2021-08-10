import axe from 'axe-core';

// TODO: After all handlers
// TODO: Default console reporter

// https://github.com/cypress-io/code-coverage

// Send an event we can subscribe to inside a plugin
after(() => {
	cy.task('cypressAxeAfterAll');
	console.log('🦜🦜🦜🦜 AFTER 🦜🦜🦜🦜');
});

Cypress.on('test:after:run', () => {
	console.log('🦜🦜🦜🦜 test:after:run 🦜🦜🦜🦜');
});

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
			configureCypressAxe: typeof configureCypressAxe;
			checkA11y: typeof checkA11y;
		}
	}
}

type Reporter = (results: RunResults[]) => void;

interface RunResults {
	/** Test file */
	filename: string;
	/** Label passed to checkA11y() */
	label?: string;
	/** All results returned by Axe, including violations and passes */
	results: axe.AxeResults;
}

interface CypressAxeOptions {
	/** Axe options object that is passed to axe.configure() */
	axeOptions?: axe.Spec;
	/** Axe run options object that is passed to each axe.run() call */
	axeRunOptions?: axe.RunOptions;
	/** Returns true when the assertion should fail */
	shouldFail?: (results: axe.AxeResults) => boolean;
	/** Custom reporters */
	reporters?: Reporter[];
}

type CypressAxeRunOptions = Omit<CypressAxeOptions, 'axeOptions'>;

let config: CypressAxeOptions = {};

const shouldFailDefault = ({ violations }: axe.AxeResults) =>
	violations.length > 0;

const formatFailureMessage = (violations: axe.Result[]) =>
	`${violations.length} accessibility violation${
		violations.length === 1 ? '' : 's'
	} ${violations.length === 1 ? 'was' : 'were'} detected`;

const formatViolationMessage = (violation: axe.Result) =>
	`${violation.id} on ${violation.nodes.length} element${
		violation.nodes.length === 1 ? '' : 's'
	}`;

const isEmptyObjectorNull = (value: any) => {
	if (value == null) {
		return true;
	}
	return Object.entries(value).length === 0 && value.constructor === Object;
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

export const configureCypressAxe = ({
	axeOptions = {},
	...options
}: CypressAxeOptions = {}) => {
	cy.window({ log: false }).then((win) => {
		config = { ...config, ...options };
		return win.axe.configure(axeOptions);
	});
};

const checkA11y = (
	context?: axe.ElementContext,
	options?: CypressAxeRunOptions,
	label?: string
) => {
	cy.window({ log: false }).then((win) => {
		if (isEmptyObjectorNull(context)) {
			context = undefined;
		}
		if (isEmptyObjectorNull(options)) {
			options = undefined;
		}
		// TODO: Merge with global options
		const {
			axeRunOptions = {},
			shouldFail = shouldFailDefault,
			reporters = [],
		} = options || {};
		return win.axe
			.run(context || win.document, axeRunOptions)
			.then((results) => {
				// TODO
				reporters.forEach((reporter) => {
					const filename = ''; // TODO
					reporter([{ filename, label, results }]);
				});

				// If we have any violations, fail the run
				if (shouldFail(results)) {
					assert.equal(
						results.violations.length,
						0,
						formatFailureMessage(results.violations)
					);
				}

				// Log each violation type
				if (results.violations.length > 0) {
					results.violations.forEach((violation) => {
						const selectors = violation.nodes
							.reduce<string[]>((acc, node) => acc.concat(node.target), [])
							.join(', ');

						Cypress.log({
							$el: Cypress.$(selectors),
							name: 'Accessibility violation',
							consoleProps: () => violation,
							message: formatViolationMessage(violation),
						});
					});
				}
			});
	});
};

Cypress.Commands.add('injectAxe', injectAxe);

Cypress.Commands.add('configureCypressAxe', configureCypressAxe);

Cypress.Commands.add(
	'checkA11y',
	{
		prevSubject: 'optional',
	},
	checkA11y
);
