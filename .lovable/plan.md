## Goal
Increase center stock for 41 rows in `Stock_Details.xlsx`. Payments were collected offline, so no Razorpay order or payment record is needed.

## Verified data (no mismatches)
- All 18 center codes in the file exist in `centers` (PBS272026002…PBS272026045).
- All "New Course Name" values map cleanly to existing rows in `courses`, and each course already has a `stock_items` row (created automatically by `auto_create_stock_item_for_course`).

## How stock will be added
For each of the 41 rows, call the existing DB function:
```
SELECT increment_center_stock(<center_id>, <stock_item_id>, <qty>);
```
This upserts into `center_stock` (adds to existing quantity if a row already exists, otherwise inserts). I'll run a single SQL batch that joins the spreadsheet values against `centers.code` and `stock_items.course_id` to resolve UUIDs — no hardcoded IDs in the migration.

## Audit trail
No `orders` / `order_items` / `razorpay_*` rows will be created. The only record will be `center_stock.last_updated = now()` for the bumped rows.

If you'd also like an offline-order paper trail (one `orders` row per center with `payment_status = 'offline_paid'` and matching `order_items`), say the word and I'll add that as a second step.

## Verification after run
Read back `center_stock` for the affected (center, course) pairs and confirm quantities increased by the expected amounts. Report any row that didn't update.