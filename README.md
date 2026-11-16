# 🍽️ Prashadam — POS Billing & Admin Website

A complete single-file restaurant billing website with a **Billing terminal (thermal printing)** and an **Admin panel**. Everything runs in the browser — no server or internet needed.

## 🔑 Login

| Role | Username | Password |
|------|----------|----------|
| 🛡️ Admin Panel | `admin` | `admin123` |
| 🧾 Billing Staff | `billing` | `billing123` |

Pick the matching tab on the login page, or click the "use" buttons to auto-fill.

## 🧾 Billing Terminal (role 1)

- **100 pre-loaded dishes** in 12 categories (starters, main course, biryani, Chinese, South Indian, chaat, desserts, beverages…)
- Professional **product photos for all 100 dishes** on every card, in the cart, item popup, stock list and best-sellers — sourced from real food photography plus AI-generated shots in a consistent style. Admin can upload a different photo for any dish anytime (it overrides the built-in one).
- **Quantity options per product** — Half / Full, Small / Large, Piece, Plate, Cup, Bowl… (depends on the dish)
- Order types: **🍽️ Dine-In** (table no.) · **🛍️ Parcel** (customer name + phone) · **📦 Pack**
- Payment modes: **Cash / UPI / Card**, with GST (CGST+SGST) and round-off
- **Thermal receipt** — switch between **58 mm / 80 mm** paper, then hit Print
- Live stock checking — can't sell more than what's in stock; out-of-stock items are blocked

## 🛡️ Admin Panel (role 2)

- **📊 Dashboard** — today's revenue, bills today, total revenue, low-stock count, 7-day revenue chart, best-selling products, recent bills
- **🧾 Bills & Revenue** — every bill listed; **track any bill by Bill ID** (e.g. `BILL-1001`), view / reprint / cancel (cancelling restores stock and excludes it from revenue)
- **📦 Products & Stock** — manage stock of every quantity option (± buttons or type a number), low-stock rows highlighted in red, quick **restock** button
- **➕ Add Product** — name, category, veg/non-veg, **upload a photo**, choose quantity options per product with price & stock, set the low-stock alert level. Editing and deleting existing products also live here (✏️ / 🗑️ from the stock page)
- **🔔 Notifications** — the bell tracks **low stock automatically**; every time a bill or manual edit pushes an item below its alert level, an unread alert appears (both in Billing and Admin)
- **⚙️ Settings** — restaurant name, address, phone, GSTIN, GST %, bill footer, paper width, and a "Reset demo data" button

## 💾 Where is data stored?

In the browser's `localStorage` — bills, products, stock, notifications and settings all persist between visits on the same computer/browser. (In the in-app preview sandbox, storage is unavailable, so the app falls back to in-memory mode and data resets on refresh — download the file and open it in Chrome/Edge for permanent storage.)

## 🖨️ Thermal printing

Open the file in Chrome/Edge → generate a bill → **Print**. In the browser print dialog choose your 58 mm or 80 mm thermal printer and set margins to "None". The receipt prints in classic monospace thermal style with GST split.

## 📁 Files

- `index.html` — **the whole website** (self-contained; open it anywhere, host it anywhere)
- `src/` — editable source (style, markup, seed data, app logic) + `build.py` to rebuild `index.html`
- `test.js`, `test-cases.js`, `test-shim.js` — automated integration test (70 checks): run with `node test.js`
