import mongoose from 'mongoose';
import { Setting } from '../models/setting.model';

export const SYSTEM_DEFAULT_SETTINGS: Record<
  string,
  { value: unknown; valueType: 'string' | 'number' | 'boolean' | 'json' }
> = {
  currency: { value: 'INR', valueType: 'string' },
  timezone: { value: 'Asia/Kolkata', valueType: 'string' },
  'tax.default_rate': { value: 5, valueType: 'number' },
  'service_charge.rate': { value: 0, valueType: 'number' },
  'order.auto_accept': { value: true, valueType: 'boolean' },
  'reservation.advance_days': { value: 7, valueType: 'number' },
};

export async function upsertSetting(
  tenantId: string,
  scope: 'tenant' | 'branch',
  key: string,
  value: unknown,
  branchId?: string,
) {
  let valueType: 'string' | 'number' | 'boolean' | 'json' = 'string';
  if (typeof value === 'number') valueType = 'number';
  else if (typeof value === 'boolean') valueType = 'boolean';
  else if (typeof value === 'object' && value !== null) valueType = 'json';

  const filter: Record<string, unknown> = { tenantId, scope, key };
  if (scope === 'branch' && branchId) {
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  }

  const setting = await Setting.findOneAndUpdate(
    filter,
    {
      tenantId,
      scope,
      branchId: scope === 'branch' && branchId ? new mongoose.Types.ObjectId(branchId) : undefined,
      key,
      value,
      valueType,
      status: 'active',
    },
    { upsert: true, new: true },
  );

  return setting;
}

export async function getEffectiveSettings(tenantId: string, branchId?: string) {
  // 1. System defaults
  const resolved: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(SYSTEM_DEFAULT_SETTINGS)) {
    resolved[key] = item.value;
  }

  // 2. Tenant settings (overrides system defaults)
  const tenantSettings = await Setting.find({ tenantId, scope: 'tenant', status: 'active' });
  for (const s of tenantSettings) {
    resolved[s.key] = s.value;
  }

  // 3. Branch settings (overrides tenant settings if branchId provided)
  if (branchId && mongoose.Types.ObjectId.isValid(branchId)) {
    const branchSettings = await Setting.find({
      tenantId,
      scope: 'branch',
      branchId: new mongoose.Types.ObjectId(branchId),
      status: 'active',
    });
    for (const s of branchSettings) {
      resolved[s.key] = s.value;
    }
  }

  return resolved;
}
