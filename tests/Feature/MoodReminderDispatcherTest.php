<?php

namespace Tests\Feature;

use App\Models\NotificationSetting;
use App\Models\User;
use App\Notifications\MoodReminderNotification;
use App\Services\MoodReminderDispatcher;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class MoodReminderDispatcherTest extends TestCase
{
    public function test_hourly_dispatch_sends_notification_and_updates_last_sent(): void
    {
        Notification::fake();

        $user = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $user->id,
            'enabled' => true,
            'cadence' => 'hourly',
            'timezone' => 'UTC',
        ]);

        app(MoodReminderDispatcher::class)->notifyHourlyUsers();

        Notification::assertSentTo($user, MoodReminderNotification::class);
        $this->assertNotNull(NotificationSetting::where('user_id', $user->id)->first()?->last_sent_at);
    }

    public function test_daily_dispatch_filters_by_timezone_and_time(): void
    {
        Notification::fake();

        $target = User::factory()->create();
        $other = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $target->id,
            'enabled' => true,
            'cadence' => 'daily',
            'timezone' => 'America/New_York',
            'preferred_time' => '08:00:00',
        ]);

        NotificationSetting::create([
            'user_id' => $other->id,
            'enabled' => true,
            'cadence' => 'daily',
            'timezone' => 'America/New_York',
            'preferred_time' => '09:00:00',
        ]);

        app(MoodReminderDispatcher::class)->notifyDailyUsers('America/New_York', '08:00:00');

        Notification::assertSentTo($target, MoodReminderNotification::class);
        Notification::assertNotSentTo($other, MoodReminderNotification::class);
    }

    public function test_weekly_dispatch_filters_by_weekday_and_time(): void
    {
        Notification::fake();

        $target = User::factory()->create();
        $other = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $target->id,
            'enabled' => true,
            'cadence' => 'weekly',
            'timezone' => 'UTC',
            'preferred_time' => '10:00:00',
            'preferred_weekday' => 2,
        ]);

        NotificationSetting::create([
            'user_id' => $other->id,
            'enabled' => true,
            'cadence' => 'weekly',
            'timezone' => 'UTC',
            'preferred_time' => '10:00:00',
            'preferred_weekday' => 3,
        ]);

        app(MoodReminderDispatcher::class)->notifyWeeklyUsers('UTC', 2, '10:00:00');

        Notification::assertSentTo($target, MoodReminderNotification::class);
        Notification::assertNotSentTo($other, MoodReminderNotification::class);
    }
}
