<?php

namespace Tests\Feature;

use App\Models\NotificationSetting;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class NotificationSettingsTest extends TestCase
{
    public function test_can_switch_to_hourly_even_with_seconds_in_daily_time(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 2, 2, 16, 45, 0, 'UTC'));
        $user = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $user->id,
            'enabled' => true,
            'cadence' => 'daily',
            'daily_time' => '09:00:00',
            'weekly_day' => 1,
            'timezone' => 'America/Chicago',
        ]);

        $payload = [
            'enabled' => true,
            'cadence' => 'hourly',
            'daily_time' => '09:00:00',
            'weekly_day' => 1,
            'timezone' => 'America/Chicago',
        ];

        $response = $this->actingAs($user)
            ->put(route('settings.notifications.update'), $payload);

        $response->assertRedirect(route('settings'));

        $this->assertDatabaseHas('notification_settings', [
            'user_id' => $user->id,
            'cadence' => 'hourly',
            'daily_time' => null,
            'weekly_day' => null,
        ]);

        $setting = NotificationSetting::where('user_id', $user->id)->firstOrFail();
        $this->assertNotNull($setting->next_due_at);

        Carbon::setTestNow();
    }
}
