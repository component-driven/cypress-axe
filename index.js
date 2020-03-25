Cypress.Commands.add('injectAxe', () => {
  cy.window({ log: false }).then(window => {
    const axe = require('axe-core')
    window.eval(axe.source)
  })
})

Cypress.Commands.add('configureAxe', (configurationOptions = {}) => {
  cy.window({ log: false }).then(win => {
    return win.axe.configure(configurationOptions)
  })
})

Cypress.Commands.add('checkA11y', (context, options, violationCallback, skipFailures = false) => {
  cy.window({ log: false })
    .then(win => {
      if (isEmptyObjectorNull(context)) context = undefined
      if (isEmptyObjectorNull(options)) options = undefined
      if (isEmptyObjectorNull(violationCallback)) violationCallback = undefined
      return win.axe.run(
        context ? (context = context) : (context = win.document),
        options
      )
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
      if(!skipFailures)  {
        assert.equal(
          violations.length,
          0,
          `${violations.length} accessibility violation${
            violations.length === 1 ? '' : 's'
          } ${violations.length === 1 ? 'was' : 'were'} detected`
        )
      } else {
          cy.task('log', violations.length === 0 ? "No violations were detected!": `${violations.length} accessibility violation${
            violations.length === 1 ? '' : 's'
          } ${violations.length === 1 ? 'was' : 'were'} detected`);
          let header = "\n\n---------|impact|\t id|\t help|\t helpUrl|---------\n";
          header = header + "----------------------------------------------------------\n";
          for(let v = 0 ; v < violations.length ; v++) {
            if (v == 0) {
              vDetail = header + `|${violations[v].impact}| ${violations[v].id}| ${violations[v].help}| ${violations[v].helpUrl}|\n`;
            } else {
              vDetail = vDetail + `|${violations[v].impact}| ${violations[v].id}| ${violations[v].help}| ${violations[v].helpUrl}|\n`;
            }
          }
          if (violations.length > 0) {
            cy.task('log',  vDetail);
          }
      }
    })
})

function isEmptyObjectorNull(value) {
  if (value == null) return true
  return Object.entries(value).length === 0 && value.constructor === Object
}
