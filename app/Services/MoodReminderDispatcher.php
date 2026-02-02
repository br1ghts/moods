<?php

namespace App\Services;

use App\Models\NotificationSetting;
use App\Notifications\MoodReminderNotification;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class MoodReminderDispatcher
{
    public function notifyHourlyUsers(): array
    {
        $settings = $this->baseQuery('hourly')->get();

        return $this->dispatchToSettings(
            $settings,
            now(),
            fn (NotificationSetting $setting, Carbon $now): bool => $this->shouldSendHourly($setting, $now),
            'hourly',
        );
    }

    public function notifyDailyUsers(string $timezone, string $preferredTime): array
    {
        $settings = $this->baseQuery('daily')
            ->where('timezone', $timezone)
            ->whereNotNull('preferred_time')
            ->whereTime('preferred_time', $preferredTime)
            ->get();

        return $this->dispatchToSettings(
            $settings,
            Carbon::now()->timezone($timezone),
            fn (NotificationSetting $setting, Carbon $now): bool => $this->shouldSendDaily($setting, $now),
            'daily',
        );
    }

    public function notifyWeeklyUsers(string $timezone, int $weekday, string $preferredTime): array
    {
        $settings = $this->baseQuery('weekly')
            ->where('timezone', $timezone)
            ->where('preferred_weekday', $weekday)
            ->whereNotNull('preferred_time')
            ->whereTime('preferred_time', $preferredTime)
            ->get();

        return $this->dispatchToSettings(
            $settings,
            Carbon::now()->timezone($timezone),
            fn (NotificationSetting $setting, Carbon $now): bool => $this->shouldSendWeekly($setting, $now),
            'weekly',
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
            ->where('cadence', $cadence)
            ->whereHas('user', fn ($query) => $query->where('is_disabled', false));
    }

    protected function dispatchToSettings(Collection $settings, Carbon $now, callable $shouldSend, string $cadence): array
    {
        $deviceCount = $settings->sum(fn (NotificationSetting $setting) => $setting->user?->pushSubscriptions?->count() ?? 0);
        $targetedCount = $settings->count();
        $sentCount = 0;

        Log::info('[REMINDERS] dispatch.start', [
            'cadence' => $cadence,
            'targets' => $targetedCount,
            'devices' => $deviceCount,
        ]);

        foreach ($settings as $setting) {
            if (! $setting->user) {
                continue;
            }

            $serverNow = now();
            $userNow = $now->copy()->timezone($setting->timezone);
            $nextDueBefore = $this->nextDueForSetting($setting, $userNow);
            $dueDecision = $shouldSend($setting, $userNow);

            if (! $dueDecision) {
                $this->logReminderDecision($setting, [
                    'now_server' => $serverNow->toIso8601String(),
                    'app_tz' => config('app.timezone'),
                    'user_tz' => $setting->timezone,
                    'cadence' => $cadence,
                    'next_due_before' => $nextDueBefore?->toIso8601String(),
                    'due_decision' => false,
                    'send_attempted' => false,
                    'next_due_after' => $nextDueBefore?->toIso8601String(),
                ]);
                continue;
            }

            $setting->user->notify(new MoodReminderNotification());
            $sentCount++;

            $nextDueAfter = $nextDueBefore;
            $updates = ['last_sent_at' => now()];

            if ($cadence === 'hourly') {
                $nextDueAfter = $this->nextHourlyReminder($userNow)->utc();
                $updates['next_reminder_at'] = $nextDueAfter;
            }

            $setting->update($updates);

            $this->logReminderDecision($setting, [
                'now_server' => $serverNow->toIso8601String(),
                'app_tz' => config('app.timezone'),
                'user_tz' => $setting->timezone,
                'cadence' => $cadence,
                'next_due_before' => $nextDueBefore?->toIso8601String(),
                'due_decision' => true,
                'send_attempted' => true,
                'next_due_after' => $nextDueAfter?->toIso8601String(),
            ]);
        }

        Log::info('[REMINDERS] dispatch.done', [
            'cadence' => $cadence,
            'targets' => $targetedCount,
            'devices' => $deviceCount,
            'sent' => $sentCount,
        ]);

        return [
            'targets' => $targetedCount,
            'devices' => $deviceCount,
            'sent' => $sentCount,
        ];
    }

    protected function shouldSendHourly(NotificationSetting $settings, Carbon $now): bool
    {
        $nextDue = $this->resolveHourlyReminder($settings, $now);

        return $nextDue->lte($now->copy()->addSeconds(30));
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

    protected function resolveHourlyReminder(NotificationSetting $setting, Carbon $now): Carbon
    {
        if ($setting->next_reminder_at) {
            return $setting->next_reminder_at->copy()->timezone($setting->timezone);
        }

        $next = $this->nextHourlyReminder($now);

        $setting->update([
            'next_reminder_at' => $next->copy()->utc(),
        ]);

        return $next;
    }

    protected function nextHourlyReminder(Carbon $now): Carbon
    {
        return $now->copy()->addHour()->startOfHour();
    }

    protected function nextDueForSetting(NotificationSetting $setting, Carbon $now): ?Carbon
    {
        return match ($setting->cadence) {
            'hourly' => $this->resolveHourlyReminder($setting, $now),
            'daily' => $this->nextDailyReminder($setting, $now),
            'weekly' => $this->nextWeeklyReminder($setting, $now),
            default => null,
        };
    }

    protected function nextDailyReminder(NotificationSetting $setting, Carbon $now): ?Carbon
    {
        if (! $setting->preferred_time) {
            return null;
        }

        $next = $now->copy()->startOfDay()->setTimeFromTimeString($setting->preferred_time);

        if ($next->lte($now)) {
            $next->addDay();
        }

        return $next;
    }

    protected function nextWeeklyReminder(NotificationSetting $setting, Carbon $now): ?Carbon
    {
        if ($setting->preferred_time === null || $setting->preferred_weekday === null) {
            return null;
        }

        $next = $now->copy()->startOfDay()->setTimeFromTimeString($setting->preferred_time);
        $targetWeekday = (int) $setting->preferred_weekday;

        while ($next->dayOfWeek !== $targetWeekday || $next->lte($now)) {
            $next->addDay();
        }

        return $next;
    }

    protected function logReminderDecision(NotificationSetting $setting, array $context): void
    {
        Log::info('[REMINDERS] decision', array_merge([
            'setting_id' => $setting->id,
            'user_id' => $setting->user_id,
        ], $context));
    }
}
