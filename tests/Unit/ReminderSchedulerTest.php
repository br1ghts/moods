<?php

namespace Tests\Unit;

use App\Models\NotificationSetting;
use App\Services\ReminderScheduler;
use Carbon\Carbon;
use Tests\TestCase;

class ReminderSchedulerTest extends TestCase
{
    public function test_weekly_next_due_respects_timezone_across_dst(): void
    {
        $scheduler = app(ReminderScheduler::class);
        $setting = new NotificationSetting([
            'enabled' => true,
            'cadence' => 'weekly',
            'daily_time' => '09:00',
            'weekly_day' => 0,
            'timezone' => 'America/Chicago',
        ]);

        $nowUtc = Carbon::create(2026, 3, 7, 16, 0, 0, 'UTC');
        $next = $scheduler->computeNextDue($setting, $nowUtc);

        $this->assertNotNull($next);
        $local = $next->copy()->timezone('America/Chicago');

        $this->assertSame(0, $local->dayOfWeek);
        $this->assertSame('09:00', $local->format('H:i'));
    }
}
