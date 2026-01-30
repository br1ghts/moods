<?php

use App\Services\MoodReminderDispatcher;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Schema;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (Schedule $schedule) {
        $dispatcher = app(MoodReminderDispatcher::class);

        $schedule->call(fn () => $dispatcher->notifyHourlyUsers())->hourly();

        if (! Schema::hasTable('notification_settings')) {
            return;
        }

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
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'admin.email' => \App\Http\Middleware\EnsureAdminEmail::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
