# DineX — Live Demonstration & Pitch Guide

This document provides a presentation script, demo accounts table, and visual screenshot blueprint for presenting the DineX Restaurant Management System to academic evaluators, technical recruiters, and commercial stakeholders.

---

## 1. Non-Production Demo Accounts Matrix

The following development test accounts are available when running DineX locally with database seed scripts (`npm run seed`):

| Role | Email | Password Placeholder | Permissions / Primary Capabilities |
|---|---|---|---|
| **Super Admin** | `superadmin@dinex.app` | `DemoPass123!` | System-wide restaurant creation, tenant provisioning, system audit logs. |
| **Admin** | `admin@dinex.app` | `DemoPass123!` | Branch creation, user role management, system-wide analytics. |
| **Manager** | `manager@dinex.app` | `DemoPass123!` | Branch settings, staff management, inventory PO approval, sales exports. |
| **Cashier** | `cashier@dinex.app` | `DemoPass123!` | POS checkout, order status updates, payment collection. |
| **Chef** | `chef@dinex.app` | `DemoPass123!` | Real-time Kitchen Display System (KDS), order status (`preparing` -> `ready`). |
| **Waiter** | `waiter@dinex.app` | `DemoPass123!` | Table status management, manual order entry, table seating. |
| **Customer** | `customer@dinex.app` | `DemoPass123!` | Profile management, online delivery checkout, live order tracking. |

> [!WARNING]
> These credentials are for local development and demonstration purposes only. Never use these credentials in production environments.

---

## 2. 17-Step Demonstration Sequence

Follow this sequence during project presentations to showcase the end-to-end capabilities of DineX:

1. **System Introduction & Overview**
   - Open [http://localhost:5173/](http://localhost:5173/). Explain the DineX monorepo architecture and multi-tenant restaurant model.
2. **Super Admin & Tenant Provisioning**
   - Log in as `superadmin@dinex.app`. Showcase multi-restaurant management and global platform settings.
3. **Restaurant & Branch Administration**
   - Navigate to Branch Management. Demonstrate creating a new branch outlet with specific service modes (`dine_in`, `takeaway`, `delivery`).
4. **User & RBAC Permissions**
   - View User Management. Highlight server-enforced role assignments (`Admin`, `Manager`, `Chef`, `Waiter`).
5. **Menu Catalog & Pricing Management**
   - Navigate to Menu Management. Showcase categories, item pricing, dietary tags (`vegan`, `gluten_free`), and stock availability.
6. **Dining Table & QR Code Generation**
   - Navigate to Table QR Management. Create a physical table (e.g., Table T-12) and generate its unique public QR token.
7. **Public Guest QR Ordering Journey**
   - Open a mobile view or new browser tab at `/qr/menu/:token`. Showcase public menu loading, AI recommendations, item customization, and checkout.
8. **Real-Time Kitchen Display System (KDS)**
   - Log in as `chef@dinex.app` on a second window. Show the placed QR order appearing **instantly** via Socket.IO room events without page refresh.
9. **Kitchen Status Progression**
   - Advance order status from `placed` -> `preparing` -> `ready`. Observe live status reflection on the customer's tracking view.
10. **Waiter Operations & Table Management**
    - Log in as `waiter@dinex.app`. Mark order served and view table status transition to `occupied`.
11. **Online Delivery Customer Flow**
    - Log in as `customer@dinex.app`. Input delivery address, check serviceability, and execute online checkout.
12. **Driver Assignment & Live Delivery Tracking**
    - Assign order to delivery driver. Show real-time driver status updates (`out_for_delivery` -> `delivered`).
13. **Inventory Consumption & Stock Audit**
    - Navigate to Inventory Dashboard. Demonstrate stock level deduction upon order completion and low-stock threshold alerts.
14. **Customer Engagement & Loyalty Points**
    - View Customer Engagement page. Showcase automated loyalty points accrual and reward coupon redemption.
15. **Analytics & Revenue KPI Dashboards**
    - Log in as `manager@dinex.app`. View real-time revenue summaries, peak order hours, and popular menu items.
16. **Data Export & Formula Injection Security**
    - Generate and download a sales report in CSV and XLSX formats. Highlight formula injection protection (prepended single quotes).
17. **Security & Session Revocation Showcase**
    - Demonstrate instant session revocation upon password reset or administrative logout.

---

## 3. Screenshot Capture Blueprint

For academic reports and portfolio slides, capture images of the following key interfaces:

- `01_login_page.png` — Authentication screen with JWT session controls.
- `02_dashboard_overview.png` — Executive analytics summary with charts and KPIs.
- `03_menu_management.png` — Interactive menu item catalog editor.
- `04_table_qr_manager.png` — Table grid view with generated QR codes.
- `05_public_qr_menu.png` — Responsive mobile guest menu view.
- `06_kitchen_display_system.png` — Real-time KDS board showing live order cards.
- `07_delivery_tracking.png` — Customer live delivery status map and timeline.
- `08_inventory_dashboard.png` — Ingredient stock level monitor and transaction logs.
- `09_reports_export.png` — Report generator page showing CSV/XLSX download controls.
- `10_audit_log_viewer.png` — Security audit trail displaying actor actions and timestamps.
