<?php

namespace App\Console\Commands;

use App\Jobs\SendReminderJob;
use App\Models\NotificationSetting;
use App\Models\ReminderSend;
use App\Services\ReminderScheduler;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;

class ReminderSendTestScheduled extends Command
{
    protected $signature = 'mood:reminders:send-test-scheduled {user_id}';

    protected $description = 'Force a scheduled-style reminder send for a user';

    public function handle(ReminderScheduler $scheduler): int
    {
        $userId = (int) $this->argument('user_id');
        $setting = NotificationSetting::query()->where('user_id', $userId)->first();

        if (! $setting) {
            $this->error('No notification settings found for that user.');

            return self::FAILURE;
        }

        $dueAtUtc = now('UTC');
        $bucketKey = $scheduler->bucketKey($setting, $dueAtUtc);

        try {
            ReminderSend::create([
                'user_id' => $userId,
                'bucket_key' => $bucketKey,
                'due_at_utc' => $dueAtUtc,
                'status' => 'queued',
            ]);
        } catch (QueryException) {
            $this->warn('Reminder send already exists for this bucket.');

            return self::SUCCESS;
        }

        SendReminderJob::dispatch($userId, $bucketKey);
        $this->info("Dispatched SendReminderJob for user {$userId} bucket {$bucketKey}");

        return self::SUCCESS;
    }
}
