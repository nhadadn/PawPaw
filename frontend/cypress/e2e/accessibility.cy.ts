describe('Accessibility Tests', () => {
  const axeRules = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'section508'],
    },
  };

  const checkA11y = () => {
    cy.checkA11y(undefined, axeRules, (violations) => {
      const violationData = violations.map(({ id, impact, description, nodes }) => ({
        id,
        impact,
        description,
        nodes: nodes.length,
        target: nodes.map((node) => node.target).flat(),
      }));
      cy.task('table', violationData);
      cy.task('log', JSON.stringify(violationData, null, 2));
      cy.writeFile('accessibility-violations.json', JSON.stringify(violationData, null, 2), {
        flag: 'a+',
      });
    });
  };

  it('Home page should pass accessibility checks', () => {
    cy.visit('/');
    cy.injectAxe();
    checkA11y();
  });

  it('Products page should pass accessibility checks', () => {
    cy.visit('/products');
    cy.injectAxe();
    checkA11y();
  });

  it('Login page should pass accessibility checks', () => {
    cy.visit('/login');
    cy.injectAxe();
    checkA11y();
  });

  it('Cart page should pass accessibility checks', () => {
    cy.visit('/cart');
    cy.injectAxe();
    checkA11y();
  });
});
