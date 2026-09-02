export function runFrontendAuthTests() {
  const userPermissions = ['orders.read', 'menu.read'];
  const userRoles = [{ code: 'waiter' }];

  const hasRole = (code: string) => userRoles.some((r) => r.code === code);
  const hasPermission = (code: string) => userPermissions.includes(code);

  if (!hasRole('waiter')) throw new Error('Expected hasRole("waiter") to be true');
  if (hasRole('chef')) throw new Error('Expected hasRole("chef") to be false');
  if (!hasPermission('menu.read'))
    throw new Error('Expected hasPermission("menu.read") to be true');
  if (hasPermission('users.delete'))
    throw new Error('Expected hasPermission("users.delete") to be false');

  return true;
}

runFrontendAuthTests();
