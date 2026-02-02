<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateNotificationSettingsRequest;
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

        $settings->fill([
            'enabled' => $request->boolean('enabled'),
            'cadence' => $request->input('cadence'),
            'preferred_time' => $request->input('preferred_time'),
            'preferred_weekday' => $request->input('preferred_weekday'),
            'timezone' => $request->input('timezone'),
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
