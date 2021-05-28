import { RunResults } from '../types';

export function consoleReporter(rr: RunResults) {
	const { filename, label, results } = rr;
	const violationsCount = results.length;
  const isMoreThanOne = violationsCount > 1;

  cy.task(
    'log',
    `${violationsCount} accessibility violation${isMoreThanOne ? 's' : ''} ${
      isMoreThanOne ? 'were' : 'was'
    } detected.`
  );

	const violationData: Record<string, any> = {};
	results.forEach(({ impact, description, nodes }, idx) => {
		violationData[`${filename} #${idx+1}`] = {
			...label && { label },
			impact,
			description,
			count: nodes.length,
		};
	});

	cy.task('table', violationData);
  console.table(violationData);
}
