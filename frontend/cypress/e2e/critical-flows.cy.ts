describe('Paw Paw Urban Show Critical Flows', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockToken = 'mock-jwt-token';

  const mockProduct = {
    id: 'prod-1',
    name: 'Urban Skate Tee',
    description: 'High quality cotton tee',
    price: 25, // $25.00 (Assuming frontend handles units, or we fix expectation)
    category: 'Clothing',
    images: ['https://example.com/tee.jpg'],
    variants: [{ id: 'var-1', size: 'M', color: 'Black', stock: 10 }],
  };

  const mockCartItem = {
    id: 'var-1',
    name: 'Urban Skate Tee',
    price: 25,
    image: 'https://example.com/tee.jpg',
    quantity: 1,
  };

  beforeEach(() => {
    // Reset DB state (if we were using real backend) or clear local storage
    cy.clearLocalStorage();
  });

  it('Flow 0: Accessibility Check (Home)', () => {
    cy.visit('/');
    cy.injectAxe();
    // Check for accessibility violations
    // We can configure specific rules or ignore some if needed
    cy.checkA11y(
      undefined,
      {
        includedImpacts: ['critical', 'serious'],
        rules: {
          'color-contrast': { enabled: false }, // TODO: Fix contrast issues in design system
        },
      },
      (violations) => {
        cy.task(
          'log',
          `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${violations.length === 1 ? 'was' : 'were'} detected`
        );
        const violationData = violations.map(({ id, impact, description, nodes }) => ({
          id,
          impact,
          description,
          nodes: nodes.length,
        }));
        cy.task('table', violationData);
      }
    );
  });

  it('Flow 1: Product Discovery', () => {
    // Mock API response
    cy.intercept('GET', '**/api/products*', {
      statusCode: 200,
      body: [mockProduct],
    }).as('getProducts');

    cy.visit('/products');
    cy.wait('@getProducts');

    // Verify product is visible
    cy.contains('Urban Skate Tee').should('be.visible');
    cy.contains('$25.00').should('be.visible');

    // Filter interaction (mocking)
    cy.intercept('GET', '**/api/products?*category=clothing*', {
      statusCode: 200,
      body: [mockProduct],
    }).as('filterProducts');

    // Assuming there are filters in the UI
    // cy.get('[data-testid="category-filter"]').select('clothing');
    // cy.wait('@filterProducts');

    // Navigate to details
    cy.intercept('GET', `**/api/products/${mockProduct.id}`, {
      statusCode: 200,
      body: mockProduct,
    }).as('getProductDetail');

    cy.contains('Urban Skate Tee').click();
    cy.url().should('include', `/products/${mockProduct.id}`);
    cy.wait('@getProductDetail');
    cy.contains('High quality cotton tee').should('be.visible');
  });

  it('Flow 2: Add to Cart', () => {
    cy.intercept('GET', `**/api/products/${mockProduct.id}`, {
      statusCode: 200,
      body: mockProduct,
    }).as('getProductDetail');

    cy.visit(`/products/${mockProduct.id}`);
    cy.wait('@getProductDetail');

    // Select variant (M)
    cy.contains('button', 'M').click();

    // Add to cart
    cy.contains('button', 'Agregar al Carrito').click(); // Adjust text based on UI

    // Verify cart badge or notification
    // cy.get('.cart-badge').should('contain', '1');

    // Go to cart
    cy.visit('/cart');
    cy.contains('Urban Skate Tee').should('be.visible');
    cy.contains('$25.00').should('be.visible');
  });

  it('Flow 3: Checkout (Critical)', () => {
    // 1. Setup Auth
    window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        },
        version: 0,
      })
    );

    // 2. Setup Cart
    window.localStorage.setItem(
      'cart-storage',
      JSON.stringify({
        state: {
          items: [mockCartItem],
        },
        version: 0,
      })
    );

    // 3. Visit Checkout
    cy.visit('/checkout');

    // Fill Reservation Form
    cy.get('input[name="fullName"]').type(mockUser.name);
    cy.get('input[name="email"]').type(mockUser.email);
    cy.get('input[name="address"]').type('123 Test St');
    cy.get('input[name="city"]').type('Test City');
    cy.get('input[name="state"]').type('Test State');
    cy.get('input[name="zipCode"]').type('12345');
    cy.get('input[name="phone"]').type('1234567890');

    // 4. Reserve Step & Payment Intent
    cy.intercept('POST', '**/api/checkout/reserve', {
      statusCode: 200,
      body: {
        reservation_id: 'res-123',
        status: 'reserved',
        expires_at: new Date(Date.now() + 15 * 60000).toISOString(), // 15 mins
        total_amount: 25000,
        currency: 'mxn',
        items: [
          {
            product_variant_id: 1,
            quantity: 1,
            price_at_time: 25000,
            product_name: 'Premium Dog Food',
          },
        ],
      },
    }).as('reserveStock');

    cy.intercept('POST', '**/api/checkout/create-payment-intent', {
      statusCode: 200,
      body: {
        client_secret: 'pi_test_secret_123',
        payment_intent_id: 'pi_123',
        amount: 25000,
        currency: 'mxn',
      },
    }).as('createPaymentIntent');

    cy.contains('Continuar al Pago').click();

    cy.wait('@reserveStock');
    cy.wait('@createPaymentIntent');

    // 5. Payment Step (Mock Stripe)
    // Since we can't easily interact with Stripe iframe in Cypress without plugins,
    // we will mock the "Pay" action if possible or check that the form is present.
    cy.contains('Detalles del Pago').should('be.visible');

    // Note: To fully test payment, we'd need to mock stripe.confirmPayment
    // For this level, ensuring we reached the payment step with a client_secret is good.
  });

  it('Flow 4: User Profile', () => {
    // Login
    window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          user: mockUser,
          token: mockToken,
          isAuthenticated: true,
        },
        version: 0,
      })
    );

    cy.intercept('GET', '**/api/orders', {
      statusCode: 200,
      body: [
        {
          id: 'order-1',
          order_number: 'ORD-001',
          total_amount: 2500,
          status: 'paid',
          created_at: new Date().toISOString(),
          items: [mockCartItem],
        },
      ],
    }).as('getOrders');

    cy.visit('/profile');
    cy.wait('@getOrders');

    // Click "Pedidos" tab to see the list
    cy.contains('Pedidos').click();

    cy.contains('Pedido #order-1').should('be.visible');
    cy.contains('Pagado').should('be.visible');
  });
});
