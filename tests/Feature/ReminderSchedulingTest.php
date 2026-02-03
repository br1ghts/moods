<?php

namespace Tests\Feature;

use App\Models\NotificationSetting;
use App\Models\User;
use App\Jobs\SendReminderJob;
use Carbon\Carbon;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ReminderSchedulingTest extends TestCase
{
    public function test_hourly_next_reminder_aligns_to_top_of_hour_in_user_timezone(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 2, 16, 15, 0, 'UTC'));

        $user = User::factory()->create();

        $payload = [
            'enabled' => true,
            'cadence' => 'hourly',
            'daily_time' => null,
            'weekly_day' => null,
            'timezone' => 'America/Chicago',
        ];

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), $payload)
            ->assertRedirect(route('settings'));

        $setting = NotificationSetting::where('user_id', $user->id)->firstOrFail();
        $nextLocal = $setting->next_due_at->copy()->timezone('America/Chicago');

        $this->assertSame('11:00', $nextLocal->format('H:i'));

        Carbon::setTestNow();
    }

    public function test_tick_dispatches_once_per_bucket(): void
    {
        Queue::fake();

        Carbon::setTestNow(Carbon::create(2026, 2, 2, 16, 15, 0, 'UTC'));

        $user = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $user->id,
            'enabled' => true,
            'cadence' => 'hourly',
            'timezone' => 'America/Chicago',
            'next_due_at' => Carbon::create(2026, 2, 2, 17, 0, 0, 'UTC'),
        ]);

        Carbon::setTestNow(Carbon::create(2026, 2, 2, 17, 0, 0, 'UTC'));

        $this->artisan('mood:reminders:tick')->assertExitCode(0);
        Queue::assertPushed(SendReminderJob::class, 1);

        $setting = NotificationSetting::where('user_id', $user->id)->firstOrFail();
        $nextLocal = $setting->next_due_at->copy()->timezone('America/Chicago');

        $this->assertSame('12:00', $nextLocal->format('H:i'));

        $this->artisan('mood:reminders:tick')->assertExitCode(0);
        Queue::assertPushed(SendReminderJob::class, 1);

        Carbon::setTestNow();
    }
}
