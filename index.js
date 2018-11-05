Cypress.Commands.add('injectAxe', () => {
  cy.window({ log: false }).then(window => {
    const axe = require('axe-core')
    window.eval(axe.source)
  })
})

Cypress.Commands.add('checkA11y', () => {
  cy.window({ log: false })
    .then(win => {
      return win.axe.run(win.document)
    })
    .then(({ violations }) => {
      if (violations.length) {
        cy.wrap(violations, { log: false }).each(v => {
          Cypress.log({
            name: 'a11y error!',
            consoleProps: () => v,
            message: `${v.id} on ${v.nodes.length} Node${
              v.nodes.length === 1 ? '' : 's'
            }`
          })
        })
      }
      return cy.wrap(violations, { log: false })
    })
    .then(violations => {
      assert.equal(
        violations.length,
        0,
        `${violations.length} accessibility violation${
          violations.length === 1 ? '' : 's'
        } ${violations.length === 1 ? 'was' : 'were'} detected`
      )
    })
})
