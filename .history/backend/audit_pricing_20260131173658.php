<?php

use App\Models\SiteSetting;
use App\Services\EarlyBirdPricingService;

echo "--- STARTING STAGE 2 AUDIT: Data Persistence ---\n";

// 1. Initial State (Expect Default $25)
$service = app(EarlyBirdPricingService::class);
$initial = $service->getTierCurrentUsdPrice('spectator');
echo "[1] Initial Price (Default): $" . $initial . "\n";

// 2. Simulate Admin Update (Set to $999)
echo "[2] Simulating Admin Update -> Set 'tier_price_spectator' to 999.00\n";
SiteSetting::set('tier_price_spectator', 999.00);

// 3. Verify Mutation
$updated = $service->getTierCurrentUsdPrice('spectator');
echo "[3] Updated Price (Dynamic): $" . $updated . "\n";

if ($updated == 999.00) {
    echo "✅ SUCCESS: Database override works.\n";
} else {
    echo "❌ FAILED: Still showing $" . $updated . "\n";
}

// 4. Cleanup
echo "[4] Cleaning up...\n";
SiteSetting::where('key', 'tier_price_spectator')->delete();

$final = $service->getTierCurrentUsdPrice('spectator');
echo "[5] Final Price (Restored): $" . $final . "\n";
