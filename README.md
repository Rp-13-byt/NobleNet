# NobleNet

> **An Intelligent NGO Management, Donation & Volunteer Engagement Platform**  
> *Small actions. Real impact.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg)](https://www.mongodb.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## 🌟 Overview

**NobleNet** is a modern, full-stack crowdfunding and social-impact platform connecting donors, non-profit organizations (NGOs), volunteers, and platform administrators. Inspired by the UX principles of human-centered storytelling, visible progress indicators, and frictionless donation flows, NobleNet provides verified NGO governance, multi-campaign management, tangible supply wishlist drives, and real-time synchronization.

---

## 🏗️ Architecture & Tech Stack

### Frontend (`/frontend`)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI Primitives (Shadcn-style)
- **State & Caching**: TanStack Query v5 + Zustand
- **Real-Time Client**: Socket.IO Client (JWT authenticated)
- **Routing**: React Router v7 with strict role-based route guards

### Backend (`/backend`)
- **Runtime**: Node.js + Express 5
- **Database**: MongoDB with Mongoose ODM (Indexes, atomic transactions, `$expr` conditional logic)
- **Authentication**: JWT with refresh token rotation + Argon2 / BCrypt password hashing
- **Security**: Strict RBAC, IDOR resource-level validation, Helmet, CORS, and Tiered Rate Limiting
- **Real-Time**: Socket.IO with isolated private user rooms and domain event broadcasting
- **Testing**: Jest + Supertest (59 automated integration tests across 9 test suites)

---

## 👥 Three Core System Roles

1. **USER (Donor & Volunteer)**
   - Discover campaigns, verified NGOs, and volunteer opportunities
   - Donate money with quick amounts (₹100, ₹250, ₹500, ₹1000, Custom)
   - Download 80G tax-compliant receipts
   - Pledge tangible wishlist items and track volunteer applications

2. **NGO (Non-Profit Representative)**
   - Verified onboarding with Darpan ID & 80G/12A documentation tracking
   - Launch and manage **multiple campaigns** simultaneously
   - Triage volunteer applications and review applicants
   - Publish verifiable impact reports linked to fund disbursements

3. **SUPER_ADMIN (Platform Governance)**
   - KYC verification queue for pending NGO credentials
   - Platform telemetry, user suspension, and account reactivation
   - Campaign content moderation and audit log querying
   - Financial ledger management and full/partial donor refund processing

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.x
- MongoDB >= 6.x (or run local via script / docker)
- npm or pnpm

### Quick Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Rp-13-byt/NobleNet.git
   cd NobleNet
   ```

2. **Install dependencies**:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. **Start Local Database & Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   *Runs on `http://localhost:5000` with local embedded MongoDB.*

4. **Start Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Runs on `http://localhost:5173`.*

---

## 🧪 Testing

To run the complete 59-test integration suite:

```bash
cd backend
npm test
```

---

## 📄 License
ISC License © 2026 NobleNet. Built by [Rp-13-byt](https://github.com/Rp-13-byt).
