<?php

namespace App\Jobs;

use App\Models\NotificationSetting;
use App\Models\ReminderSend;
use App\Models\User;
use App\Notifications\MoodReminderNotification;
use App\Services\PushService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $userId,
        public string $bucketKey,
    ) {
    }

    public function handle(PushService $pushService): void
    {
        $reminderSend = ReminderSend::query()
            ->where('user_id', $this->userId)
            ->where('bucket_key', $this->bucketKey)
            ->first();

        if (! $reminderSend) {
            Log::warning('[REMINDERS] send.missing', [
                'user_id' => $this->userId,
                'bucket_key' => $this->bucketKey,
            ]);

            return;
        }

        if (in_array($reminderSend->status, ['sent', 'failed', 'skipped'], true)) {
            return;
        }

        if ($reminderSend->attempted_at_utc) {
            $reminderSend->forceFill([
                'status' => 'skipped',
                'failure_reason' => 'already_attempted',
                'completed_at_utc' => now('UTC'),
            ])->save();

            return;
        }

        $reminderSend->forceFill([
            'attempted_at_utc' => now('UTC'),
            'status' => 'sending',
        ])->save();

        $user = User::query()->with('pushSubscriptions')->find($this->userId);

        if (! $user) {
            $reminderSend->forceFill([
                'status' => 'failed',
                'failure_reason' => 'user_missing',
                'completed_at_utc' => now('UTC'),
            ])->save();

            return;
        }

        $devicesTargeted = $user->pushSubscriptions->count();

        if ($devicesTargeted === 0) {
            $reminderSend->forceFill([
                'status' => 'failed',
                'failure_reason' => 'no_subscriptions',
                'devices_targeted' => 0,
                'completed_at_utc' => now('UTC'),
            ])->save();

            return;
        }

        try {
            $notification = new MoodReminderNotification();
            $payload = $notification->toPushService($user);
            $data = array_merge($payload['data'] ?? [], [
                'bucket_key' => $this->bucketKey,
                'sent_at' => now('UTC')->toIso8601String(),
            ]);

            $result = $pushService->sendToUser(
                $user,
                $payload['title'] ?? 'Mood check-in',
                $payload['body'] ?? 'Take a moment to log how you\'re feeling.',
                $data,
            );

            $sent = (int) ($result['sent'] ?? 0);
            $failed = (int) ($result['failed'] ?? 0);
            $expired = (int) ($result['expired'] ?? 0);
            $devicesFailed = $failed + $expired;
            $status = $sent > 0 ? 'sent' : 'failed';
            $failureReason = null;

            if ($sent === 0) {
                $failureReason = $expired === $devicesTargeted ? 'all_expired' : 'all_failed';
            }

            $reminderSend->forceFill([
                'status' => $status,
                'failure_reason' => $failureReason,
                'devices_targeted' => $devicesTargeted,
                'devices_succeeded' => $sent,
                'devices_failed' => $devicesFailed,
                'completed_at_utc' => now('UTC'),
            ])->save();

            if ($status === 'sent') {
                NotificationSetting::query()
                    ->where('user_id', $this->userId)
                    ->update(['last_sent_at' => now('UTC')]);
            }

            Log::info('[REMINDERS] send.done', [
                'user_id' => $this->userId,
                'bucket_key' => $this->bucketKey,
                'status' => $status,
                'sent' => $sent,
                'failed' => $devicesFailed,
            ]);
        } catch (\Throwable $exception) {
            $message = trim($exception->getMessage());
            $reminderSend->forceFill([
                'status' => 'failed',
                'failure_reason' => $message !== '' ? $message : 'exception',
                'devices_targeted' => $devicesTargeted,
                'devices_succeeded' => 0,
                'devices_failed' => $devicesTargeted,
                'completed_at_utc' => now('UTC'),
            ])->save();

            Log::error('[REMINDERS] send.exception', [
                'user_id' => $this->userId,
                'bucket_key' => $this->bucketKey,
                'message' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }
}
