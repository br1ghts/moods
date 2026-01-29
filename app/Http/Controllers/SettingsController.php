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

        return Inertia::render('Settings', [
            'notificationSettings' => [
                'enabled' => $settings->enabled,
                'cadence' => $settings->cadence,
                'preferred_time' => $settings->preferred_time,
                'preferred_weekday' => $settings->preferred_weekday,
                'timezone' => $settings->timezone,
            ],
            'pushStatus' => [
                'hasSubscription' => $user->pushSubscriptions()->exists(),
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
}
