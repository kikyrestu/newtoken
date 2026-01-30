## **What’s Happening Today (Repo Reality Check)**
- Backend already exposes `GET /api/pricing` via [LockController.php](file:///d:/PROJECT/NEWTOKECRYPTO/backend/app/Http/Controllers/LockController.php) and uses fixed prices from [PriceOracleService.php](file:///d:/PROJECT/NEWTOKECRYPTO/backend/app/Services/PriceOracleService.php).
- Tier sales live in `lock_transactions` (column: `tier`, `status`) per migration [create_lock_transactions_table.php](file:///d:/PROJECT/NEWTOKECRYPTO/backend/database/migrations/2026_01_22_000002_create_lock_transactions_table.php).

Your request requires **dynamic USD pricing based on current locked counts** + return metadata for FOMO UI.

## **Backend Plan (Laravel)**
### 1) Add a dedicated service: `EarlyBirdPricingService`
Create `backend/app/Services/EarlyBirdPricingService.php` that:
- Counts sold slots per tier:
  - `LockTransaction::where('tier', $tier)->where('status','locked')->count()`
- Applies your bracket rules:
  - Spectator base $25: first 200 (20%), 201–400 (10%), 401+ (0)
  - Operator base $150: first 100 (20%), 101–200 (10%), 201+ (0)
  - Elite base $250: first 50 (20%), 51–100 (10%), 101+ (0)
- Returns, for each tier:
  - `current_price` (USD)
  - `original_price` (base USD)
  - `discount_percent` (20/10/0)
  - `remaining_slots_in_tier` (upperBound - currentLockedCount for that bracket, `null` if no next increase)
  - `next_price` (next bracket USD, or same/current if no next)

### 2) Update `GET /api/pricing` to include Early-Bird metadata (and stay backward compatible)
In [LockController.php](file:///d:/PROJECT/NEWTOKECRYPTO/backend/app/Http/Controllers/LockController.php), update `getPricing()` to:
- Use `EarlyBirdPricingService` to get per-tier USD + metadata.
- For each tier, compute required tokens using the existing oracle:
  - `PriceOracleService->calculateTokensForUSD(current_price)`
- Return a payload that keeps existing keys (`usd`, `tokens`, `tokens_formatted`, `token_price`) **and also adds**:
  - `current_price`, `original_price`, `discount_percent`, `remaining_slots_in_tier`, `next_price`

This ensures your current frontend (already calling `/api/pricing`) won’t break.

### 3) Ensure verification stores the real USD value
In `verifyLock()` inside [LockController.php](file:///d:/PROJECT/NEWTOKECRYPTO/backend/app/Http/Controllers/LockController.php), replace:
- `$tierPrice = $this->priceService->getTierUsdPrice($tier);`
with:
- `$tierPrice = $earlyBirdPricingService->getTierCurrentUsdPrice($tier);`
So the backend records `usd_value_at_lock` using the same dynamic logic.

## **Frontend Plan (Vue.js 3 Component Example)**
Even though this repo’s shipped UI is React, I will provide the requested **Vue 3 `<script setup>`** implementation that:
- Fetches `GET /api/pricing`.
- Displays:
  - If `discount_percent > 0`: strike-through original price + neon current price.
  - Urgency badge: `Only X spots left at -20%!` / `-10%!`.
- Uses **current token amount from API** when calling the lock function (no hardcoded USD).

## **Deliverables After Confirmation**
- New backend service file: `EarlyBirdPricingService.php`
- Updated `LockController@getPricing()` + `verifyLock()` to use early-bird logic
- Vue component snippet (template + script) for `PricingCard.vue` that consumes the new API fields
- Quick verification: Laravel route response example + simple sanity checks for bracket math

If you confirm, I’ll implement these changes in the backend and provide the complete Laravel method + Vue component code exactly matching the response structure and UI rules.