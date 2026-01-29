<?php

use App\Services\MoodReminderDispatcher;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

return function (Schedule $schedule) {
    $dispatcher = app(MoodReminderDispatcher::class);

    $schedule->call(fn () => $dispatcher->notifyHourlyUsers())->hourly();

    foreach ($dispatcher->dailyScheduleDefinitions() as $definition) {
        $schedule->call(fn () => $dispatcher->notifyDailyUsers($definition['timezone'], $definition['query_time']))
            ->dailyAt($definition['schedule_time'])
            ->timezone($definition['timezone']);
    }

    foreach ($dispatcher->weeklyScheduleDefinitions() as $definition) {
        $schedule->call(fn () => $dispatcher->notifyWeeklyUsers($definition['timezone'], $definition['preferred_weekday'], $definition['query_time']))
            ->weeklyOn($definition['preferred_weekday'], $definition['schedule_time'])
            ->timezone($definition['timezone']);
    }
};
