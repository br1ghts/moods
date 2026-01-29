<?php

namespace Tests\Feature;

use App\Models\NotificationSetting;
use App\Models\PushSubscription;
use App\Models\User;
use App\Services\PushService;
use Tests\TestCase;

class SendMoodRemindersTest extends TestCase
{
    public function test_command_sends_reminders_to_due_users(): void
    {
        $user = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $user->id,
            'enabled' => true,
            'cadence' => 'hourly',
            'timezone' => 'UTC',
        ]);

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://example.com/push',
            'public_key' => 'p256dh',
            'auth_token' => 'auth',
        ]);

        $this->mock(PushService::class, function ($mock) use ($user) {
            $mock->shouldReceive('sendToUser')
                ->once()
                ->withArgs(function ($targetUser, $title, $body, $data) use ($user) {
                    return $targetUser->id === $user->id
                        && $title === 'Mood check-in'
                        && $body === "Log how you're feeling — it'll take 10 seconds."
                        && $data === ['url' => '/log'];
                });
        });

        $this->artisan('mood:send-reminders')->assertExitCode(0);

        $settings = NotificationSetting::where('user_id', $user->id)->first();
        $this->assertNotNull($settings?->fresh()->last_sent_at);
    }
}
