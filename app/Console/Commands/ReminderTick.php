<?php

namespace App\Console\Commands;

use App\Jobs\SendReminderJob;
use App\Models\NotificationSetting;
use App\Models\ReminderSend;
use App\Services\ReminderScheduler;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ReminderTick extends Command
{
    protected $signature = 'mood:reminders:tick';

    protected $description = 'Evaluate due reminders and dispatch send jobs';

    public function handle(ReminderScheduler $scheduler): int
    {
        $startedAt = microtime(true);
        $lock = Cache::lock('reminders:tick', 55);

        if (! $lock->get()) {
            Log::warning('[REMINDERS] tick.locked');
            $this->warn('Tick skipped: already running.');

            return self::SUCCESS;
        }

        $nowUtc = now('UTC');
        $cutoff = $nowUtc->copy()->addSeconds(30);
        $countDue = 0;
        $countDispatched = 0;
        $countSkipped = 0;
        $countInitialized = 0;
        $countStaleFailed = 0;

        try {
            $staleCutoff = $nowUtc->copy()->subMinutes(2);
            $countStaleFailed = ReminderSend::query()
                ->where('status', 'queued')
                ->whereNull('attempted_at_utc')
                ->where('due_at_utc', '<=', $staleCutoff)
                ->update([
                    'status' => 'failed',
                    'failure_reason' => 'stale_queued',
                    'attempted_at_utc' => $nowUtc,
                    'completed_at_utc' => $nowUtc,
                ]);

            $missing = NotificationSetting::query()
                ->where('enabled', true)
                ->whereNull('next_due_at')
                ->get();

            foreach ($missing as $setting) {
                $next = $scheduler->computeNextDue($setting, $nowUtc);
                $setting->forceFill([
                    'next_due_at' => $next?->copy()->utc(),
                ])->save();
                $countInitialized++;
            }

            $dueSettings = NotificationSetting::query()
                ->where('enabled', true)
                ->whereNotNull('next_due_at')
                ->where('next_due_at', '<=', $cutoff)
                ->whereHas('user', fn ($query) => $query->where('is_disabled', false))
                ->get();

            $countDue = $dueSettings->count();

            foreach ($dueSettings as $setting) {
                $dueAtUtc = $setting->next_due_at?->copy()->utc() ?? $nowUtc->copy();
                $bucketKey = $scheduler->bucketKey($setting, $dueAtUtc);

                try {
                    ReminderSend::create([
                        'user_id' => $setting->user_id,
                        'bucket_key' => $bucketKey,
                        'due_at_utc' => $dueAtUtc,
                        'status' => 'queued',
                    ]);

                    SendReminderJob::dispatch($setting->user_id, $bucketKey);
                    $countDispatched++;
                } catch (QueryException $exception) {
                    $countSkipped++;
                    Log::info('[REMINDERS] tick.duplicate', [
                        'user_id' => $setting->user_id,
                        'bucket_key' => $bucketKey,
                    ]);
                }

                $next = $scheduler->computeNextDue($setting, $nowUtc);
                $setting->forceFill([
                    'next_due_at' => $next?->copy()->utc(),
                ])->save();
            }

            $durationMs = (int) round((microtime(true) - $startedAt) * 1000);

            Cache::put('reminders:last_tick_at', $nowUtc->toIso8601String(), 86400);

            Log::info('[REMINDERS] tick.done', [
                'count_due' => $countDue,
                'count_dispatched' => $countDispatched,
                'count_skipped_duplicate' => $countSkipped,
                'count_initialized' => $countInitialized,
                'count_stale_failed' => $countStaleFailed,
                'tick_duration_ms' => $durationMs,
            ]);

            $this->info("Tick complete. due={$countDue} dispatched={$countDispatched} skipped={$countSkipped} initialized={$countInitialized} stale_failed={$countStaleFailed}");
        } finally {
            $lock->release();
        }

        return self::SUCCESS;
    }
}
