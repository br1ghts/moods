<?php

namespace Tests\Feature;

use App\Models\NotificationSetting;
use App\Models\User;
use Tests\TestCase;

class NotificationSettingsTest extends TestCase
{
    public function test_can_switch_to_hourly_even_with_seconds_in_preferred_time(): void
    {
        $user = User::factory()->create();

        NotificationSetting::create([
            'user_id' => $user->id,
            'enabled' => true,
            'cadence' => 'daily',
            'preferred_time' => '09:00:00',
            'preferred_weekday' => 1,
            'timezone' => 'America/Chicago',
        ]);

        $payload = [
            'enabled' => true,
            'cadence' => 'hourly',
            'preferred_time' => '09:00:00',
            'preferred_weekday' => 1,
            'timezone' => 'America/Chicago',
        ];

        $response = $this->actingAs($user)
            ->put(route('settings.notifications.update'), $payload);

        $response->assertRedirect(route('settings'));

        $this->assertDatabaseHas('notification_settings', [
            'user_id' => $user->id,
            'cadence' => 'hourly',
            'preferred_time' => null,
            'preferred_weekday' => null,
        ]);
    }
}
