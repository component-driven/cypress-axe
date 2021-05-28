import axe from 'axe-core';

export function assertViolations(violations: axe.Result[]) {
	const violationsCount = violations.length;
	const oneViolation = violationsCount === 1;

	assert.equal(
		violationsCount,
		0,
		`${violationsCount} accessibility violation${
			oneViolation ? '' : 's'
		} ${oneViolation ? 'was' : 'were'} detected`
	);
}
