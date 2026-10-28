# Khushi Product

Responsive HTML/CSS/JavaScript storefront, Node.js serverless API, and MongoDB storage. PHP was removed at your request. Open this folder in VS Code to edit all source files.

## Local setup

1. Install Node.js 22+ and run `npm install` in this folder.
2. Copy `.env.example` to `.env`.
3. Configure `MONGODB_URI` with a MongoDB Atlas connection string or a local MongoDB replica set. Transactions require a replica set; a standalone MongoDB server is not sufficient.
4. Set `JWT_SECRET` to a random value of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and put it directly into your environment file. Never commit it.
5. Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` (10–128 characters). Do not use the example contact details as credentials. The administrator account is created on its first successful login. The admin email cannot be registered as a customer.
6. Run `npm start`, then open http://localhost:3000. If that port is occupied, set `PORT=4173` in `.env`.
7. Open `/#/account`, sign in with your configured administrator credentials, then open `/#/admin`.

Without database configuration, the site clearly displays a sample catalog. Search, filters, sorting, product details, local cart and WhatsApp contact work. Secure accounts, real persisted orders and admin mutations are intentionally unavailable until MongoDB is configured. There is no insecure browser-side admin bypass.

## Vercel deployment

The included `vercel.json` deploys the storefront and Node.js API together. MongoDB Atlas remains an external managed database.

### MongoDB connection checklist

- In Atlas, use **Connect → Drivers → Node.js** to copy your cluster URI. Replace the username and password placeholders with a **database user**, not your Atlas account login. Percent-encode special characters in the password.
- Give that database user `readWrite` access to `khushi_shop` (or your `MONGODB_DB`). Ensure the cluster is running and Atlas Network Access permits connections from your deployment using your chosen network configuration.
- Set `MONGODB_URI`, `MONGODB_DB=khushi_shop`, `JWT_SECRET` (at least 32 random characters), `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (10–128 characters) in the Vercel project `khushi-product`. Select Production and any other environments you use. Redeploy after changing variables.
- For local development, add these values to `.env.local`. `npm start` and `npm run db:check` load `.env` followed by `.env.local`; existing shell environment variables take priority. Keep credentials out of source control.
- Run `npm run db:check` for a read-only connection and replica-set check. Then visit `/api/ready` on the deployed app to check connectivity, initialization and transaction topology. `/api/health` only confirms that the process is running; it does not test MongoDB.
- On Vercel, deploy the repository root containing `vercel.json`, not the separate `client` folder. The deployed storefront is in `public`.

If the API reports database unavailable, check the URI, database user password, Atlas network access and DNS. A standalone local MongoDB can serve the catalog but cannot run checkout transactions. Successful topology checks do not replace testing a full checkout with your database user's permissions.

1. In a terminal, run `npx vercel login` and complete sign-in in your own browser.
2. Run `npx vercel link` from this folder. Choose your Vercel team and create/select the intended project.
3. Add `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in Vercel Project Settings → Environment Variables. Enter secrets directly in Vercel, never in chat or source files. Configure the database user's access and Atlas network access for your deployment.
4. Run `npx vercel --prod` to publish. The CLI prints the live URL.
5. Test customer registration, product creation, checkout and inventory on the deployed database before accepting real orders.

The app can be deployed before MongoDB setup to show the clearly labeled sample storefront. That preview cannot accept orders or administer inventory. Real payment credentials are not required for demo payments. `PAYMENT_PUBLIC_KEY` and `PAYMENT_SECRET_KEY` are reserved blank placeholders; no real payment provider has been integrated.

## Features

- Responsive homepage, seven grocery categories, product search, category/price filters, sorting, product detail pages, available packs, quantities and stock status.
- Browser cart for guests and persisted database cart for signed-in customers.
- Registration, bcrypt password hashes, signed HttpOnly cookie sessions, logout revocation, profile editing, order history and five-stage tracking.
- Checkout with server-controlled prices, ₹10 delivery per order, free delivery at 50 tins, minimum one box/tin, Rajasthan-only state selection, validated contact/address fields and atomic stock decrement.
- COD plus simulated payment success/failure. Demo failure creates no order and consumes no stock.
- Role-protected admin dashboard with product CRUD, image URLs, pack sizes, pricing, stock, categories, order status, offers, delivery rules, shop details and low-stock/order-value summaries.
- About, contact, FAQ, delivery and return information; WhatsApp links and prefilled enquiries.

## Editing products and business details

Use the admin panel after database setup. Product images accept HTTPS URLs, not file uploads. Different sizes with different prices/stock are separate product listings, each with its own pack selector and inventory. Sample illustrations are generated locally as SVG from product data; they are not claims about the actual packaging. The attached original logo is in `public/assets/logo.png`.

The sample catalog is seeded only on database initialization. Editing/deleting listings persists across application restarts. Product and category changes require an admin session. Categories containing products cannot be deleted until those products are moved or removed.

The interpretation of minimum one box is one listed box or tin; update the delivery settings if your wholesale pack rules differ. Free delivery is based on the number of tins, not the rupee subtotal. Opening hours remain `7 to 5` with AM/PM awaiting confirmation. Return windows, delivery times, certifications and reviews have not been invented. Finish your shop policies, tax treatment, actual brands, stock and sample prices before accepting real sales.

## Files

- `public/index.html`: navigation, footer, accessible application shell.
- `public/style.css`: responsive green/gold design.
- `public/app.js`: customer pages and admin interface.
- `public/seed.js`: editable sample products/categories/settings.
- `api/index.mjs`: authentication, database access, cart/order/admin APIs.
- `server.mjs`: local static/API server.
- `database-schema.md`: data shapes, indexes and API contract.
- `.env.example`: blank environment-variable template.
- `tests/shop.test.mjs`: isolated database integration tests.

## Validation

`npm run check` checks JavaScript syntax. `npm test` runs tests using an isolated in-memory MongoDB replica set; the first run downloads an official MongoDB test binary. Tests do not connect to your real MongoDB database.
