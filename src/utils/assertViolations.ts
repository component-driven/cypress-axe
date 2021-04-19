import axe from 'axe-core';

export function assertViolations(violations: axe.Result[]) {
	assert.equal(
		violations.length,
		0,
		`${violations.length} accessibility violation${
			violations.length === 1 ? '' : 's'
		} ${violations.length === 1 ? 'was' : 'were'} detected`
	);
}
