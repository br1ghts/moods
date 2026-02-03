<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotificationSetting;
use App\Models\ReminderSend;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminRemindersController extends Controller
{
    public function index()
    {
        $nowUtc = now('UTC');
        $cutoff = $nowUtc->copy()->addSeconds(30);

        $dueQuery = NotificationSetting::query()
            ->where('enabled', true)
            ->whereNotNull('next_due_at')
            ->where('next_due_at', '<=', $cutoff)
            ->whereHas('user', fn ($query) => $query->where('is_disabled', false));

        $dueCount = (clone $dueQuery)->count();
        $dueSettings = (clone $dueQuery)
            ->with(['user' => fn ($query) => $query->withCount('pushSubscriptions')])
            ->orderBy('next_due_at')
            ->limit(20)
            ->get();

        $userIds = $dueSettings->pluck('user_id')->unique()->values();
        $recentByUser = collect();

        if ($userIds->isNotEmpty()) {
            $recentByUser = ReminderSend::query()
                ->whereIn('user_id', $userIds)
                ->orderBy('created_at', 'desc')
                ->get()
                ->groupBy('user_id')
                ->map(fn ($items) => $items->take(10)->values());
        }

        $recentSends = ReminderSend::query()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        $failureGroups = ReminderSend::query()
            ->select('failure_reason', DB::raw('count(*) as count'))
            ->where('status', 'failed')
            ->whereNotNull('failure_reason')
            ->groupBy('failure_reason')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $queueStats = [
            'pending' => DB::table('jobs')->count(),
            'reserved' => DB::table('jobs')->whereNotNull('reserved_at')->count(),
            'failed' => DB::table('failed_jobs')->count(),
            'oldest_available_at' => DB::table('jobs')->min('available_at'),
        ];

        return Inertia::render('Admin/Reminders', [
            'lastTickAt' => Cache::get('reminders:last_tick_at'),
            'dueCount' => $dueCount,
            'queueStats' => $queueStats,
            'dueSettings' => $dueSettings->map(function ($setting) use ($recentByUser) {
                return [
                    'id' => $setting->id,
                    'user_id' => $setting->user_id,
                    'cadence' => $setting->cadence,
                    'test_mode_enabled' => $setting->test_mode_enabled,
                    'test_interval_seconds' => $setting->test_interval_seconds,
                    'daily_time' => $setting->daily_time,
                    'weekly_day' => $setting->weekly_day,
                    'timezone' => $setting->timezone,
                    'next_due_at' => $setting->next_due_at,
                    'user' => [
                        'id' => $setting->user?->id,
                        'name' => $setting->user?->name,
                        'email' => $setting->user?->email,
                        'push_devices_count' => $setting->user?->push_subscriptions_count ?? 0,
                    ],
                    'recent_sends' => $recentByUser->get($setting->user_id, collect())->map(function ($send) {
                        return [
                            'id' => $send->id,
                            'bucket_key' => $send->bucket_key,
                            'status' => $send->status,
                            'failure_reason' => $send->failure_reason,
                            'due_at_utc' => $send->due_at_utc,
                            'attempted_at_utc' => $send->attempted_at_utc,
                            'completed_at_utc' => $send->completed_at_utc,
                            'devices_targeted' => $send->devices_targeted,
                            'devices_succeeded' => $send->devices_succeeded,
                            'devices_failed' => $send->devices_failed,
                        ];
                    })->values(),
                ];
            }),
            'recentSends' => $recentSends->map(function ($send) {
                return [
                    'id' => $send->id,
                    'user_id' => $send->user_id,
                    'bucket_key' => $send->bucket_key,
                    'status' => $send->status,
                    'failure_reason' => $send->failure_reason,
                    'due_at_utc' => $send->due_at_utc,
                    'attempted_at_utc' => $send->attempted_at_utc,
                    'completed_at_utc' => $send->completed_at_utc,
                    'devices_targeted' => $send->devices_targeted,
                    'devices_succeeded' => $send->devices_succeeded,
                    'devices_failed' => $send->devices_failed,
                    'user' => $send->user ? [
                        'id' => $send->user->id,
                        'name' => $send->user->name,
                        'email' => $send->user->email,
                    ] : null,
                ];
            }),
            'failureGroups' => $failureGroups,
        ]);
    }

    public function runTick()
    {
        Artisan::call('mood:reminders:tick');

        return redirect()
            ->route('admin.reminders')
            ->with('success', 'Reminder tick dispatched.');
    }

    public function showUser(User $user)
    {
        $user->loadCount('pushSubscriptions');
        $setting = $user->notificationSetting;

        $sends = ReminderSend::query()
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(200)
            ->get()
            ->map(function ($send) {
                return [
                    'id' => $send->id,
                    'bucket_key' => $send->bucket_key,
                    'status' => $send->status,
                    'failure_reason' => $send->failure_reason,
                    'due_at_utc' => $send->due_at_utc,
                    'attempted_at_utc' => $send->attempted_at_utc,
                    'completed_at_utc' => $send->completed_at_utc,
                    'devices_targeted' => $send->devices_targeted,
                    'devices_succeeded' => $send->devices_succeeded,
                    'devices_failed' => $send->devices_failed,
                    'created_at' => $send->created_at,
                ];
            });

        return Inertia::render('Admin/ReminderUser', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'push_devices_count' => $user->push_subscriptions_count,
            ],
            'setting' => $setting ? [
                'enabled' => $setting->enabled,
                'cadence' => $setting->cadence,
                'test_mode_enabled' => $setting->test_mode_enabled,
                'test_interval_seconds' => $setting->test_interval_seconds,
                'daily_time' => $setting->daily_time,
                'weekly_day' => $setting->weekly_day,
                'timezone' => $setting->timezone,
                'next_due_at' => $setting->next_due_at,
                'last_sent_at' => $setting->last_sent_at,
            ] : null,
            'sends' => $sends,
        ]);
    }

    public function simulateDueNow()
    {
        $user = request()->user();
        $setting = $user?->notificationSetting ?? $user?->notificationSetting()->create([
            'enabled' => true,
            'cadence' => 'daily',
            'daily_time' => now($user?->notificationSetting?->timezone ?? 'UTC')->format('H:i'),
            'timezone' => $user?->notificationSetting?->timezone ?? 'UTC',
        ]);

        if (! $setting) {
            return redirect()
                ->route('admin.reminders')
                ->with('error', 'Unable to create notification settings.');
        }

        $setting->forceFill([
            'enabled' => true,
            'next_due_at' => now('UTC'),
        ])->save();

        return redirect()
            ->route('admin.reminders')
            ->with('success', 'Simulated due reminder for your account.');
    }
}
