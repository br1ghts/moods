<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateNotificationSettingsRequest;
use App\Services\ReminderScheduler;
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
                'test_mode_enabled' => $settings->test_mode_enabled,
                'test_interval_seconds' => $settings->test_interval_seconds,
                'cadence' => $settings->cadence,
                'daily_time' => $settings->daily_time,
                'weekly_day' => $settings->weekly_day,
                'timezone' => $settings->timezone,
            ],
            'isAdmin' => $user?->email === 'brendonbaughray@gmail.com',
            'pushStatus' => [
                'hasSubscription' => $subscriptions->isNotEmpty(),
                'subscriptionsCount' => $subscriptions->count(),
                'subscriptions' => $subscriptions,
            ],
        ]);
    }

    public function update(UpdateNotificationSettingsRequest $request, ReminderScheduler $scheduler)
    {
        $user = $request->user();
        $settings = $user->notificationSetting ?? $user->notificationSetting()->create();

        $data = $request->validated();
        $enabled = $request->boolean('enabled');
        $cadence = $data['cadence'];
        $timezone = $data['timezone'];
        $nextDueAt = null;

        $settings->fill([
            'enabled' => $enabled,
            'test_mode_enabled' => $data['test_mode_enabled'] ?? false,
            'test_interval_seconds' => $data['test_interval_seconds'] ?? null,
            'cadence' => $cadence,
            'daily_time' => $data['daily_time'] ?? null,
            'weekly_day' => $data['weekly_day'] ?? null,
            'timezone' => $timezone,
        ]);

        if ($enabled) {
            $next = $scheduler->computeNextDue($settings, now('UTC'));
            $nextDueAt = $next?->copy()->utc();
        }

        $settings->forceFill([
            'next_due_at' => $enabled ? $nextDueAt : null,
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
