# Pizza Paradise — OMS Frontend

React + TypeScript client for the Pizza Paradise Order Management System. Runs two distinct UIs from a single application: the **Kiosk** (customer-facing touch screen) and the **Kitchen Display System** (KDS).

**Stack:** React · TypeScript · Vite · Socket.IO Client · CSS

---

## Overview

The frontend connects to the OMS backend over HTTP (REST) and WebSockets (Socket.IO). All order state changes are reflected in real-time on both screens simultaneously — no polling required.

Switch between the two UIs using the floating toggle button in the bottom-right corner of the browser window.

---

## Kiosk

A touch-friendly ordering flow split into five screens:

| Screen | Description |
|---|---|
| **Idle** | Full-screen welcome animation. Tap anywhere to begin. |
| **Menu** | Grid of all available pizzas with name, description, and base price. |
| **Customize** | Select size (Malá / Stredná / Veľká / Extra), add toppings, and set quantity. Price updates in real time. |
| **Cart** | Review all items and their totals. Tap "Zaplatiť objednávku" to send the order to the backend. |
| **Payment pending** | Spinner screen displayed while waiting for an operator to confirm or decline the payment via the backend API. Reacts instantly to the operator's curl command via WebSocket. |
| **Payment declined** | Shown when the operator rejects the payment. The customer can retry or cancel. |

---

## Kitchen Display System (KDS)

A split-screen board visible to kitchen staff:

| Column | Colour | Content |
|---|---|---|
| **Čakajúce objednávky** | Red gradient | Orders in `PAID` status — new, waiting to be accepted |
| **Pripravované objednávky** | Orange gradient | Orders in `PREPARING` status — actively being cooked |

Clicking any order card opens an **action modal** with the full order details and context-sensitive buttons:

- **PAID orders** → "Prijať" (accept → `PREPARING`) or "Odmietnuť" (reject → `REJECTED`)
- **PREPARING orders** → "Dokončiť" (done → `READY`)

---

## Prerequisites

- Node.js ≥ 18
- The OMS backend running at `http://localhost:3000`

---

## Getting started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

> Make sure the backend is running first (`npm run start:dev` in the `backend/` directory).

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Compile and bundle for production |
| `npm run preview` | Preview the production build locally |

---

## Project structure

```
src/
├── main.tsx          # React entry point
├── App.tsx           # Root component — view switcher (Kiosk ↔ KDS)
├── api.ts            # HTTP helpers (createOrder, getOrders, updateOrderStatus)
├── socket.ts         # Shared Socket.IO client instance
├── Kiosk.tsx         # Full kiosk ordering flow
├── Kiosk.css         # Kiosk styles
├── Kds.tsx           # Kitchen Display System
└── Kds.css           # KDS styles
```

---

## Configuration

The backend URL is hardcoded to `http://localhost:3000` in `src/api.ts` and `src/socket.ts`. Update both files if you deploy the backend to a different host.
