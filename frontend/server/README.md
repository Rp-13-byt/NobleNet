# NobleNet API

## Run locally

Copy `.env.example` to `.env`, configure MongoDB and long JWT secrets, then run `npm run build && npm start`. The client should set `VITE_API_URL=http://localhost:5000/api/v1`.

## Security properties

- Passwords are bcrypt hashes; emails are unique.
- JWT access tokens identify the subject and role; sensitive routes enforce RBAC server-side.
- Only active campaigns can receive orders.
- The client never supplies the authoritative order ID: the API reads it from the donation record.
- A donation succeeds only after signature and final provider-status verification.
- Settlement changes a pending donation once inside a Mongo transaction. Campaign totals use `$inc`; payment IDs, receipts, and webhook event IDs are unique.
- Razorpay webhooks verify the raw body before JSON parsing and accept duplicate event IDs without repeating settlement.

## API route map

All routes begin with `/api/v1`: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /donations`, `GET /donations/:id/status`, `POST /payments/verify`, and `POST /payments/webhook/razorpay`.

## Razorpay test mode

Set `PAYMENT_PROVIDER=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in `.env`. Configure the provider webhook URL as `https://<host>/api/v1/payments/webhook/razorpay`.

`mock` is only for local/demo use. It accepts the demo signature outside production and can produce deterministic `failed` and `pending` results from the payment ID.
