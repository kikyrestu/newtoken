<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class BurnTest extends TestCase
{
    /**
     * Test a successful burn callback.
     */
    public function test_burn_callback_success(): void
    {
        $response = $this->postJson('/api/burn-callback', [
            'signature' => 'mock_signature_123',
            'amount' => 1000,
            'wallet' => 'SolanaWalletAddress123',
        ]);

        $response->assertStatus(200)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'Burn verified, Cashback sent!',
                 ]);
    }

    /**
     * Test validation error.
     */
    public function test_burn_callback_validation_error(): void
    {
        $response = $this->postJson('/api/burn-callback', [
            'amount' => 1000, // Missing wallet and signature
        ]);

        $response->assertStatus(422); // Validation error
    }
}
