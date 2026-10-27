# NobleNet Backend API

Production-quality backend for **NobleNet** — An Intelligent NGO Management, Donation & Volunteer Engagement Platform.

---

## 🌟 Tech Stack & Architecture

- **Runtime & Language**: Node.js (v18+) with TypeScript
- **Web Framework**: Express 5.x
- **Database**: MongoDB with Mongoose (ODM)
- **Caching & Queue**: Redis + BullMQ (background job processing)
- **Security & Middleware**: Helmet, CORS, Express-Rate-Limit, JWT (Access + Refresh tokens), BcryptJS
- **Validation**: Zod (strict schema validations on request body, query, and params)
- **Logging**: Pino + Pino-pretty
- **Architecture**: Layered Domain-Driven Architecture:
  `Routes -> Controllers -> Services -> Models/Database + Events/BullMQ`

---

## 👥 The 3-Role Model

NobleNet enforces exactly **three** user roles:

1. **`USER`**: A unified citizen account. A single user can:
   - Donate money (one-time or recurring campaigns)
   - Pledge & donate physical items from NGO wishlists
   - Apply to volunteer opportunities & track participation
   - Review and rate verified NGOs (with server-side verified-interaction checks)
   - Track social impact and view contribution receipts
   - Receive real-time notifications
2. **`NGO`**: Organization account.
   - Register NGO profile & submit verification credentials (80G/12A/FCRA/registration certificates)
   - Create and manage fundraising campaigns
   - Publish wishlist items with quantities and priority levels
   - Post volunteer opportunities & approve/reject volunteer applications
   - Publish verifiable impact reports with funds used & beneficiaries reached
3. **`SUPER_ADMIN`**: Platform governance.
   - Review and verify pending NGO registrations (Approve / Reject with notes)
   - Manage user statuses (Active / Suspended)
   - Monitor platform-wide metrics & audit trail logs

---

## 📁 Project Structure

```
src/
├── app.ts                  # Express application setup, security middlewares, route mounting
├── server.ts               # Server entry point with graceful shutdown
├── config/
│   └── env.ts              # Zod-validated environment variables
├── core/
│   ├── errors/             # AppError custom error class
│   ├── middleware/         # authenticate, authorize, errorHandler, validate
│   └── utils/              # logger (Pino), StorageProvider abstraction
├── database/
│   ├── mongo.ts            # Mongoose connection & lifecycle
│   └── seed.ts             # Complete database seed script with mock data
├── events/
│   └── EventEmitter.ts     # Domain events emitter & BullMQ queue producers
├── jobs/
│   └── worker.ts           # BullMQ background workers (notifications, emails, receipts)
└── modules/
    ├── admin/              # Dashboard metrics, user moderation, NGO review
    ├── audit/              # AuditLog model & trail service
    ├── auth/               # Registration, login, JWT refresh tokens, me endpoint
    ├── campaigns/          # Fundraising campaign lifecycle & search
    ├── donations/          # Monetary donations, receipt generation, idempotency
    ├── impact/             # Post-campaign verified impact reports
    ├── ngos/               # NGO profile, document submission & verification
    ├── notifications/      # In-app notifications & mark-read APIs
    ├── payments/           # Payment abstraction (MockPaymentProvider & RazorpayProvider)
    ├── reviews/            # Verified donor/volunteer review system
    ├── users/              # User model & profile management
    ├── volunteering/       # Volunteer opportunities & application workflows
    └── wishlists/          # Physical item wishlists with atomic conditional pledges
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 18
- MongoDB instance (local or MongoDB Atlas)
- Redis instance (local or Redis Cloud)

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `MONGO_URI` and `REDIS_URL` are configured properly.

### 4. Seed Database with Demo Accounts & Data
```bash
npm run seed
```

#### Demo Credentials:
| Role | Email | Password |
| :--- | :--- | :--- |
| **SUPER ADMIN** | `admin@noblenet.org` | `Password123!` |
| **NGO (Verified)** | `contact@hopefoundation.org` | `Password123!` |
| **NGO (Verified)** | `info@ecovanguard.org` | `Password123!` |
| **NGO (Pending)** | `rescue@strayhaven.org` | `Password123!` |
| **USER** | `priya@example.com` | `Password123!` |
| **USER** | `vikram@example.com` | `Password123!` |

### 5. Run in Development Mode
```bash
npm run dev
```

### 6. Build & Production Run
```bash
npm run build
npm start
```

---

## 📡 Complete REST API Reference

All endpoints are prefixed with `/api/v1`.

### 🔐 Authentication (`/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register a new user (`USER` or `NGO`) |
| `POST` | `/auth/login` | Public | Login with email and password |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for new access token |
| `GET` | `/auth/me` | Authenticated | Get current authenticated user profile |

### 🏢 NGOs (`/ngos`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/ngos` | Public | Browse verified NGOs (with search query) |
| `GET` | `/ngos/profile` | NGO | Get logged-in NGO's detailed profile |
| `GET` | `/ngos/:id` | Public | View specific NGO public profile |
| `POST` | `/ngos/register` | Authenticated | Register NGO profile with verification documents |
| `GET` | `/ngos/admin/pending` | SUPER_ADMIN | List all NGOs awaiting verification review |
| `PATCH` | `/ngos/:id/verify` | SUPER_ADMIN | Approve, reject, or update NGO verification |

