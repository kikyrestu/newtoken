<?php

use App\Models\SiteSetting;
use App\Services\EarlyBirdPricingService;

echo "--- STARTING STAGE 2 AUDIT: Data Persistence (Retry) ---\n";

$service = app(EarlyBirdPricingService::class);

// 1. Initial State
// We check 'original_price' which is the Base Price before discount
$details = $service->getTierPricingDetails('spectator');
echo "[1] Initial Base Price: $" . $details['original_price'] . "\n";

// 2. Simulate Admin Update -> Set to $1000.00
echo "[2] Simulating Admin Update -> Set 'tier_price_spectator' to 1000.00\n";
SiteSetting::set('tier_price_spectator', 1000.00);

// 3. Verify Mutation
$updatedDetails = $service->getTierPricingDetails('spectator');
echo "[3] Updated Base Price from DB: $" . $updatedDetails['original_price'] . "\n";
echo "    Updated Discounted Price (20% off): $" . $updatedDetails['current_price'] . "\n";

if ($updatedDetails['original_price'] == 1000.00) {
    echo "✅ SUCCESS: Database override works correctly.\n";
} else {
    echo "❌ FAILED: Still showing $" . $updatedDetails['original_price'] . "\n";
}

// 4. Cleanup
echo "[4] Cleaning up...\n";
SiteSetting::where('key', 'tier_price_spectator')->delete();
