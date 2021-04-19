import axe from 'axe-core';

export interface RunResults {
  filename: string, // Test file
  results: axe.Result[]
  label?: string, // Label passed to checkA11y
}
// TODO
export default function cliReporter(params: RunResults) {
	const { filename, label, results } = params;

	const violationsCount = results.length;
  const moreThanOne = violationsCount > 1;

  cy.task(
    'log',
    `${violationsCount} accessibility violation${moreThanOne ? 's' : ''} ${
      moreThanOne ? 'were' : 'was'
    } detected`
  );

  const violationData = results.map(({ impact, description, nodes }) => {
    return {
      ...label && { label },
			filename,
      impact,
      description,
      count: nodes.length,
    };
  });

  console.table(violationData);
  cy.task('table', violationData);
}
