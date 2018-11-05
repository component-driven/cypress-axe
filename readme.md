# cypress-axe

This package provides two simple [Cypress](https://cypress.io) commands to help test your applications for accessibility issues using [axe-core](https://github.com/dequelabs/axe-core).

## Install and configure

- Add as a dev dependency of your project with: `npm i -D cypress-axe`
- If you don't already have them, install the peer dependencies with: `npm i -D cypress axe-core`
- Include the commands in your Cypress specs by adding `import 'cypress-axe'` to the `Cypress` > `Support` > `index.js` file.

## Commands

### injectAxe

This will inject the `axe-core` runtime into the page under test. You must run this after a call to `cy.visit()` and before you run the `checkA11y` command.

You run this command with `cy.injectAxe()` either in your test, or in a `beforeEach`, as long as the `visit` comes first.

```js
beforeEach(() => {
  cy.visit('http://localhost:9000')
  cy.injectAxe()
})
```

### checkA11y

This will run axe against the document at the point in which it is called. This means you can call this after interacting with your page and uncover accessibility issues introduced as a result of rendering in response to user actions.

```js
it('Has no detectable a11y violations on load', () => {
  // Test the page at initial load
  cy.checkA11y()
})

it('Has no a11y violations after button click', () => {
  // Interact with the page, then check for a11y issues
  cy.get('button').click()
  cy.checkA11y()
})
```

## Output

When accessibility violations are detected, your test will fail and an entry titled "A11Y ERROR!" will be added to the command log for each type of violation found (they will be above the failed assertion). Clicking on those will reveal more specifics about the error in the DevTools console.

![Cypress and DevTools output for passing and failing axe-core audits](cmd_log.png)
