<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\RuntimeException;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\MessageSentReport;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushService
{
    protected WebPush $webPush;

    public function __construct()
    {
        $vapid = config('push.vapid');

        if (empty($vapid['public_key']) || empty($vapid['private_key'])) {
            throw new RuntimeException('Push VAPID keys are not configured.');
        }

        $this->webPush = new WebPush([
            'VAPID' => [
                'subject' => $vapid['subject'] ?? 'mailto:hello@example.com',
                'publicKey' => $vapid['public_key'],
                'privateKey' => $vapid['private_key'],
            ],
        ]);
    }

    public function sendToUser(User $user, string $title, string $body, array $data = []): array
    {
        $subscriptions = $user->pushSubscriptions()->get();
        $subscriptionCount = $subscriptions->count();

        Log::info('push.send.attempt', [
            'user_id' => $user->id,
            'subscriptions' => $subscriptionCount,
            'title' => $title,
        ]);

        if ($subscriptionCount === 0) {
            return ['sent' => 0, 'failed' => 0, 'expired' => 0];
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]) ?: '';

        foreach ($subscriptions as $subscription) {
            $this->webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding ?: 'aes128gcm',
                ]),
                $payload,
            );
        }

        $sent = 0;
        $failed = 0;
        $expired = 0;

        foreach ($this->webPush->flush() as $report) {
            if (! $report instanceof MessageSentReport) {
                continue;
            }

            $endpoint = $report->getEndpoint();
            $model = $subscriptions->firstWhere('endpoint', $endpoint);

            if (! $model) {
                continue;
            }

            if ($report->isSubscriptionExpired()) {
                $expired++;
                $model->delete();

                Log::info('push.send.expired', [
                    'user_id' => $user->id,
                    'endpoint' => $endpoint,
                ]);

                continue;
            }

            if ($report->isSuccess()) {
                $sent++;
                $model->forceFill([
                    'last_push_at' => now(),
                    'last_push_error' => null,
                ])->save();

                continue;
            }

            $failed++;
            $reason = (string) $report->getReason();

            $model->forceFill([
                'last_push_at' => now(),
                'last_push_error' => $reason ?: 'Unknown push failure',
            ])->save();

            Log::warning('push.send.failed', [
                'user_id' => $user->id,
                'endpoint' => $endpoint,
                'reason' => $reason,
            ]);
        }

        Log::info('push.send.done', [
            'user_id' => $user->id,
            'sent' => $sent,
            'failed' => $failed,
            'expired' => $expired,
        ]);

        return ['sent' => $sent, 'failed' => $failed, 'expired' => $expired];
    }
}
