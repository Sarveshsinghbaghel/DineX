import type mongoose from 'mongoose';
import { PERMISSION_CATALOG, DEFAULT_ROLE_PERMISSIONS, SYSTEM_ROLES } from '@x10think/constants';
import { Permission } from '../features/permissions/models/permission.model';
import { Role } from '../features/roles/models/role.model';
import { logger } from '../config/logger';

export async function seedRbacData(tenantId?: string) {
  logger.info('Seeding RBAC permissions and default roles...');

  // 1. Seed Permissions Catalog
  const permMap = new Map<string, string>(); // code -> ObjectId string

  for (const pDef of PERMISSION_CATALOG) {
    const existing = await Permission.findOne({ code: pDef.code });
    if (existing) {
      existing.module = pDef.module;
      existing.action = pDef.action;
      existing.scope = pDef.scope;
      existing.description = pDef.description;
      existing.isSystem = true;
      await existing.save();
      permMap.set(pDef.code, String(existing._id));
    } else {
      const created = await Permission.create({
        code: pDef.code,
        module: pDef.module,
        action: pDef.action,
        scope: pDef.scope,
        description: pDef.description,
        status: 'active',
        isSystem: true,
      });
      permMap.set(pDef.code, String(created._id));
    }
  }

  // 2. Seed 7 System Roles
  const roleDisplayNames: Record<string, string> = {
    [SYSTEM_ROLES.CUSTOMER]: 'Customer',
    [SYSTEM_ROLES.WAITER]: 'Waiter',
    [SYSTEM_ROLES.CHEF]: 'Chef',
    [SYSTEM_ROLES.CASHIER]: 'Cashier',
    [SYSTEM_ROLES.MANAGER]: 'Manager',
    [SYSTEM_ROLES.ADMIN]: 'Admin',
    [SYSTEM_ROLES.SUPER_ADMIN]: 'Super Admin',
  };

  for (const [codeKey, roleCode] of Object.entries(SYSTEM_ROLES)) {
    const allowedPermCodes = DEFAULT_ROLE_PERMISSIONS[roleCode] ?? [];
    const permissionObjectIds = allowedPermCodes
      .map((code) => permMap.get(code))
      .filter((id): id is string => Boolean(id));

    const existingRole = await Role.findOne({ code: roleCode, tenantId: tenantId ?? null });
    if (existingRole) {
      existingRole.permissionIds = permissionObjectIds as unknown as mongoose.Types.ObjectId[];
      existingRole.isSystem = true;
      existingRole.status = 'active';
      await existingRole.save();
    } else {
      await Role.create({
        tenantId: tenantId ?? undefined,
        name: roleDisplayNames[roleCode] ?? codeKey,
        code: roleCode,
        description: `System default role for ${roleDisplayNames[roleCode] ?? roleCode}`,
        permissionIds: permissionObjectIds,
        status: 'active',
        isSystem: true,
      });
    }
  }

  logger.info('RBAC seeding completed successfully.');
}
