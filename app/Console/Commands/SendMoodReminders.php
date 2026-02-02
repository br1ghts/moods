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

        Log::info('[REMINDERS] schedule.start', [
            'now_server' => $now->toIso8601String(),
            'app_tz' => config('app.timezone'),
        ]);

        $hourly = $dispatcher->notifyHourlyUsers();

        $dailyTriggered = 0;
        $dailyTargets = 0;
        $dailyDevices = 0;
        foreach ($dispatcher->dailyScheduleDefinitions() as $definition) {
            $timezone = $definition['timezone'];
            $localNow = Carbon::now($timezone);

            if ($localNow->format('H:i') !== $definition['schedule_time']) {
                continue;
            }

            $result = $dispatcher->notifyDailyUsers($timezone, $definition['query_time']);
            $dailyTargets += $result['targets'];
            $dailyDevices += $result['devices'];
            $dailyTriggered++;
        }

        $weeklyTriggered = 0;
        $weeklyTargets = 0;
        $weeklyDevices = 0;
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

            $result = $dispatcher->notifyWeeklyUsers($timezone, $weekday, $definition['query_time']);
            $weeklyTargets += $result['targets'];
            $weeklyDevices += $result['devices'];
            $weeklyTriggered++;
        }

        $this->info("Reminders checked. daily_groups={$dailyTriggered} weekly_groups={$weeklyTriggered}");

        Log::info('[REMINDERS] schedule.done', [
            'now_server' => now()->toIso8601String(),
            'app_tz' => config('app.timezone'),
            'targets' => [
                'hourly' => $hourly['targets'] ?? 0,
                'daily' => $dailyTargets,
                'weekly' => $weeklyTargets,
            ],
            'devices' => [
                'hourly' => $hourly['devices'] ?? 0,
                'daily' => $dailyDevices,
                'weekly' => $weeklyDevices,
            ],
        ]);

        return self::SUCCESS;
    }
}
