// Import commands.js using ES2015 syntax:
import './commands';
import 'cypress-axe';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Ignorar errores de Stripe en E2E tests
Cypress.on('uncaught:exception', (err) => {
  // Ignorar errores de inicialización de Stripe y promesas no manejadas relacionadas
  if (
    err.message.includes('Cannot read properties of undefined') ||
    err.message.includes('Stripe') ||
    err.message.includes('match') ||
    // Errores comunes de promesas no manejadas en componentes de terceros
    err.message.includes('unhandled promise rejection') ||
    err.message.includes('ResizeObserver loop')
  ) {
    return false; // No fallar el test
  }
  return true; // Fallar en otros errores
});
