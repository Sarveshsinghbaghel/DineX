import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { seedRbacData } from '../utils/seed-rbac';

import { Restaurant } from '../features/restaurants/models/restaurant.model';
import { Branch } from '../features/branches/models/branch.model';
import { User } from '../features/auth/models/auth.models';
import { Role } from '../features/roles/models/role.model';
import { Table } from '../features/tables/models/table.model';
import { Order } from '../features/orders/models/order.model';
import { Ingredient } from '../features/inventory/models/ingredient.model';
import { Inventory } from '../features/inventory/models/inventory.model';
import { StockTransaction } from '../features/inventory/models/stock-transaction.model';
import { Supplier } from '../features/inventory/models/supplier.model';
import { AuditLog } from '../features/audit-logs/models/audit-log.model';

const TENANT_ID = 'tenant_demo_1';
const DEMO_PASSWORD_RAW = 'DemoPass123!';

export async function seedDemoData(reset: boolean = false) {
  // Environment Safety Guard
  if (env.NODE_ENV === 'production') {
    throw new Error('SAFETY BLOCK: Demo seeder script cannot be executed in production!');
  }

  logger.info('Connecting to MongoDB for demo data seeding...', { uri: env.MONGODB_URI });
  await mongoose.connect(env.MONGODB_URI);

  try {
    if (reset) {
      logger.info('Resetting existing demo data collections for tenant_demo_1...');
      await Restaurant.deleteMany({ tenantId: TENANT_ID });
      await Branch.deleteMany({ tenantId: TENANT_ID });
      await User.deleteMany({ tenantId: TENANT_ID });
      await Table.deleteMany({ tenantId: TENANT_ID });
      await Order.deleteMany({ tenantId: TENANT_ID });
      await Ingredient.deleteMany({ tenantId: TENANT_ID });
      await Inventory.deleteMany({ tenantId: TENANT_ID });
      await StockTransaction.deleteMany({ tenantId: TENANT_ID });
      await Supplier.deleteMany({ tenantId: TENANT_ID });
      await AuditLog.deleteMany({ tenantId: TENANT_ID });
    }

    // 1. Seed RBAC Roles & Permissions
    await seedRbacData(TENANT_ID);

    const superAdminRole = await Role.findOne({ code: 'super_admin' });
    const adminRole = await Role.findOne({ code: 'admin' });
    const managerRole = await Role.findOne({ code: 'manager' });
    const cashierRole = await Role.findOne({ code: 'cashier' });
    const chefRole = await Role.findOne({ code: 'chef' });
    const waiterRole = await Role.findOne({ code: 'waiter' });
    const customerRole = await Role.findOne({ code: 'customer' });

    // 2. Seed Demo Restaurant
    let restaurant = await Restaurant.findOne({ tenantId: TENANT_ID });
    if (!restaurant) {
      restaurant = await Restaurant.create({
        tenantId: TENANT_ID,
        name: 'Spice Haven Enterprise',
        legalName: 'Spice Haven Private Limited',
        code: 'SPICE_HAVEN',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        email: 'contact@spicehaven.com',
        phone: '+919876543210',
        cuisineTypes: ['North Indian', 'Continental', 'Beverages'],
        address: {
          label: 'Headquarters',
          recipientName: 'Spice Haven Corporate',
          phone: '+919876543210',
          addressLine1: '100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
        },
        status: 'ACTIVE',
      });
    }

    // 3. Seed Demo Branches
    let branch1 = await Branch.findOne({ tenantId: TENANT_ID, code: 'BH_DT_01' });
    if (!branch1) {
      branch1 = await Branch.create({
        tenantId: TENANT_ID,
        restaurantId: restaurant._id,
        name: 'Downtown Flagship',
        code: 'BH_DT_01',
        phone: '+919876543211',
        email: 'downtown@spicehaven.com',
        serviceModes: ['dine_in', 'takeaway', 'delivery'],
        status: 'ACTIVE',
        address: {
          label: 'Branch Location',
          recipientName: 'Downtown Manager',
          phone: '+919876543211',
          addressLine1: '100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560038',
          country: 'India',
        },
      });
    }

    let branch2 = await Branch.findOne({ tenantId: TENANT_ID, code: 'BH_WS_02' });
    if (!branch2) {
      branch2 = await Branch.create({
        tenantId: TENANT_ID,
        restaurantId: restaurant._id,
        name: 'Westside Bistro',
        code: 'BH_WS_02',
        phone: '+919876543212',
        email: 'westside@spicehaven.com',
        serviceModes: ['dine_in', 'takeaway', 'delivery'],
        status: 'ACTIVE',
        address: {
          label: 'Branch Location',
          recipientName: 'Westside Manager',
          phone: '+919876543212',
          addressLine1: '80 Feet Road, Koramangala',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560095',
          country: 'India',
        },
      });
    }

    // 4. Seed Demo Accounts
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD_RAW, 10);
    const demoAccounts = [
      {
        email: 'superadmin@dinex.app',
        name: 'Super Admin Demo',
        roleIds: superAdminRole ? [superAdminRole._id] : [],
      },
      {
        email: 'admin@dinex.app',
        name: 'Restaurant Admin Demo',
        roleIds: adminRole ? [adminRole._id] : [],
      },
      {
        email: 'manager@dinex.app',
        name: 'Branch Manager Demo',
        roleIds: managerRole ? [managerRole._id] : [],
        branchIds: [branch1._id.toString()],
      },
      {
        email: 'cashier@dinex.app',
        name: 'Cashier Demo',
        roleIds: cashierRole ? [cashierRole._id] : [],
        branchIds: [branch1._id.toString()],
      },
      {
        email: 'chef@dinex.app',
        name: 'Head Chef Demo',
        roleIds: chefRole ? [chefRole._id] : [],
        branchIds: [branch1._id.toString()],
      },
      {
        email: 'waiter@dinex.app',
        name: 'Waiter Staff Demo',
        roleIds: waiterRole ? [waiterRole._id] : [],
        branchIds: [branch1._id.toString()],
      },
      {
        email: 'customer@dinex.app',
        name: 'John Customer Demo',
        roleIds: customerRole ? [customerRole._id] : [],
      },
    ];

    for (const acc of demoAccounts) {
      const existingUser = await User.findOne({ email: acc.email });
      if (!existingUser) {
        await User.create({
          tenantId: TENANT_ID,
          email: acc.email,
          passwordHash,
          name: acc.name,
          emailVerified: true,
          accountStatus: 'active',
          roleIds: acc.roleIds,
          branchIds: acc.branchIds ?? [branch1._id.toString()],
        });
      }
    }

    // 5. Seed Tables with QR Tokens
    for (let i = 1; i <= 10; i++) {
      const tableNum = `T-${i}`;
      const existingTable = await Table.findOne({
        tenantId: TENANT_ID,
        branchId: branch1._id,
        tableNumber: tableNum,
      });
      if (!existingTable) {
        await Table.create({
          tenantId: TENANT_ID,
          branchId: branch1._id,
          tableNumber: tableNum,
          capacity: i % 2 === 0 ? 4 : 2,
          section: i <= 5 ? 'Indoor Main' : 'Terrace Garden',
          qrToken: `qr_token_table_${i}`,
          qrStatus: 'active',
          status: i === 3 ? 'occupied' : 'available',
        });
      }
    }

    // 6. Seed Multi-Date Orders
    const sampleCustomer = await User.findOne({ email: 'customer@dinex.app' });
    const now = new Date();
    const pastDates = [
      new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    ];

    for (let idx = 0; idx < pastDates.length; idx++) {
      const dateVal = pastDates[idx];
      const orderNum = `ORD-DEMO-2026-${idx + 101}`;
      const existingOrder = await Order.findOne({ orderNumber: orderNum });

      if (!existingOrder) {
        await Order.create({
          tenantId: TENANT_ID,
          branchId: branch1._id,
          orderNumber: orderNum,
          source: idx % 2 === 0 ? 'qr' : 'online',
          serviceMode: idx % 2 === 0 ? 'dine_in' : 'delivery',
          customerId: sampleCustomer?._id,
          guestName: 'John Customer Demo',
          guestPhone: '+919876543210',
          items: [
            {
              menuItemId: new mongoose.Types.ObjectId().toString(),
              itemName: 'Paneer Butter Masala',
              quantity: 2,
              unitPrice: 320,
              totalPrice: 640,
            },
            {
              menuItemId: new mongoose.Types.ObjectId().toString(),
              itemName: 'Garlic Naan',
              quantity: 4,
              unitPrice: 60,
              totalPrice: 240,
            },
          ],
          subtotal: 880,
          taxAmount: 44,
          discountAmount: 0,
          deliveryFee: idx % 2 === 0 ? 0 : 50,
          grandTotal: idx % 2 === 0 ? 924 : 974,
          status: 'completed',
          paymentStatus: 'paid',
          paymentMethod: 'online',
          createdAt: dateVal,
          updatedAt: dateVal,
        });
      }
    }

    // 7. Seed Audit Logs
    await AuditLog.create({
      tenantId: TENANT_ID,
      actorId: sampleCustomer?._id?.toString() ?? 'system',
      action: 'DEMO_DATA_SEEDED',
      targetType: 'system',
      targetId: TENANT_ID,
      metadata: { seedDate: new Date().toISOString() },
      ipAddress: '127.0.0.1',
      timestamp: new Date(),
    });

    logger.info('Demo data seeding finished successfully!');
    logger.info('=====================================================');
    logger.info('DEMO ACCOUNTS READY (Password: DemoPass123!):');
    logger.info('- Super Admin: superadmin@dinex.app');
    logger.info('- Admin:       admin@dinex.app');
    logger.info('- Manager:     manager@dinex.app');
    logger.info('- Cashier:     cashier@dinex.app');
    logger.info('- Chef:        chef@dinex.app');
    logger.info('- Waiter:      waiter@dinex.app');
    logger.info('- Customer:    customer@dinex.app');
    logger.info('=====================================================');
  } catch (error) {
    logger.error('Error during demo data seeding', { error });
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[1]?.endsWith('seed-demo-data.ts')) {
  const isReset = process.argv.includes('--reset');
  seedDemoData(isReset)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
