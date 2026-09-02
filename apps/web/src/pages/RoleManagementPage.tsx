import { useEffect, useState } from 'react';
import { httpClient } from '@/api/http-client';
import { Can } from '@/components/auth/Can';
import type { Role, Permission } from '@x10think/types';

export function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    Promise.all([
      httpClient.get<{ data: Role[] }>('/roles'),
      httpClient.get<{ data: Permission[] }>('/permissions'),
    ])
      .then(([rolesRes, permsRes]) => {
        setRoles(rolesRes.data.data);
        setPermissions(permsRes.data.data);
        if (rolesRes.data.data.length > 0) {
          setSelectedRole(rolesRes.data.data[0]);
        }
      })
      .catch((err) => console.error('Failed to load RBAC data:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-slate-300">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Roles & Permissions Management</h1>
          <p className="text-sm text-slate-400">
            Configure access levels, system roles, and capability matrix.
          </p>
        </div>
        <Can do="roles.manage">
          <button className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-sm transition-colors">
            + Create Custom Role
          </button>
        </Can>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3">
          <h2 className="text-lg font-semibold text-white mb-2">System & Custom Roles</h2>
          {roles.map((role) => (
            <button
              key={role._id}
              onClick={() => setSelectedRole(role)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedRole?._id === role._id
                  ? 'bg-amber-500/10 border-amber-500 text-white'
                  : 'bg-slate-900/50 border-slate-700/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{role.name}</span>
                {role.isSystem ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                    System
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                {role.description || role.code}
              </p>
            </button>
          ))}
        </div>

        {/* Role Detail & Permissions Matrix */}
        <div className="md:col-span-2 bg-slate-800/80 border border-slate-700 rounded-xl p-6 space-y-6">
          {selectedRole ? (
            <>
              <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedRole.name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-1">Code: {selectedRole.code}</p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    selectedRole.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {selectedRole.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Assigned Capabilities & Permissions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                  {permissions.map((perm) => {
                    const isAssigned =
                      selectedRole.permissionIds?.includes(perm._id) ||
                      selectedRole.code === 'super_admin';
                    return (
                      <div
                        key={perm._id}
                        className={`p-3 rounded-lg border flex items-start space-x-3 text-xs ${
                          isAssigned
                            ? 'bg-slate-900 border-amber-500/40 text-white'
                            : 'bg-slate-900/30 border-slate-800 text-slate-500 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          disabled={selectedRole.isSystem}
                          readOnly
                          className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                        <div>
                          <div className="font-mono font-medium">{perm.code}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {perm.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Select a role to inspect permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
