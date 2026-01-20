describe('Admin Panel Flows', () => {
  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@pawpaw.com',
    name: 'Admin User',
    role: 'admin'
  };

  const mockToken = 'mock-admin-token';

  const mockStats = {
    totalSales: 15000,
    totalOrders: 150,
    totalUsers: 45,
    lowStockProducts: 2,
    recentOrders: [
      { id: '1', customerName: 'John Doe', total: 120, status: 'delivered', createdAt: '2023-01-01' }
    ],
    topProducts: [
      { id: '1', name: 'Cool Shirt', sales: 50, revenue: 1000 }
    ]
  };

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('should redirect unauthenticated users to login', () => {
    cy.visit('/admin/dashboard');
    cy.url().should('include', '/admin/login');
  });

  it('should allow admin to login', () => {
    cy.intercept('POST', '**/api/admin/login', {
      statusCode: 200,
      body: {
        token: mockToken,
        user: mockAdminUser
      }
    }).as('adminLogin');

    cy.intercept('GET', '**/api/admin/dashboard/stats', {
      statusCode: 200,
      body: mockStats
    }).as('getStats');

    cy.visit('/admin/login');
    
    cy.get('input[name="email"]').type('admin@pawpaw.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@adminLogin');
    cy.url().should('include', '/admin/dashboard');
    
    cy.wait('@getStats');
    cy.contains('Dashboard').should('be.visible');
    cy.contains('Ventas Totales').should('be.visible');
    cy.contains('$15,000.00').should('be.visible');
  });

  it('should show error on invalid credentials', () => {
    cy.intercept('POST', '**/api/admin/login', {
      statusCode: 401,
      body: {
        message: 'Credenciales inválidas'
      }
    }).as('adminLoginFail');

    cy.visit('/admin/login');
    
    cy.get('input[name="email"]').type('wrong@pawpaw.com');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();

    cy.wait('@adminLoginFail');
    cy.contains('Credenciales inválidas').should('be.visible');
  });

  it('should manage products (CRUD)', () => {
    // Setup authenticated state
    cy.window().then((window) => {
      window.localStorage.setItem(
        'admin-storage', 
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: mockToken,
            user: mockAdminUser
          },
          version: 0
        })
      );
    });

    const mockProducts = [
      { id: '1', name: 'Product 1', description: 'Desc 1', price: 100, stock: 10, category: 'Toys', imageUrl: '' }
    ];

    cy.intercept('GET', '**/api/admin/products', {
      statusCode: 200,
      body: mockProducts
    }).as('getProducts');

    cy.visit('/admin/products');
    cy.wait('@getProducts');
    cy.contains('Product 1').should('be.visible');

    // Test Create
    cy.intercept('POST', '**/api/admin/products', {
      statusCode: 201,
      body: { id: '2', name: 'New Product', description: 'Description', price: 200, stock: 5, category: 'Food', imageUrl: '' }
    }).as('createProduct');
    
    cy.intercept('GET', '**/api/admin/products', {
        statusCode: 200,
        body: [...mockProducts, { id: '2', name: 'New Product', description: 'Description', price: 200, stock: 5, category: 'Food', imageUrl: '' }]
    }).as('getProductsAfterCreate');

    cy.contains('Nuevo Producto').click();
    cy.get('input[name="name"]').type('New Product');
    cy.get('textarea[name="description"]').type('Description');
    cy.get('input[name="price"]').type('200');
    cy.get('input[name="stock"]').type('5');
    cy.get('input[name="category"]').type('Food');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@createProduct');
    cy.wait('@getProductsAfterCreate');
    cy.contains('New Product').should('be.visible');
  });

  it('should manage categories (CRUD)', () => {
    // Setup authenticated state
    cy.window().then((window) => {
      window.localStorage.setItem(
        'admin-storage', 
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: mockToken,
            user: mockAdminUser
          },
          version: 0
        })
      );
    });

    const mockCategories = [
      { id: '1', name: 'Toys', description: 'Fun toys', image: '' }
    ];

    cy.intercept('GET', '**/api/admin/categories', {
      statusCode: 200,
      body: mockCategories
    }).as('getCategories');

    cy.visit('/admin/categories');
    cy.wait('@getCategories');
    cy.contains('Toys').should('be.visible');

    // Test Create
    cy.intercept('POST', '**/api/admin/categories', {
      statusCode: 201,
      body: { id: '2', name: 'New Category', description: 'Description', image: '' }
    }).as('createCategory');
    
    cy.intercept('GET', '**/api/admin/categories', {
        statusCode: 200,
        body: [...mockCategories, { id: '2', name: 'New Category', description: 'Description', image: '' }]
    }).as('getCategoriesAfterCreate');

    cy.contains('Nueva Categoría').click();
    cy.get('input[name="name"]').type('New Category');
    cy.get('textarea[name="description"]').type('Description');
    cy.get('button[type="submit"]').click();
    
    cy.wait('@createCategory');
    cy.wait('@getCategoriesAfterCreate');
    cy.contains('New Category').should('be.visible');
  });

  it('should navigate between admin pages', () => {
    // Setup authenticated state
    cy.window().then((window) => {
      window.localStorage.setItem(
        'admin-storage', 
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: mockToken,
            user: mockAdminUser
          },
          version: 0
        })
      );
    });

    cy.intercept('GET', '**/api/admin/dashboard/stats', {
      statusCode: 200,
      body: mockStats
    }).as('getStats');

    cy.visit('/admin/dashboard');
    cy.wait('@getStats');

    // Test navigation
    cy.contains('Productos').click();
    cy.url().should('include', '/admin/products');
    
    // Note: Removed "Admin Products (WIP)" check as we now have real content
    cy.contains('Productos').should('be.visible'); // Header title

    cy.contains('Categorías').click();
    cy.url().should('include', '/admin/categories');
    
    // Note: Removed "Admin Categories (WIP)" check as we now have real content
    cy.contains('Categorías').should('be.visible');
    
    cy.contains('Órdenes').click();
    cy.url().should('include', '/admin/orders');
    cy.contains('Órdenes').should('be.visible');

    cy.contains('Inventario').click();
    cy.url().should('include', '/admin/inventory');
    cy.contains('Inventario').should('be.visible');

    cy.contains('Usuarios').click();
    cy.url().should('include', '/admin/users');
    cy.contains('Usuarios').should('be.visible');
  });

  it('should manage orders (CRUD)', () => {
    // Setup authenticated state
    cy.window().then((window) => {
      window.localStorage.setItem(
        'admin-storage', 
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: mockToken,
            user: mockAdminUser
          },
          version: 0
        })
      );
    });

    const mockOrders = [
      { 
        id: '1', 
        userId: 'u1', 
        user: { name: 'John Doe', email: 'john@example.com' },
        items: [{ productId: 'p1', name: 'Product 1', quantity: 2, price: 100 }],
        total: 200, 
        status: 'pending', 
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      }
    ];

    cy.intercept('GET', '**/api/admin/orders', {
      statusCode: 200,
      body: mockOrders
    }).as('getOrders');

    cy.visit('/admin/orders');
    cy.wait('@getOrders');
    cy.contains('John Doe').should('be.visible');
    cy.contains('$200.00').should('be.visible');

    // Test View Details & Status Update
    cy.intercept('GET', '**/api/admin/orders/1', {
      statusCode: 200,
      body: mockOrders[0]
    }).as('getOrderDetails');

    cy.intercept('PATCH', '**/api/admin/orders/1/status', {
      statusCode: 200,
      body: { ...mockOrders[0], status: 'processing' }
    }).as('updateOrderStatus');

    cy.intercept('GET', '**/api/admin/orders', {
        statusCode: 200,
        body: [{ ...mockOrders[0], status: 'processing' }]
    }).as('getOrdersAfterUpdate');

    cy.get('button[title="Ver Detalles"]').click();
    // In details modal
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').contains('Orden #1').should('be.visible');
    cy.get('[role="dialog"]').contains('Processing').click({ force: true });
    
    cy.wait('@updateOrderStatus');
    // Verify modal update (optimistic or re-fetch)
    // Close modal
    cy.get('[role="dialog"]').contains('Cerrar').click({ force: true });
    
    // Verify list update
    cy.wait('@getOrdersAfterUpdate');
    cy.contains('processing').should('be.visible');
  });

  it('should manage inventory (Stock)', () => {
    // Setup authenticated state
    cy.window().then((window) => {
      window.localStorage.setItem(
        'admin-storage', 
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: mockToken,
            user: mockAdminUser
          },
          version: 0
        })
      );
    });

    const mockInventory = [
      { id: '1', name: 'Product 1', sku: 'SKU1', price: 100, stock: 10, category: 'Toys', imageUrl: '' }
    ];

    cy.intercept('GET', '**/api/admin/products', {
      statusCode: 200,
      body: mockInventory
    }).as('getInventory');

    cy.visit('/admin/inventory');
    cy.wait('@getInventory');
    cy.contains('Product 1').should('be.visible');
    cy.contains('10').should('be.visible');

    // Test Update Stock
    cy.intercept('PATCH', '**/api/admin/products/1/stock', {
      statusCode: 200,
      body: { ...mockInventory[0], stock: 20 }
    }).as('updateStock');
    
    cy.intercept('GET', '**/api/admin/products', {
        statusCode: 200,
        body: [{ ...mockInventory[0], stock: 20 }]
    }).as('getInventoryAfterUpdate');

    cy.get('button[title="Actualizar Stock"]').click();
    cy.get('input[type="number"]').clear().type('20');
    cy.contains('Guardar').click();
    
    cy.wait('@updateStock');
    cy.wait('@getInventoryAfterUpdate');
    cy.contains('20').should('be.visible');
  });

  it('should manage users', () => {
    // Setup authenticated state
    cy.window().then((window) => {
      window.localStorage.setItem(
        'admin-storage', 
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: mockToken,
            user: mockAdminUser
          },
          version: 0
        })
      );
    });

    const mockUsers = [
      { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'customer', status: 'active', createdAt: '2023-01-01' }
    ];

    cy.intercept('GET', '**/api/admin/users', {
      statusCode: 200,
      body: mockUsers
    }).as('getUsers');

    cy.visit('/admin/users');
    cy.wait('@getUsers');
    cy.contains('John Doe').should('be.visible');
    
    // Test Role Update
    cy.intercept('PATCH', '**/api/admin/users/u1/role', {
      statusCode: 200,
      body: { ...mockUsers[0], role: 'admin' }
    }).as('updateUserRole');

    cy.get('button[title="Administrar Usuario"]').click();
    // Scope to modal and ensure we click the BUTTON, not the Title "Administrar Usuario"
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').contains('button', 'Admin').click({ force: true });
    
    cy.wait('@updateUserRole');
    // Verify modal update
    // Close modal
    cy.get('[role="dialog"]').contains('Cerrar').click({ force: true });
  });

  it('should logout successfully', () => {
     // Setup authenticated state
     cy.window().then((window) => {
      window.localStorage.setItem(
        'admin-storage', 
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: mockToken,
            user: mockAdminUser
          },
          version: 0
        })
      );
    });

    cy.intercept('GET', '**/api/admin/dashboard/stats', {
      statusCode: 200,
      body: mockStats
    }).as('getStats');

    cy.visit('/admin/dashboard');
    cy.wait('@getStats');

    cy.contains('Cerrar Sesión').click();
    cy.url().should('include', '/admin/login');
    
    // Verify local storage is cleared (or at least auth state is false)
    cy.window().then((window) => {
      const storage = window.localStorage.getItem('admin-storage');
      const parsed = JSON.parse(storage!);
      expect(parsed.state.isAuthenticated).to.eq(false);
      expect(parsed.state.token).to.eq(null);
    });
  });
});
