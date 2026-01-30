<?php

namespace App\Console\Commands;

use App\Services\MoodReminderDispatcher;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendMoodReminders extends Command
{
    protected $signature = 'mood:send-reminders';

    protected $description = 'Send due mood reminders via Web Push';

    public function handle(MoodReminderDispatcher $dispatcher): int
    {
        $now = now();

        Log::info('reminders.send.tick', [
            'at' => $now->toIso8601String(),
        ]);

        $dispatcher->notifyHourlyUsers();

        $dailyTriggered = 0;
        foreach ($dispatcher->dailyScheduleDefinitions() as $definition) {
            $timezone = $definition['timezone'];
            $localNow = Carbon::now($timezone);

            if ($localNow->format('H:i') !== $definition['schedule_time']) {
                continue;
            }

            $dispatcher->notifyDailyUsers($timezone, $definition['query_time']);
            $dailyTriggered++;
        }

        $weeklyTriggered = 0;
        foreach ($dispatcher->weeklyScheduleDefinitions() as $definition) {
            $timezone = $definition['timezone'];
            $weekday = (int) $definition['preferred_weekday'];

            $localNow = Carbon::now($timezone);

            if ($localNow->dayOfWeek !== $weekday) {
                continue;
            }

            if ($localNow->format('H:i') !== $definition['schedule_time']) {
                continue;
            }

            $dispatcher->notifyWeeklyUsers($timezone, $weekday, $definition['query_time']);
            $weeklyTriggered++;
        }

        $this->info("Reminders checked. daily_groups={$dailyTriggered} weekly_groups={$weeklyTriggered}");

        return self::SUCCESS;
    }
}
