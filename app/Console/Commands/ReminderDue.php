<?php

namespace App\Console\Commands;

use App\Models\NotificationSetting;
use App\Services\ReminderScheduler;
use Illuminate\Console\Command;

class ReminderDue extends Command
{
    protected $signature = 'mood:reminders:due {user_id}';

    protected $description = 'Print next_due_at and next three occurrences for a user';

    public function handle(ReminderScheduler $scheduler): int
    {
        $userId = (int) $this->argument('user_id');
        $setting = NotificationSetting::query()->where('user_id', $userId)->first();

        if (! $setting) {
            $this->error('No notification settings found for that user.');

            return self::FAILURE;
        }

        $nowUtc = now('UTC');
        $next = $setting->next_due_at?->copy();

        $this->info('Current next_due_at: '.($next?->toIso8601String() ?? 'null'));

        $cursor = $nowUtc->copy();
        $this->line('Next 3 due times:');

        for ($i = 0; $i < 3; $i++) {
            $due = $scheduler->computeNextDue($setting, $cursor);
            if (! $due) {
                $this->line(' - null');
                break;
            }

            $this->line(' - '.$due->copy()->utc()->toIso8601String().' ('.$due->copy()->timezone($setting->timezone)->toDateTimeString().' '.$setting->timezone.')');
            $cursor = $due->copy()->addSecond()->utc();
        }

        return self::SUCCESS;
    }
}
