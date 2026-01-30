<?php

namespace App\Services;

use App\Models\NotificationSetting;
use App\Notifications\MoodReminderNotification;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class MoodReminderDispatcher
{
    public function notifyHourlyUsers(): void
    {
        $settings = $this->baseQuery('hourly')->get();

        $this->dispatchToSettings(
            $settings,
            now(),
            fn (NotificationSetting $setting, Carbon $now): bool => $this->shouldSendHourly($setting, $now),
        );
    }

    public function notifyDailyUsers(string $timezone, string $preferredTime): void
    {
        $settings = $this->baseQuery('daily')
            ->where('timezone', $timezone)
            ->whereNotNull('preferred_time')
            ->whereTime('preferred_time', $preferredTime)
            ->get();

        $this->dispatchToSettings(
            $settings,
            Carbon::now()->timezone($timezone),
            fn (NotificationSetting $setting, Carbon $now): bool => $this->shouldSendDaily($setting, $now),
        );
    }

    public function notifyWeeklyUsers(string $timezone, int $weekday, string $preferredTime): void
    {
        $settings = $this->baseQuery('weekly')
            ->where('timezone', $timezone)
            ->where('preferred_weekday', $weekday)
            ->whereNotNull('preferred_time')
            ->whereTime('preferred_time', $preferredTime)
            ->get();

        $this->dispatchToSettings(
            $settings,
            Carbon::now()->timezone($timezone),
            fn (NotificationSetting $setting, Carbon $now): bool => $this->shouldSendWeekly($setting, $now),
        );
    }

    public function dailyScheduleDefinitions(): Collection
    {
        return NotificationSetting::query()
            ->where('enabled', true)
            ->where('cadence', 'daily')
            ->whereNotNull('preferred_time')
            ->select('timezone', 'preferred_time')
            ->distinct()
            ->get()
            ->map(fn (NotificationSetting $setting): array => $this->mapDailyDefinition($setting));
    }

    public function weeklyScheduleDefinitions(): Collection
    {
        return NotificationSetting::query()
            ->where('enabled', true)
            ->where('cadence', 'weekly')
            ->whereNotNull('preferred_time')
            ->whereNotNull('preferred_weekday')
            ->select('timezone', 'preferred_time', 'preferred_weekday')
            ->distinct()
            ->get()
            ->map(fn (NotificationSetting $setting): array => $this->mapWeeklyDefinition($setting));
    }

    protected function mapDailyDefinition(NotificationSetting $setting): array
    {
        $time = $this->normalizePreferredTime($setting->preferred_time);

        return [
            'timezone' => $setting->timezone,
            'schedule_time' => $time['schedule'],
            'query_time' => $time['query'],
        ];
    }

    protected function mapWeeklyDefinition(NotificationSetting $setting): array
    {
        $time = $this->normalizePreferredTime($setting->preferred_time);

        return [
            'timezone' => $setting->timezone,
            'preferred_weekday' => (int) $setting->preferred_weekday,
            'schedule_time' => $time['schedule'],
            'query_time' => $time['query'],
        ];
    }

    protected function baseQuery(string $cadence)
    {
        return NotificationSetting::with('user.pushSubscriptions')
            ->where('enabled', true)
            ->where('cadence', $cadence);
    }

    protected function dispatchToSettings(Collection $settings, Carbon $now, callable $shouldSend): void
    {
        foreach ($settings as $setting) {
            if (! $setting->user) {
                continue;
            }

            if (! $shouldSend($setting, $now)) {
                continue;
            }

            $setting->user->notify(new MoodReminderNotification());
            $setting->update(['last_sent_at' => now()]);
        }
    }

    protected function shouldSendHourly(NotificationSetting $settings, Carbon $now): bool
    {
        $lastSent = $settings->last_sent_at;

        if (! $lastSent) {
            return true;
        }

        return $lastSent->lt($now->copy()->subHour());
    }

    protected function shouldSendDaily(NotificationSetting $settings, Carbon $now): bool
    {
        $lastSent = $settings->last_sent_at?->copy()->timezone($settings->timezone);

        return ! $lastSent || ! $lastSent->isSameDay($now);
    }

    protected function shouldSendWeekly(NotificationSetting $settings, Carbon $now): bool
    {
        $lastSent = $settings->last_sent_at?->copy()->timezone($settings->timezone);

        return ! $lastSent || ! $lastSent->isSameWeek($now, Carbon::SUNDAY);
    }

    protected function normalizePreferredTime(mixed $value): array
    {
        $time = Carbon::parse($value);

        return [
            'schedule' => $time->format('H:i'),
            'query' => $time->format('H:i:s'),
        ];
    }
}
