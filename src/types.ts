import axe from 'axe-core';
import { injectAxe, configureAxe, configureCypressAxe } from '.';
import { consoleReporter } from './utils'

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
			configureCypressAxe: typeof configureCypressAxe;
			checkA11y(options?: CypressAxeOptions, label?: string): void;
		}
	}
}

export interface CypressAxeOptions {
	axeOptions?: axe.RunOptions;
	shouldFail?: (violations: axe.Result[]) => axe.Result[];
	violationsCallback?(): typeof consoleReporter;
}

export interface RunResults {
  filename: string,
  results: axe.Result[]
  label?: string,
}
