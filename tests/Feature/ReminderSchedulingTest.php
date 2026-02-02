<?php

namespace Tests\Feature;

use App\Models\NotificationSetting;
use App\Models\User;
use App\Notifications\MoodReminderNotification;
use App\Services\MoodReminderDispatcher;
use Carbon\Carbon;
use Illuminate\Support\Facades\Notification;
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
            'preferred_time' => null,
            'preferred_weekday' => null,
            'timezone' => 'America/Chicago',
        ];

        $this->actingAs($user)
            ->put(route('settings.notifications.update'), $payload)
            ->assertRedirect(route('settings'));

        $setting = NotificationSetting::where('user_id', $user->id)->firstOrFail();
        $nextLocal = $setting->next_reminder_at->copy()->timezone('America/Chicago');

        $this->assertSame('11:00', $nextLocal->format('H:i'));

        Carbon::setTestNow();
    }

    public function test_hourly_dispatch_sends_at_top_of_hour_and_reschedules_next(): void
    {
        Notification::fake();

        Carbon::setTestNow(Carbon::create(2026, 2, 2, 16, 15, 0, 'UTC'));

        $user = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $user->id,
            'enabled' => true,
            'cadence' => 'hourly',
            'timezone' => 'America/Chicago',
            'next_reminder_at' => Carbon::create(2026, 2, 2, 17, 0, 0, 'UTC'),
        ]);

        Carbon::setTestNow(Carbon::create(2026, 2, 2, 17, 0, 0, 'UTC'));

        app(MoodReminderDispatcher::class)->notifyHourlyUsers();

        Notification::assertSentTo($user, MoodReminderNotification::class);

        $setting = NotificationSetting::where('user_id', $user->id)->firstOrFail();
        $nextLocal = $setting->next_reminder_at->copy()->timezone('America/Chicago');

        $this->assertSame('12:00', $nextLocal->format('H:i'));

        Carbon::setTestNow();
    }
}
