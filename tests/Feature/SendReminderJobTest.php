<?php

namespace Tests\Feature;

use App\Jobs\SendReminderJob;
use App\Models\NotificationSetting;
use App\Models\PushSubscription;
use App\Models\ReminderSend;
use App\Models\User;
use App\Services\PushService;
use Carbon\Carbon;
use Tests\TestCase;

class SendReminderJobTest extends TestCase
{
    public function test_job_marks_failed_when_no_subscriptions(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 2, 10, 0, 0, 'UTC'));
        $user = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $user->id,
            'enabled' => true,
            'cadence' => 'hourly',
            'timezone' => 'UTC',
            'next_due_at' => now(),
        ]);

        ReminderSend::create([
            'user_id' => $user->id,
            'bucket_key' => 'hourly:2026-02-02T10',
            'due_at_utc' => now('UTC'),
            'status' => 'queued',
        ]);

        $fakePushService = new class extends PushService {
            public function __construct()
            {
            }

            public function sendToUser(User $user, string $title, string $body, array $data = []): array
            {
                return ['sent' => 0, 'failed' => 0, 'expired' => 0];
            }
        };

        $job = new SendReminderJob($user->id, 'hourly:2026-02-02T10');
        $job->handle($fakePushService);

        $this->assertDatabaseHas('reminder_sends', [
            'user_id' => $user->id,
            'bucket_key' => 'hourly:2026-02-02T10',
            'status' => 'failed',
            'failure_reason' => 'no_subscriptions',
        ]);

        Carbon::setTestNow();
    }

    public function test_job_marks_sent_when_push_succeeds(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 2, 10, 0, 0, 'UTC'));
        $user = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $user->id,
            'enabled' => true,
            'cadence' => 'hourly',
            'timezone' => 'UTC',
            'next_due_at' => now(),
        ]);

        PushSubscription::create([
            'user_id' => $user->id,
            'endpoint' => 'https://example.com/push/abc',
            'public_key' => 'test',
            'auth_token' => 'test',
            'content_encoding' => 'aes128gcm',
        ]);

        ReminderSend::create([
            'user_id' => $user->id,
            'bucket_key' => 'hourly:2026-02-02T10',
            'due_at_utc' => now('UTC'),
            'status' => 'queued',
        ]);

        $fakePushService = new class extends PushService {
            public function __construct()
            {
            }

            public function sendToUser(User $user, string $title, string $body, array $data = []): array
            {
                return ['sent' => 1, 'failed' => 0, 'expired' => 0];
            }
        };

        $job = new SendReminderJob($user->id, 'hourly:2026-02-02T10');
        $job->handle($fakePushService);

        $this->assertDatabaseHas('reminder_sends', [
            'user_id' => $user->id,
            'bucket_key' => 'hourly:2026-02-02T10',
            'status' => 'sent',
            'devices_targeted' => 1,
            'devices_succeeded' => 1,
        ]);

        Carbon::setTestNow();
    }
}
