import { z } from 'zod';

export const roleCodeSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(
    /^[a-z0-9_]+$/,
    'Code must be lowercase snake_case containing only letters, numbers, and underscores',
  );

export const permissionCodeSchema = z
  .string()
  .min(3)
  .max(100)
  .regex(
    /^[a-z0-9_-]+\.[a-z0-9_.-]+$/,
    'Permission code must follow resource.action format (e.g. users.read)',
  );

export const permissionScopeSchema = z.enum(['own', 'branch', 'restaurant', 'tenant', 'platform']);

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  code: roleCodeSchema,
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.string().min(1)),
});

export const assignUserRolesSchema = z.object({
  roleIds: z.array(z.string().min(1)).min(1, 'At least one role ID must be provided'),
  branchIds: z.array(z.string()).optional(),
});

export const createPermissionSchema = z.object({
  code: permissionCodeSchema,
  module: z.string().min(2).max(50).trim(),
  action: z.string().min(2).max(50).trim(),
  scope: permissionScopeSchema.default('tenant'),
  description: z.string().max(500).optional(),
});

export const updatePermissionSchema = z.object({
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  scope: permissionScopeSchema.optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
export type AssignUserRolesInput = z.infer<typeof assignUserRolesSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
