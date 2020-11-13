export const injectAxe = () => {
	cy.readFile(require.resolve('axe-core/axe.min.js')).then((source) =>
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

//TODO demo how to filter included impacts
// return includedImpacts &&
// 	Array.isArray(includedImpacts) &&
// 	Boolean(includedImpacts.length)
// 	? violations.filter((v) => includedImpacts.includes(v.impact))
// 	: violations;
const checkA11y = (
	// context,
	// options,
	// violationCallback,
	// skipFailures = false
	args
) => {
	let context = args.context;
	let options = args.options; // rename to axeOptions

	cy.window({ log: false }).then((win) => {
		if (isEmptyObjectorNull(context)) {
			context = undefined;
		}
		if (isEmptyObjectorNull(options)) {
			options = undefined;
		}
		const { ...axeOptions } = options || {};
		return win.axe.run(context || win.document, axeOptions);
	});
};

Cypress.Commands.add('injectAxe', injectAxe);

Cypress.Commands.add('configureAxe', configureAxe);

Cypress.Commands.add('checkA11y', checkA11y);

function isEmptyObjectorNull(value) {
	if (value == null) {
		return true;
	}
	return Object.entries(value).length === 0 && value.constructor === Object;
}
