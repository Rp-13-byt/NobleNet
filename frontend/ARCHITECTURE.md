# NobleNet implementation audit

## Found

The original repository was a frontend-only Vite app. It has no Express service, Mongo models, Redis/BullMQ configuration, payment SDK, server tests, or backend API implementation. Several pages use browser-local mock services. The donation modal created a simulated payment identifier in the browser and the demo switcher fabricated authenticated roles when the API was unavailable.

## Added API boundary

`server/src/routes.ts` is the HTTP layer, `services.ts` owns donation settlement, `models.ts` owns Mongo persistence/indexes, and `payments.ts` isolates Mock and Razorpay adapters. Payment success is an atomic server-side transition: `Donation`, `Payment`, campaign `$inc`, and unique `Receipt` are committed in one Mongo transaction. Duplicate browser callbacks return the already-settled state; duplicate webhooks are deduplicated on `(provider, eventId)`.

## Remaining mismatches

Campaign discovery and management, NGO verification, wishlists, volunteering, impact, reviews, notifications, queues, admin/refunds, and dashboards remain frontend mock functionality. Their backend modules must exist before those clients can truthfully be described as API-driven. Current API functionality is intentionally limited to auth and the secure donation/payment foundation.
