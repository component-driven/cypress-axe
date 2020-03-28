const fs = require('fs')

const axe = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8')

export const injectAxe = () => {
  cy.window({ log: false }).then(window => {
    window.eval(axe)
  })
}

export const configureAxe = (configurationOptions = {}) => {
  cy.window({ log: false }).then(win => {
    return win.axe.configure(configurationOptions)
  })
}

const checkA11y = (
  context,
  options,
  violationCallback,
  skipFailures = false
) => {
  cy.window({ log: false })
    .then(win => {
      if (isEmptyObjectorNull(context)) context = undefined
      if (isEmptyObjectorNull(options)) options = undefined
      if (isEmptyObjectorNull(violationCallback)) violationCallback = undefined
      return win.axe.run(context || win.document, options)
    })
    .then(({ violations }) => {
      if (violations.length) {
        if (violationCallback) violationCallback(violations)
        cy.wrap(violations, { log: false }).each(v => {
          const selectors = v.nodes
            .reduce((acc, node) => acc.concat(node.target), [])
            .join(', ')

          Cypress.log({
            $el: Cypress.$(selectors),
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
      if (!skipFailures) {
        assert.equal(
          violations.length,
          0,
          `${violations.length} accessibility violation${
            violations.length === 1 ? '' : 's'
          } ${violations.length === 1 ? 'was' : 'were'} detected`
        )
      } else {
        if (violations.length) {
          Cypress.log({
            name: 'a11y violation summary',
            message: `${violations.length} accessibility violation${
              violations.length === 1 ? '' : 's'
            } ${violations.length === 1 ? 'was' : 'were'} detected`
          })
        }
      }
    })
}

Cypress.Commands.add('injectAxe', injectAxe)

Cypress.Commands.add('configureAxe', configureAxe)

Cypress.Commands.add('checkA11y', checkA11y)

function isEmptyObjectorNull(value) {
  if (value == null) return true
  return Object.entries(value).length === 0 && value.constructor === Object
}