### 📢 Campaigns (`/campaigns`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/campaigns` | Public | Browse active fundraising campaigns (category filter & search) |
| `GET` | `/campaigns/:id` | Public | Get single campaign details |
| `POST` | `/campaigns` | NGO (Verified) | Create a new campaign |
| `PATCH` | `/campaigns/:id/status` | NGO (Owner) | Update campaign status (`ACTIVE`, `PAUSED`, etc.) |

### 💳 Donations & Payments (`/donations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/donations` | USER | Initiate donation order via payment provider |
| `POST` | `/donations/verify` | USER | Verify payment signature and atomically credit campaign |
| `GET` | `/donations/my` | USER | View personal donation history |
| `GET` | `/donations/:id` | Authenticated | Get single donation details & receipt reference |

### 📦 Wishlists & Physical Items (`/wishlists`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/wishlists` | Public | Browse active NGO wishlists |
| `GET` | `/wishlists/:id` | Public | Get wishlist details |
| `GET` | `/wishlists/:wishlistId/items` | Public | View item lists for a wishlist |
| `POST` | `/wishlists` | NGO (Verified) | Create a new wishlist |
| `POST` | `/wishlists/:wishlistId/items` | NGO (Owner) | Add items to wishlist |
| `POST` | `/wishlists/items/:itemId/pledge`| USER | **Atomic pledge** of items (prevents race conditions) |
| `GET` | `/wishlists/my/item-donations` | USER | View personal pledged physical items |
| `POST` | `/wishlists/item-donations/:id/cancel`| USER | Cancel an unfulfilled item pledge |

### 🤝 Volunteering (`/volunteering`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/volunteering` | Public | Browse open volunteer opportunities |
| `GET` | `/volunteering/:id` | Public | Get volunteer opportunity details |
| `POST` | `/volunteering` | NGO (Verified) | Create a new volunteer opportunity |
| `POST` | `/volunteering/:id/apply` | USER | Apply to volunteer (enforces 1 application per user per opportunity) |
| `GET` | `/volunteering/applications/my` | USER | View personal volunteer applications & statuses |
| `PATCH`| `/volunteering/applications/:id/withdraw` | USER | Withdraw pending application |
| `GET` | `/volunteering/ngo/applications` | NGO (Owner) | Review incoming volunteer applications |
| `PATCH`| `/volunteering/applications/:id/approve` | NGO (Owner) | Approve volunteer application |
| `PATCH`| `/volunteering/applications/:id/reject` | NGO (Owner) | Reject volunteer application |

### 📊 Impact Reports (`/impact`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/impact/ngo/:ngoId` | Public | View published impact reports for an NGO |
| `POST` | `/impact` | NGO (Verified) | Create new impact report with funds used & milestones |
| `PATCH`| `/impact/:id` | NGO (Owner) | Update an impact report |
| `DELETE`| `/impact/:id` | NGO (Owner) | Delete an impact report |

### ⭐ Reviews (`/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/reviews/ngo/:ngoId` | Public | View verified reviews and ratings for an NGO |
| `POST` | `/reviews/ngo/:ngoId` | USER | Submit review (**verified contribution check performed server-side**) |
| `PATCH`| `/reviews/:id` | USER (Author) | Edit own review |
| `DELETE`| `/reviews/:id` | USER (Author) | Delete own review |

### 🔔 Notifications (`/notifications`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Authenticated | Get paginated user notifications |
| `PATCH`| `/notifications/:id/read` | Authenticated | Mark a notification as read |
| `PATCH`| `/notifications/read-all` | Authenticated | Mark all notifications as read |
| `DELETE`| `/notifications/:id` | Authenticated | Delete a notification |

### 🛡️ Admin Dashboard (`/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/stats` | SUPER_ADMIN | Platform-wide aggregation metrics & stats |
| `GET` | `/admin/users` | SUPER_ADMIN | User list with filter by role and status |
| `PATCH`| `/admin/users/:id/status` | SUPER_ADMIN | Activate or suspend user account |
| `GET` | `/admin/ngos/pending` | SUPER_ADMIN | List pending NGO verification submissions |
| `PATCH`| `/admin/ngos/:id/review` | SUPER_ADMIN | Approve or reject NGO with audit tracking |
| `GET` | `/admin/audit-logs` | SUPER_ADMIN | Query platform audit trail logs |

---

## 🔒 Concurrency & Robustness Guarantees

1. **Wishlist Race Conditions**:
   When multiple users pledge the last remaining items simultaneously, the pledge operation uses MongoDB's atomic `$expr` conditional update:
   ```ts
   {
     _id: itemId,
     $expr: {
       $lte: [{ $add: ['$pledgedQuantity', quantity] }, '$requiredQuantity']
     }
   }
   ```
   This strictly prevents over-pledging even under concurrent requests.

2. **Volunteer Application Idempotency**:
   A compound unique index `(userId, opportunityId)` enforces at the database level that a user can never apply multiple times to the same opportunity.

3. **Payment Security**:
   Campaign balances are updated only on the server after verifying the payment signature with the provider (never based on client claims). Multiple attempts to verify the same order return idempotent success.
