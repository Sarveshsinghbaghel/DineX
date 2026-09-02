# User & Profile Management Architecture — DineX

This document describes the design and implementation of **User & Profile Management** for **DineX**.

## 1. Overview & Capabilities

The User & Profile Management system provides:

1. **User Profile Self-Service**: Whitelisted profile updates, Cloudinary avatar upload/replacement/deletion, address management (max 10, single default constraint), and user preferences.
2. **Admin User Management**: Search (name, email, phone), filters (role, status, email verification, branch), server-side pagination, user details inspection, and account status transitions (`active`, `inactive`, `suspended`, `pending_verification`, `locked`).
3. **Security Controls**: Server-side RBAC, strict request body field whitelisting (preventing mass assignment of roles, permissions, passwords, or tenant IDs), IDOR protection, and audit logging.

---

## 2. API Endpoints

### User Self-Service Endpoints (`/users/me`)

| Endpoint                                | Method | Description                                                             | Access             |
| --------------------------------------- | ------ | ----------------------------------------------------------------------- | ------------------ |
| `/api/v1/users/me/profile`              | GET    | Retrieve caller's full user profile                                     | Authenticated User |
| `/api/v1/users/me/profile`              | PATCH  | Update profile (`firstName`, `lastName`, `phone`, `locale`, `timezone`) | Authenticated User |
| `/api/v1/users/me/avatar`               | POST   | Upload/replace profile avatar                                           | Authenticated User |
| `/api/v1/users/me/avatar`               | DELETE | Delete avatar asset                                                     | Authenticated User |
| `/api/v1/users/me/addresses`            | GET    | List saved addresses                                                    | Authenticated User |
| `/api/v1/users/me/addresses`            | POST   | Add saved address (Max 10 limit)                                        | Authenticated User |
| `/api/v1/users/me/addresses/:addressId` | PATCH  | Update address / set default                                            | Authenticated User |
| `/api/v1/users/me/addresses/:addressId` | DELETE | Remove address                                                          | Authenticated User |
| `/api/v1/users/me/preferences`          | GET    | Read theme, language, notifications, dietary preferences                | Authenticated User |
| `/api/v1/users/me/preferences`          | PATCH  | Update preferences                                                      | Authenticated User |

### Admin User Management Endpoints (`/users`)

| Endpoint                       | Method | Description                                                     | Permission Required                                 |
| ------------------------------ | ------ | --------------------------------------------------------------- | --------------------------------------------------- |
| `/api/v1/users`                | GET    | Search, filter, and paginate all users                          | `users.read`                                        |
| `/api/v1/users/:userId`        | GET    | Inspect specific user profile                                   | `users.read`                                        |
| `/api/v1/users/:userId`        | PATCH  | Admin update permitted user data                                | `users.update`                                      |
| `/api/v1/users/:userId/status` | PATCH  | Update account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`, etc.) | `users.update` / `users.activate` / `users.suspend` |

---

## 3. Data Architecture & Schema

### User Schema Extensions (`apps/api/src/features/auth/models/auth.models.ts`)

```typescript
export interface UserDocument extends Document {
  name: string;
  email: string;
  phone?: string;
  accountStatus: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'locked';
  statusReason?: string;
  profile?: {
    firstName: string;
    lastName: string;
    displayName?: string;
  };
  avatar?: {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
    format?: string;
  };
  addresses?: Address[];
  preferences?: UserPreferences;
  locale?: string;
  timezone?: string;
}
```

### Avatar Security & Cloudinary Integration (`apps/api/src/lib/cloudinary.service.ts`)

- **Magic Bytes Validation**: Buffer header signatures are verified to reject executable files or non-images.
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- **Max File Size**: 5 MB (`FILE_TOO_LARGE` 413).
- **Public ID Identifier**: `avatars/avatar_{userId}_{timestamp}`.
- **Asset Replacement**: Previous avatar is deleted from Cloudinary whenever a new image is uploaded.

### Single-Default Address Constraint

- Each user can store up to 10 addresses.
- Exactly one address can be set as default. When a user marks an address as `isDefault: true`, all other addresses owned by the user automatically have `isDefault = false`.
- If the default address is deleted and remaining addresses exist, the first remaining address automatically becomes the new default.

---

## 4. Security & Audit Logging

- **IDOR Protection**: All `/users/me/*` operations use `request.user.userId` derived directly from the authenticated JWT session.
- **Mass Assignment Prevention**: Strict Zod schemas reject attempts to mutate `roleIds`, `permissions`, `passwordHash`, `accountStatus`, or `tenantId` via normal profile update APIs.
- **Super Admin Protection**: Ordinary admins cannot modify Super Admin profiles or status transitions.
- **Audit Logging**: Audit log entries (`PROFILE_UPDATED`, `AVATAR_UPLOADED`, `AVATAR_DELETED`, `ADDRESS_ADDED`, `ADDRESS_UPDATED`, `ADDRESS_DELETED`, `PREFERENCES_UPDATED`, `USER_STATUS_CHANGED`, `ADMIN_USER_UPDATED`) are written to MongoDB.

---

## 5. UI Components

- `UserProfilePage.tsx`: Integrated dashboard for personal info, avatar uploader, addresses, preferences, and account security summary.
- `AvatarUploader.tsx`: Drag-and-drop avatar upload with preview and deletion.
- `AddressManagement.tsx`: Saved address list with Default badge, add/edit modal, set default trigger, and deletion confirmation.
- `PreferencesForm.tsx`: Customization form for theme, language, notification preferences, and dietary tags.
- `AdminUserManagementPage.tsx`: Searchable, filterable, paginated admin table with status transition drawer.
