<?php

namespace App\Services;

use App\Models\NotificationSetting;
use Carbon\Carbon;

class ReminderScheduler
{
    public function computeNextDue(NotificationSetting $setting, Carbon $nowUtc): ?Carbon
    {
        $timezone = $setting->timezone ?: config('app.timezone');
        $localNow = $nowUtc->copy()->timezone($timezone);

        if ($setting->test_mode_enabled && $setting->test_interval_seconds) {
            return $localNow->copy()->addSeconds((int) $setting->test_interval_seconds);
        }

        return match ($setting->cadence) {
            'hourly' => $this->nextHourly($localNow),
            'daily' => $this->nextDaily($setting, $localNow),
            'weekly' => $this->nextWeekly($setting, $localNow),
            default => null,
        };
    }

    public function bucketKey(NotificationSetting $setting, Carbon $dueAtUtc): string
    {
        if ($setting->test_mode_enabled && $setting->test_interval_seconds) {
            return 'test:'.$dueAtUtc->format('Y-m-d\\TH:i:s');
        }

        $timezone = $setting->timezone ?: config('app.timezone');
        $localDue = $dueAtUtc->copy()->timezone($timezone);

        return match ($setting->cadence) {
            'hourly' => 'hourly:'.$localDue->format('Y-m-d\\TH'),
            'daily' => 'daily:'.$localDue->format('Y-m-d'),
            'weekly' => 'weekly:'.$localDue->format('Y-m-d'),
            default => 'unknown:'.$dueAtUtc->format('Y-m-d\\TH:i'),
        };
    }

    public function nextHourly(Carbon $localNow): Carbon
    {
        return $localNow->copy()->addHour()->startOfHour();
    }

    public function nextDaily(NotificationSetting $setting, Carbon $localNow): ?Carbon
    {
        if (! $setting->daily_time) {
            return null;
        }

        $next = $localNow->copy()->startOfDay()->setTimeFromTimeString($setting->daily_time)->startOfMinute();

        if ($next->lte($localNow)) {
            $next->addDay();
        }

        return $next;
    }

    public function nextWeekly(NotificationSetting $setting, Carbon $localNow): ?Carbon
    {
        if ($setting->daily_time === null || $setting->weekly_day === null) {
            return null;
        }

        $next = $localNow->copy()->startOfDay()->setTimeFromTimeString($setting->daily_time)->startOfMinute();
        $targetWeekday = (int) $setting->weekly_day;

        while ($next->dayOfWeek !== $targetWeekday || $next->lte($localNow)) {
            $next->addDay();
        }

        return $next;
    }
}
