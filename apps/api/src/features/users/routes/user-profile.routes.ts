import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/user-profile.controller';

export const userProfileRouter = Router();

userProfileRouter.use(requireAuth);

// --- User Self-Service Profile Endpoints ---
userProfileRouter.get('/me/profile', controller.getOwnProfile);
userProfileRouter.patch('/me/profile', controller.updateOwnProfile);

userProfileRouter.post('/me/avatar', controller.uploadAvatar);
userProfileRouter.delete('/me/avatar', controller.deleteAvatar);

userProfileRouter.get('/me/addresses', controller.getAddresses);
userProfileRouter.post('/me/addresses', controller.addAddress);
userProfileRouter.patch('/me/addresses/:addressId', controller.updateAddress);
userProfileRouter.delete('/me/addresses/:addressId', controller.deleteAddress);

userProfileRouter.get('/me/preferences', controller.getPreferences);
userProfileRouter.patch('/me/preferences', controller.updatePreferences);

// --- Admin User Management Endpoints ---
userProfileRouter.get('/', requirePermission('users.read'), controller.adminListUsers);
userProfileRouter.get('/:userId', requirePermission('users.read'), controller.adminGetUser);
userProfileRouter.patch('/:userId', requirePermission('users.update'), controller.adminUpdateUser);
userProfileRouter.patch(
  '/:userId/status',
  requirePermission('users.update', 'users.activate', 'users.suspend'),
  controller.adminUpdateUserStatus,
);
