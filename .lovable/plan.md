## Coupon Code System

Add admin-managed coupon codes that centers can apply at checkout to reduce order totals.

### 1. Database (new table `coupons`)

Fields:
- `code` (text, unique, uppercase)
- `discount_type` ('percentage' | 'fixed')
- `discount_value` (numeric) — % (0–100) or flat ₹ amount
- `max_discount` (numeric, nullable) — cap for percentage coupons
- `min_order_amount` (numeric, default 0) — minimum cart subtotal required
- `usage_limit` (integer, nullable) — total redemptions allowed (null = unlimited)
- `usage_count` (integer, default 0)
- `per_center_limit` (integer, nullable) — redemptions per center
- `valid_from`, `valid_until` (timestamptz)
- `status` ('active' | 'inactive')
- `description` (text, nullable)

Add `coupon_id`, `coupon_code`, `discount_amount` columns to `orders` table.

New table `coupon_redemptions` (coupon_id, center_id, order_id, redeemed_at) to track usage and enforce per-center limits.

RLS:
- Super admins: full manage on `coupons` and `coupon_redemptions`.
- Authenticated centers: SELECT active coupons (to validate); INSERT into redemptions tied to their own center.

Validation function `validate_coupon(code, center_id, order_amount)` (SECURITY DEFINER) returns discount amount + status, used by both client preview and final apply (atomic increment of `usage_count` on order placement).

### 2. Admin UI — Settings page (new "Coupons" tab)

Add a fifth tab to `src/pages/admin/Settings.tsx` alongside General/Financial/Notifications/Profile:

- Table list of coupons: code, type, value, validity, usage (used/limit), status, actions
- "Create Coupon" dialog with all fields above
- Edit / toggle active / delete actions
- Quick stats: total coupons, active, total discount given

New files:
- `src/hooks/useCoupons.ts` — list/create/update/delete/toggle hooks
- `src/components/admin/CouponForm.tsx` — create/edit dialog
- `src/components/admin/CouponsTable.tsx` — list table

### 3. Center Order flow — `src/pages/center/Orders.tsx`

In the "Create Order" dialog, below the cart subtotal:
- "Apply coupon" input + Apply button
- On apply: call validate function → show discount line + new total, or inline error
- Remove coupon (X) button when applied
- On submit: send `coupon_id`, `coupon_code`, `discount_amount`, and adjusted `total_amount` with the order; insert into `coupon_redemptions`

Show applied coupon + discount on order detail / list views (admin Orders too).

### 4. Edge cases
- Reject expired, inactive, exceeded-limit, below-min-order coupons
- Discount cannot exceed subtotal (clamp)
- Percentage coupons honor `max_discount` cap
- Codes stored uppercase; comparison case-insensitive

### Build order
1. Migration (table + columns + RLS + validate function)
2. `useCoupons` hook + admin Coupons tab/components
3. Center order dialog: apply/remove coupon + persist on submit
4. Display discount on admin & center order views
