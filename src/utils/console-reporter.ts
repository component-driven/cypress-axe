import axe from 'axe-core';

export interface RunResults {
  filename: string, // Test file
  results: axe.Result[]
  label?: string, // Label passed to checkA11y
}

export function consoleReporter(params: RunResults) {
	const { filename, label, results } = params;
	const violationsCount = results.length;
  const moreThanOne = violationsCount > 1;

  cy.task(
    'log',
    `${violationsCount} accessibility violation${moreThanOne ? 's' : ''} ${
      moreThanOne ? 'were' : 'was'
    } detected`
  );

  const violationData: Record<string, any> = {};
	results.forEach(({ impact, description, nodes }, idx) => {
    violationData[`${filename}-${idx}`] = {
      ...label && { label },
      impact,
      description,
      count: nodes.length,
    };
  });

  console.table(violationData);
}
