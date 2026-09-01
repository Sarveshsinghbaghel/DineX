# Database Guide

## Primary Database

MongoDB Atlas with Mongoose.

## Design Principles

- Prefer normalized references for cross-feature relationships.
- Add indexes for high-frequency lookups such as orders, reservations, menu items, and inventory items.
- Keep write models clean and validation-driven.
- Use timestamps consistently for operational reporting.

## Planned Core Collections

- `users`
- `roles`
- `permissions`
- `tables`
- `menuCategories`
- `menuItems`
- `orders`
- `orderItems`
- `kitchenTickets`
- `payments`
- `reservations`
- `inventoryItems`
- `inventoryMovements`
- `notifications`
- `auditLogs`

## Initial Connectivity

The backend scaffold includes MongoDB connection configuration and health reporting of database readiness. Business collections should be introduced feature by feature rather than all at once.
