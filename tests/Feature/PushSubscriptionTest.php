<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class PushSubscriptionTest extends TestCase
{
    public function test_authenticated_user_can_subscribe_to_push(): void
    {
        $user = User::factory()->create();

        $payload = [
            'endpoint' => 'https://example.com/push/123',
            'keys' => [
                'p256dh' => 'p256dh-key',
                'auth' => 'auth-secret',
            ],
        ];

        $response = $this->actingAs($user)->postJson(route('push.subscribe'), $payload);

        $response->assertOk();

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
            'endpoint' => $payload['endpoint'],
        ]);
    }

    public function test_push_subscription_requires_authentication(): void
    {
        $payload = [
            'endpoint' => 'https://example.com/push/123',
            'keys' => [
                'p256dh' => 'p256dh-key',
                'auth' => 'auth-secret',
            ],
        ];

        $response = $this->postJson(route('push.subscribe'), $payload);

        $response->assertUnauthorized();
    }
}
