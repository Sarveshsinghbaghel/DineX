import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/inventory.controller';

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

// Ingredients
inventoryRouter.get(
  '/ingredients',
  requirePermission('inventory.view'),
  controller.listIngredients,
);
inventoryRouter.post(
  '/ingredients',
  requirePermission('inventory.manage'),
  controller.createIngredient,
);

// Inventory Balances & Transactions
inventoryRouter.get('/balances', requirePermission('inventory.view'), controller.listInventory);
inventoryRouter.get('/low-stock', requirePermission('inventory.view'), controller.listLowStock);
inventoryRouter.get(
  '/transactions',
  requirePermission('inventory.view'),
  controller.listTransactions,
);
inventoryRouter.post('/init', requirePermission('inventory.manage'), controller.initInventory);
inventoryRouter.post(
  '/mutate/:actionType',
  requirePermission('inventory.adjust'),
  controller.recordStockMutation,
);

// Suppliers
inventoryRouter.get(
  '/suppliers',
  requirePermission('procurement.manage'),
  controller.listSuppliers,
);
inventoryRouter.post(
  '/suppliers',
  requirePermission('procurement.manage'),
  controller.createSupplier,
);

// Purchase Orders
inventoryRouter.get(
  '/purchase-orders',
  requirePermission('procurement.manage'),
  controller.listPurchaseOrders,
);
inventoryRouter.post(
  '/purchase-orders',
  requirePermission('procurement.manage'),
  controller.createPurchaseOrder,
);
inventoryRouter.post(
  '/purchase-orders/:poId/approve',
  requirePermission('procurement.manage'),
  controller.approvePurchaseOrder,
);
inventoryRouter.post(
  '/purchase-orders/:poId/receive',
  requirePermission('inventory.adjust'),
  controller.receivePurchaseOrder,
);
