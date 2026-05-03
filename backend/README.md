# Pizza Paradise — OMS Backend

REST API and WebSocket server for the Pizza Paradise Order Management System.

**Stack:** NestJS · TypeORM · PostgreSQL · Socket.IO

---

## Overview

The backend is the central hub of the OMS. It exposes a RESTful HTTP API consumed by the Kiosk and persists all order data to PostgreSQL. Real-time events are broadcast to connected clients (Kiosk + Kitchen Display) over Socket.IO WebSockets, so every status change appears instantly across all screens without polling.

### Order lifecycle

```
PENDING_PAYMENT ──► PAID ──► PREPARING ──► READY ──► DELIVERED
        │                │
        └────────────────┴──► REJECTED
```

| Status | Triggered by |
|---|---|
| `PENDING_PAYMENT` | Kiosk places order (`POST /orders`) |
| `PAID` | Operator approves payment via curl |
| `REJECTED` | Operator declines payment via curl, or kitchen rejects |
| `PREPARING` | Kitchen accepts the order (KDS modal) |
| `READY` | Kitchen marks order as done (KDS modal) |
| `DELIVERED` | Order handed to customer |

---

## Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally (default port 5432, database `pizzeria`)

Create the database if it doesn't exist yet:
```sql
CREATE DATABASE pizzeria;
```

Configure credentials in `.env` (copy from `.env.example` if present):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pizzeria
```

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Run migrations and seed demo data (products + employees)
npm run setup:db

# 3. Start the development server
npm run start:dev
```

The API will be available at `http://localhost:3000`.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Start in watch mode (auto-reloads on file changes) |
| `npm run start` | Start once (no watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run setup:db` | Run migrations + seed demo data |
| `npm run test` | Unit tests |
| `npm run test:e2e` | End-to-end integration tests |
| `npm run test:cov` | Test coverage report |

---

## Database setup (`npm run setup:db`)

The `setup:db` script is **idempotent** — safe to run multiple times. It will:

1. Connect to PostgreSQL
2. Apply any pending TypeORM migrations (creates all tables on a fresh database)
3. Insert the 6 demo pizzas into `products` (skips existing rows)
4. Insert 2 demo employees — a cook and a waiter — into `employees` (skips existing rows)
5. Print a summary table of what is now in the database

---

## REST API

All endpoints are prefixed at `http://localhost:3000`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/orders` | Place a new order (Kiosk checkout) |
| `GET` | `/orders` | List all orders |
| `GET` | `/orders/:id` | Get a single order with its items and payments |
| `PATCH` | `/orders/:id/status` | Transition an order to a new status |

### Place an order — `POST /orders`

```json
{
  "items": [
    { "product_id": 1, "quantity": 2, "unit_price": 7.90, "custom_note": "Margherita (Stredná)" }
  ]
}
```

### Update status — `PATCH /orders/:id/status`

```json
{ "status": "PAID" }
```

---

## Simulating the payment terminal

After a customer checks out on the Kiosk, the order enters `PENDING_PAYMENT` and the Kiosk shows a waiting screen. An operator approves or declines the payment using curl.

Replace `{ORDER_ID}` with the actual order ID shown on the Kiosk screen.

```bash
# ✅ Approve — order moves to PAID and appears in the Kitchen Display
curl -X PATCH http://localhost:3000/orders/{ORDER_ID}/status -H "Content-Type: application/json" -d "{\"status\":\"PAID\"}"

# ❌ Decline — Kiosk shows a "Platba zamietnutá" screen with a retry option
curl -X PATCH http://localhost:3000/orders/{ORDER_ID}/status -H "Content-Type: application/json" -d "{\"status\":\"REJECTED\"}"
```

---

## WebSocket events

Clients connect to the Socket.IO server at `http://localhost:3000`. The backend emits:

| Event | Payload | When |
|---|---|---|
| `order.created` | `{ order, status }` | A new order is placed |
| `order.updated` | `{ order, status }` | Any status transition occurs |

---

## Project structure

```
src/
├── app.module.ts           # Root module
├── main.ts                 # Bootstrap (CORS, ValidationPipe, port)
├── database/
│   ├── database.module.ts  # TypeORM connection (reads from ConfigService/.env)
│   ├── data-source.ts      # CLI DataSource (used by migrations & setup-db)
│   └── migrations/         # TypeORM migration files
├── events/
│   ├── events.module.ts
│   └── events.gateway.ts   # Socket.IO gateway — broadcasts order events
├── orders/
│   ├── orders.controller.ts
│   ├── orders.service.ts   # Business logic & state machine
│   ├── dto/
│   └── entities/
├── payments/
│   └── entities/
├── products/
│   └── entities/           # Pizza, Drink (single-table inheritance)
└── employees/
    └── entities/           # Employee, EmployeeOrder
```
