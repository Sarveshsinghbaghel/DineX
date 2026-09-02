# DineX System Architecture Specification

This document presents the high-level software architecture, layered application flow, real-time messaging model, and deployment topology of the DineX Restaurant Management System.

---

## 1. High-Level Monorepo Architecture

DineX is structured as a monorepo enforcing a layered application flow:
`Routes → Middleware → Controllers → Services → Repositories → MongoDB`

```mermaid
graph TD
    Client[Web & Mobile Clients] -->|HTTPS / WSS| Router[Express Router / Socket.IO]
    Router --> Middleware[Auth, RBAC, RateLimit, Sanitizer Middleware]
    Middleware --> Controller[Thin Express Controllers]
    Controller --> Service[Domain Business Logic Services]
    Service --> Repo[Mongoose Models & Repositories]
    Repo --> DB[(MongoDB Atlas Database)]
```

---

## 2. Authentication & Session Teardown Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant AuthAPI as Auth Controller
    participant AuthService as Auth Service
    participant SessionDB as Session Collection
    participant UserDB as User Collection

    Client->>AuthAPI: POST /api/v1/auth/login (email, password)
    AuthAPI->>AuthService: validateCredentials()
    AuthService->>UserDB: findByEmail()
    UserDB-->>AuthService: user document
    AuthService->>SessionDB: createSession(userId)
    SessionDB-->>AuthService: sessionId (sid)
    AuthService-->>AuthAPI: { accessToken (15m), refreshToken (30d) }
    AuthAPI-->>Client: 200 OK + HTTP-Only Refresh Cookie
```

---

## 3. Dine-In QR Ordering Flow

```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant PublicMenu as Public QR Menu API
    participant CheckoutAPI as QR Checkout Service
    participant TableModel as Table Model
    participant OrderModel as Order Model
    participant SocketServer as Socket.IO Server

    Guest->>PublicMenu: GET /api/v1/qr/menu/:token
    PublicMenu-->>Guest: { context, categories, menuItems, recommendations }
    Guest->>CheckoutAPI: POST /api/v1/qr/checkout/:token (items)
    CheckoutAPI->>CheckoutAPI: Recalculate price (DB price + GST 5%)
    CheckoutAPI->>OrderModel: create({ source: 'qr', status: 'placed' })
    CheckoutAPI->>TableModel: updateStatus('occupied')
    CheckoutAPI->>SocketServer: emitToBranchRoom(branchId, 'kitchen_new_order')
    CheckoutAPI-->>Guest: 201 Created { orderId, orderNumber, grandTotal }
```

---

## 4. Online Delivery Fulfillment Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    actor Manager
    actor Driver
    participant DeliveryAPI as Delivery Service
    participant OrderModel as Order Model
    participant SocketServer as Socket.IO Server

    Customer->>DeliveryAPI: POST /api/v1/delivery/checkout
    DeliveryAPI->>OrderModel: create({ serviceMode: 'delivery', status: 'placed' })
    Manager->>DeliveryAPI: POST /api/v1/delivery/orders/:id/assign (driverId)
    DeliveryAPI->>OrderModel: update({ assignedEmployeeId, status: 'assigned' })
    DeliveryAPI->>SocketServer: emitToUserRoom(driverId, 'delivery_assigned')
    Driver->>DeliveryAPI: PATCH /api/v1/delivery/orders/:id/status (out_for_delivery)
    Driver->>DeliveryAPI: PATCH /api/v1/delivery/orders/:id/status (delivered)
    DeliveryAPI->>OrderModel: update({ status: 'delivered', paymentStatus: 'paid' })
    DeliveryAPI->>SocketServer: emitToUserRoom(customerId, 'order_delivered')
```

---

## 5. Realtime Socket.IO Room Messaging Architecture

```mermaid
graph LR
    SocketClient[Socket.IO Client Connection] -->|Handshake JWT Auth| SocketServer[Socket.IO Server]
    SocketServer -->|join| UserRoom["Room: user:{userId}"]
    SocketServer -->|join| BranchRoom["Room: branch:{branchId}"]
    
    SubOrder[Order Lifecycle Event] -->|emitToBranchRoom| BranchRoom
    SubDriver[Driver Assigned Event] -->|emitToUserRoom| UserRoom
```

---

## 6. Analytics & Report Export Architecture

```mermaid
graph TD
    ClientReq[Analytics / Report Request] --> AuthCheck[requirePermission('reports.read')]
    AuthCheck --> Service[Analytics Service]
    Service --> Aggregation[Mongo Aggregation Pipeline & .lean()]
    Aggregation --> DTO[Summary DTO]
    DTO -->|Export Request| Generator[Report Export Generator]
    Generator -->|Sanitize Formulas| Formatter[CSV / XLSX / PDF Buffer]
    Formatter --> Response[Stream File Buffer]
```

---

## 7. Cloud Deployment Topology (Vercel + Render + Atlas)

```mermaid
graph TD
    UserBrowser[User Browser] -->|CDN / HTTPS| Vercel[Vercel Edge Network (Web SPA)]
    Vercel -->|REST API & WebSockets| Render[Render Container (Express API & Socket.IO)]
    Render -->|TLS 1.3 / IP Whitelisted| Atlas[(MongoDB Atlas Cluster)]
```
