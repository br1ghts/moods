<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
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

    public function test_user_can_delete_their_own_subscription_by_id(): void
    {
        $user = User::factory()->create();

        $subscription = PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://example.com/push/own',
            'public_key' => 'p256dh-key',
            'auth_token' => 'auth-secret',
        ]);

        $response = $this->actingAs($user)
            ->deleteJson(route('push.subscriptions.destroy', $subscription->id));

        $response->assertOk();

        $this->assertDatabaseMissing('push_subscriptions', [
            'id' => $subscription->id,
        ]);
    }

    public function test_user_cannot_delete_another_users_subscription(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $subscription = PushSubscription::create([
            'user_id' => $otherUser->id,
            'endpoint' => 'https://example.com/push/other',
            'public_key' => 'p256dh-key',
            'auth_token' => 'auth-secret',
        ]);

        $response = $this->actingAs($user)
            ->deleteJson(route('push.subscriptions.destroy', $subscription->id));

        $response->assertForbidden();
    }

    public function test_unsubscribe_by_endpoint_removes_correct_record(): void
    {
        $user = User::factory()->create();

        $subscription = PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://example.com/push/remove-me',
            'public_key' => 'p256dh-key',
            'auth_token' => 'auth-secret',
        ]);

        $response = $this->actingAs($user)->deleteJson(route('push.unsubscribe'), [
            'endpoint' => $subscription->endpoint,
        ]);

        $response->assertOk();

        $this->assertDatabaseMissing('push_subscriptions', [
            'id' => $subscription->id,
        ]);
    }

    public function test_device_list_only_returns_current_users_subscriptions(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $own = PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://example.com/push/own',
            'public_key' => 'p256dh-key',
            'auth_token' => 'auth-secret',
        ]);

        PushSubscription::create([
            'user_id' => $otherUser->id,
            'endpoint' => 'https://example.com/push/other',
            'public_key' => 'p256dh-key',
            'auth_token' => 'auth-secret',
        ]);

        $response = $this->actingAs($user)->getJson(route('push.subscriptions.index'));

        $response->assertOk();
        $response->assertJsonCount(1, 'subscriptions');
        $response->assertJsonFragment(['id' => $own->id]);
    }
}
