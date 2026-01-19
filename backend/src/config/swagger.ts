import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Paw Paw Urban Show API',
      version: '1.0.0',
      description: 'API documentation for Paw Paw Urban Show Checkout System',
      contact: {
        name: 'API Support',
        email: 'support@pawpaw.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error code',
            },
            message: {
              type: 'string',
              description: 'Error details',
            },
          },
        },
        ReservationItem: {
          type: 'object',
          properties: {
            product_variant_id: {
              type: 'integer',
              description: 'ID of the product variant',
              example: 1,
            },
            quantity: {
              type: 'integer',
              description: 'Quantity to reserve',
              example: 2,
            },
          },
          required: ['product_variant_id', 'quantity'],
        },
        ReservationResponse: {
          type: 'object',
          properties: {
            reservation_id: {
              type: 'string',
              format: 'uuid',
            },
            user_id: {
              type: 'string',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product_variant_id: { type: 'integer' },
                  quantity: { type: 'integer' },
                  unit_price_cents: { type: 'integer' },
                  total_price_cents: { type: 'integer' },
                  currency: { type: 'string' },
                },
              },
            },
            total_cents: {
              type: 'integer',
            },
            currency: {
              type: 'string',
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
