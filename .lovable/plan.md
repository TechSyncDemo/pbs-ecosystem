## Razorpay Payment, jsPDF Bill, and Rs. Symbol

Confirmed defaults: payment success auto-approves the order and releases stock (no manual admin verification step for Razorpay-paid orders); `IndianRupee` lucide icon stays as a visual icon.

Razorpay secrets (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are already saved. Database schema has been extended with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` on the `orders` table.

### 1. Razorpay edge functions

**`supabase/functions/create-razorpay-order/index.ts`** — Auth-protected. Accepts `{ amount_inr, receipt }`, calls Razorpay REST `POST /v1/orders` with `amount = Math.round(amount_inr * 100)` (paise), `currency: "INR"`, using Basic auth `key_id:key_secret`. Returns `{ razorpay_order_id, amount, currency, key_id }`.

**`supabase/functions/verify-razorpay-payment/index.ts`** — Auth-protected. Accepts `{ order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }`. Verifies HMAC-SHA256(`razorpay_order_id|razorpay_payment_id`, key_secret) via Web Crypto. On success:
- Updates `orders`: `status='approved'`, `payment_status='paid'`, stores all 3 razorpay fields.
- Loads order items, calls `increment_center_stock` RPC for each item to release stock.
Returns `{ success: true }`.

### 2. Frontend: `src/pages/center/Orders.tsx`

- Add helper `loadRazorpayScript()` that injects `https://checkout.razorpay.com/v1/checkout.js` once.
- Rewrite `handlePlaceOrder` flow:
  1. Create DB order (status `pending`, payment_status `pending`) — keep existing logic.
  2. Apply coupon (existing).
  3. Call `create-razorpay-order` edge function.
  4. Open Razorpay checkout with returned `key_id`, `order_id`, `amount` (paise), center prefill (name/email/phone).
  5. On `handler` success → call `verify-razorpay-payment` → on success: invalidate queries, generate + download bill PDF, toast, close dialog.
  6. On `modal.ondismiss` or failure → toast "Payment cancelled — order kept as pending, you can retry".
- Add a **Retry Payment** + **Download Bill** button on each order row in the table:
  - Retry shown when `payment_status='pending'`.
  - Download bill shown when `payment_status='paid'`.

### 3. jsPDF bill generator

**`src/lib/generateOrderBill.ts`** — Uses `jspdf` + `jspdf-autotable` (already in deps via marksheet generator).

Layout:
- Header: PBS branding, "TAX INVOICE / PAYMENT RECEIPT"
- Bill To: center name, address, phone, email
- Invoice meta: Order No, Date, Razorpay Payment ID
- Itemised table: # | Course / Kit | Qty | Unit Price | Total (Rs. prefix)
- Totals block: Subtotal, Discount (if coupon), Grand Total
- Footer: "Paid via Razorpay" + payment id + timestamp + thank-you note.

### 4. Currency symbol: ₹ → Rs.

Replace `₹` with `Rs. ` (note trailing space) in these files:
- `src/pages/legal/Terms.tsx`
- `src/pages/center/Dashboard.tsx`
- `src/pages/center/Orders.tsx`
- `src/pages/center/Students.tsx`
- `src/components/admin/CourseForm.tsx`
- `src/components/admin/CouponsManager.tsx`
- `src/components/admin/AuthorizationForm.tsx`
- `src/pages/admin/Authorizations.tsx`
- `src/pages/admin/Dashboard.tsx`
- `src/pages/admin/Orders.tsx`
- `src/pages/admin/Reports.tsx`

### 5. Memory updates

Update `mem://index.md` core rules:
- Remove "Orders bypass manual payment; directly enter `pending_verification`."
- Add: "Orders use Razorpay live checkout; amount sent in paise; payment success auto-approves and releases stock."
- Add: "All currency strings display `Rs.` prefix, never `₹`."

### Technical notes
- `key_secret` only ever used inside edge functions; never bundled to client.
- Razorpay amount math: `Math.round(rupees * 100)` to avoid floating-point paise drift.
- HMAC verification done with Deno Web Crypto (`crypto.subtle.importKey` + `sign('HMAC', …)`).
- Both edge functions validate JWT via `supabase.auth.getClaims(token)`.
