describe('Accessibility Tests', () => {
  const axeRules = {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'section508'],
    },
    includedImpacts: ['critical'],
    rules: {
      'color-contrast': { enabled: false },
    },
  };

  const checkA11y = () => {
    const terminalLog = (violations) => {
      const violationData = violations.map(({ id, impact, description, nodes }) => ({
        id,
        impact,
        description,
        nodes: nodes.length,
        target: nodes.map((node) => node.target).flat(),
        html: nodes.map((node) => node.html).flat(),
      }));
      cy.task('table', violationData);
      cy.task('log', JSON.stringify(violationData, null, 2));
      cy.writeFile('accessibility-violations.json', JSON.stringify(violationData, null, 2), {
        flag: 'a+',
      });
    };

    // Inject axe core
    cy.injectAxe();

    // Intercept API calls to prevent Network Error
    cy.intercept('GET', '/api/products*', []).as('getProducts');
    cy.intercept('GET', '/api/categories*', []).as('getCategories');

    // Check in light mode
    cy.window().then((win) => {
      win.document.documentElement.classList.remove('dark');
    });
    cy.checkA11y(undefined, axeRules, terminalLog);

    // Check in dark mode
    cy.window().then((win) => {
      win.document.documentElement.classList.add('dark');
    });
    cy.checkA11y(undefined, axeRules, terminalLog);
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
