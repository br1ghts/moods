<?php

namespace App\Console\Commands;

use App\Models\NotificationSetting;
use App\Models\User;
use App\Services\PushService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendMoodReminders extends Command
{
    protected $signature = 'mood:send-reminders';

    protected $description = 'Dispatch mood check-in reminders to subscribed devices.';

    public function handle(PushService $pushService): int
    {
        $now = now();

        $users = User::with(['notificationSetting', 'pushSubscriptions'])
            ->whereHas('notificationSetting', fn ($query) => $query->where('enabled', true))
            ->get();

        foreach ($users as $user) {
            $settings = $user->notificationSetting;

            if (! $settings || ! $this->shouldSendReminder($settings, $now)) {
                continue;
            }

            if ($user->pushSubscriptions->isEmpty()) {
                continue;
            }

            $pushService->sendToUser(
                $user,
                'Mood check-in',
                "Log how you're feeling — it'll take 10 seconds.",
                ['url' => '/log'],
            );

            $settings->update(['last_sent_at' => $now]);
        }

        return self::SUCCESS;
    }

    protected function shouldSendReminder(NotificationSetting $settings, Carbon $now): bool
    {
        return match ($settings->cadence) {
            'hourly' => $this->shouldSendHourly($settings, $now),
            'daily' => $this->shouldSendDaily($settings, $now),
            'weekly' => $this->shouldSendWeekly($settings, $now),
            default => false,
        };
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
        $nowInTimezone = $now->copy()->timezone($settings->timezone);
        $preferredTime = $this->preferredTime($settings);
        $lastSent = $settings->last_sent_at?->copy()->timezone($settings->timezone);

        if (! $preferredTime || $nowInTimezone->format('H:i') !== $preferredTime) {
            return false;
        }

        return ! $lastSent || ! $lastSent->isSameDay($nowInTimezone);
    }

    protected function shouldSendWeekly(NotificationSetting $settings, Carbon $now): bool
    {
        $nowInTimezone = $now->copy()->timezone($settings->timezone);
        $preferredTime = $this->preferredTime($settings);
        $lastSent = $settings->last_sent_at?->copy()->timezone($settings->timezone);
        $preferredWeekday = $settings->preferred_weekday;

        if ($preferredWeekday === null) {
            return false;
        }

        if (! $preferredTime || $nowInTimezone->format('H:i') !== $preferredTime) {
            return false;
        }

        if ((int) $nowInTimezone->dayOfWeek !== $preferredWeekday) {
            return false;
        }

        return ! $lastSent || ! $lastSent->isSameWeek($nowInTimezone, Carbon::SUNDAY);
    }

    protected function preferredTime(NotificationSetting $settings): ?string
    {
        return $settings->preferred_time ? substr($settings->preferred_time, 0, 5) : null;
    }
}
