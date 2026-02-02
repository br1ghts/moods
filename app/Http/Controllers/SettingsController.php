<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateNotificationSettingsRequest;
use Carbon\Carbon;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function edit()
    {
        $user = request()->user();
        $settings = $user->notificationSetting ?? $user->notificationSetting()->create([
            'enabled' => false,
            'cadence' => 'daily',
            'timezone' => 'America/Chicago',
        ]);

        $subscriptions = $user->pushSubscriptions()
            ->latest('last_seen_at')
            ->get()
            ->map(fn ($subscription) => [
                'id' => $subscription->id,
                'endpoint' => $subscription->endpoint,
                'endpoint_display' => $this->truncateEndpoint($subscription->endpoint),
                'device_label' => $subscription->device_label,
                'user_agent' => $subscription->user_agent,
                'created_at' => $subscription->created_at,
                'last_seen_at' => $subscription->last_seen_at,
                'last_push_at' => $subscription->last_push_at,
                'last_push_error' => $subscription->last_push_error,
            ]);

        return Inertia::render('Settings', [
            'notificationSettings' => [
                'enabled' => $settings->enabled,
                'cadence' => $settings->cadence,
                'preferred_time' => $settings->preferred_time,
                'preferred_weekday' => $settings->preferred_weekday,
                'timezone' => $settings->timezone,
            ],
            'pushStatus' => [
                'hasSubscription' => $subscriptions->isNotEmpty(),
                'subscriptionsCount' => $subscriptions->count(),
                'subscriptions' => $subscriptions,
            ],
        ]);
    }

    public function update(UpdateNotificationSettingsRequest $request)
    {
        $user = $request->user();
        $settings = $user->notificationSetting ?? $user->notificationSetting()->create();

        $data = $request->validated();
        $enabled = $request->boolean('enabled');
        $cadence = $data['cadence'];
        $timezone = $data['timezone'];
        $nextReminderAt = null;

        if ($enabled && $cadence === 'hourly') {
            $nextReminderAt = Carbon::now($timezone)
                ->addHour()
                ->startOfHour()
                ->utc();
        }

        $settings->fill([
            'enabled' => $enabled,
            'cadence' => $cadence,
            'preferred_time' => $data['preferred_time'] ?? null,
            'preferred_weekday' => $data['preferred_weekday'] ?? null,
            'timezone' => $timezone,
            'next_reminder_at' => $nextReminderAt,
        ]);

        $settings->save();

        return redirect()
            ->route('settings')
            ->with('success', 'Notification preferences updated.');
    }

    protected function truncateEndpoint(string $endpoint): string
    {
        $length = strlen($endpoint);

        if ($length <= 64) {
            return $endpoint;
        }

        return substr($endpoint, 0, 38).'…'.substr($endpoint, -22);
    }
}
