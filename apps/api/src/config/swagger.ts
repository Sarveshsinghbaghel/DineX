export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'DineX Restaurant Management System API',
    version: '1.0.0',
    description: 'API documentation for DineX platform including Phase 20 QR Ordering System.',
  },
  paths: {
    '/api/v1/qr/validate/{token}': {
      get: {
        summary: 'Validate QR token & resolve table context',
        tags: ['QR Ordering'],
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'QR Token resolved to restaurant, branch, and table context.' },
          400: { description: 'Invalid, expired, or deactivated QR token.' },
        },
      },
    },
    '/api/v1/qr/menu/{token}': {
      get: {
        summary: 'Fetch public mobile QR menu and AI recommendations',
        tags: ['QR Ordering'],
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Public menu categories, items, and personalized AI recommendations.' },
          400: { description: 'Invalid QR token.' },
        },
      },
    },
    '/api/v1/qr/checkout/{token}': {
      post: {
        summary: 'Submit customer QR order with server-authoritative pricing',
        tags: ['QR Ordering'],
        parameters: [
          { name: 'token', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  guestName: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        menuItemId: { type: 'string' },
                        quantity: { type: 'number' },
                        variant: { type: 'string' },
                        specialInstructions: { type: 'string' },
                      },
                      required: ['menuItemId', 'quantity'],
                    },
                  },
                },
                required: ['items'],
              },
            },
          },
        },
        responses: {
          201: { description: 'QR Order created and dispatched to kitchen.' },
          400: { description: 'Invalid payload or pricing validation failure.' },
        },
      },
    },
    '/api/v1/qr/order/{orderId}/status': {
      get: {
        summary: 'Get live status and timeline of a QR order',
        tags: ['QR Ordering'],
        parameters: [
          { name: 'orderId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Live order status and timeline progression.' },
          404: { description: 'Order not found.' },
        },
      },
    },
    '/api/v1/qr/tables': {
      post: {
        summary: 'Create table & generate initial secure QR token (Admin/Manager)',
        tags: ['Table QR Lifecycle'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  branchId: { type: 'string' },
                  tableNumber: { type: 'string' },
                  capacity: { type: 'number' },
                  section: { type: 'string' },
                },
                required: ['branchId', 'tableNumber'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Table created with active QR token.' },
        },
      },
    },
    '/api/v1/qr/tables/branch/{branchId}': {
      get: {
        summary: 'List registered tables and QR statuses for a branch (Admin/Manager)',
        tags: ['Table QR Lifecycle'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'branchId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of branch tables.' },
        },
      },
    },
    '/api/v1/qr/tables/{tableId}/generate': {
      post: {
        summary: 'Regenerate secure QR token for a table (Admin/Manager)',
        tags: ['Table QR Lifecycle'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tableId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'QR token regenerated.' },
        },
      },
    },
    '/api/v1/qr/tables/{tableId}/status': {
      patch: {
        summary: 'Activate or deactivate table QR token (Admin/Manager)',
        tags: ['Table QR Lifecycle'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tableId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['active', 'inactive'] },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          200: { description: 'QR token status updated.' },
        },
      },
    },
    '/api/v1/delivery/serviceability': {
      post: {
        summary: 'Check delivery serviceability & calculate delivery fee',
        tags: ['Delivery'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  branchId: { type: 'string' },
                  postalCode: { type: 'string' },
                  orderAmount: { type: 'number' },
                },
                required: ['branchId', 'postalCode'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Serviceability status & calculated delivery fee.' },
        },
      },
    },
    '/api/v1/delivery/checkout': {
      post: {
        summary: 'Submit delivery order with server-authoritative fees & prices',
        tags: ['Delivery'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  branchId: { type: 'string' },
                  deliveryAddress: { type: 'object' },
                  paymentMethod: { type: 'string', enum: ['cod', 'online'] },
                  items: { type: 'array' },
                },
                required: ['branchId', 'deliveryAddress', 'items'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Delivery order created.' },
        },
      },
    },
    '/api/v1/delivery/orders/track/{orderId}': {
      get: {
        summary: 'Track live status and timeline of a delivery order',
        tags: ['Delivery'],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Delivery order tracking info.' } },
      },
    },
    '/api/v1/delivery/orders/staff/branch/{branchId}': {
      get: {
        summary: 'List active and past delivery orders for a branch (Staff/Manager)',
        tags: ['Delivery Staff'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'branchId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Branch delivery orders list.' } },
      },
    },
    '/api/v1/delivery/orders/{orderId}/assign': {
      patch: {
        summary: 'Assign delivery driver to an order (Manager)',
        tags: ['Delivery Staff'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { employeeId: { type: 'string' } },
                required: ['employeeId'],
              },
            },
          },
        },
        responses: { 200: { description: 'Driver assigned.' } },
      },
    },
    '/api/v1/delivery/driver/deliveries': {
      get: {
        summary: 'List assigned active delivery orders for logged-in driver',
        tags: ['Delivery Driver'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Driver assigned deliveries.' } },
      },
    },
    '/api/v1/delivery/orders/{orderId}/status': {
      patch: {
        summary: 'Update delivery status (Picked Up, Out for Delivery, Delivered)',
        tags: ['Delivery Driver / Staff'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled'],
                  },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: { 200: { description: 'Delivery status updated.' } },
      },
    },
  },
};


