# Database schema and API

All IDs except MongoDB internal `_id` are strings. The API hides `_id` from public catalog/order responses. Amounts are INR. These document shapes are enforced by request validation; MongoDB uses flexible collections.

| Collection | Fields | Indexes |
|---|---|---|
| users | id, name, email (lowercase), password (bcrypt hash), role (customer/admin), phone?, address? | unique email |
| products | id, name, category, brand, description, size, unit (box/tin), price, mrp, stock (nonnegative integer), image (HTTPS URL or empty), art, variants (pack labels), featured | unique id |
| categories | name | name queried on mutation |
| carts | userId, items: [{id, quantity}] | unique userId |
| orders | id, userId, items: [{id,name,price,unit,size,quantity}], subtotal, delivery, total, tins, name, phone, address, pincode, state, payment, paymentStatus, status, createdAt | userId + createdAt |
| settings | id: shop, name, tagline, address, phone, email, hours, deliveryAreas, deliveryCharge, freeDeliveryTins, minimumBoxes, offer, policy | shop ID queried |
| sessions | id, userId, expiresAt (Date) | TTL expiresAt |
| limits | key (hashed email/hour), count, expiresAt (Date) | TTL expiresAt |

## API routes

All bodies/responses are JSON. Mutations validate types and bounds; prices and inventory are never trusted from checkout requests. Cookie-based authentication is required for private APIs. Same-origin browser requests and SameSite cookies protect mutations. Cookies are HttpOnly; Vercel sets Secure. Passwords require 10–128 characters; credentials are bcrypt hashed. Login and registration attempts are limited per normalized email/hour in MongoDB.

| Method | Route | Access / purpose |
|---|---|---|
| GET | /api/health | Public, indicates whether database is configured |
| GET | /api/catalog | Public catalog/categories/shop settings |
| POST | /api/register | Customer name, email, password |
| POST | /api/login | Email, password; creates signed server-revocable session |
| POST | /api/logout | Revokes current session and clears cookie |
| GET | /api/me | Safe current-user data or null |
| PUT | /api/profile | Authenticated name, phone, address |
| GET / PUT | /api/cart | Current user's persisted items |
| GET | /api/orders | Customer's orders; admin can view all (latest 200) |
| POST | /api/orders | Authenticated checkout, prices rebuilt from catalog, stock/order/cart updated in one MongoDB transaction |
| POST / PUT | /api/admin/product | Admin product upsert |
| DELETE | /api/admin/product/:id | Admin product removal |
| POST / DELETE | /api/admin/category | Admin add/remove category |
| PUT | /api/admin/settings | Admin shop settings update |
| PATCH | /api/admin/order | Admin update valid tracking status |

Checkout body: `{name,phone,address,pincode,state:"Rajasthan",payment:"cod"|"demo-success"|"demo-failure",items:[{id,quantity}]}`. The API rejects duplicate product IDs, empty carts, fractional/negative quantities, missing products, insufficient stock, unsupported payments and invalid delivery fields. Server totals determine the final amount. A failed transaction rolls back stock updates and order creation.

Demo payments are simulations, not provider test-mode integrations: no credentials, gateway, webhook, charge or refund occurs. Order value is explicitly labeled as including demo orders and is not a revenue accounting report.

Missing database configuration returns 503. Missing authentication returns 401. Non-admin access returns 403. Invalid input returns 400. Login limits return 429. Public errors avoid exposing database connection strings.
