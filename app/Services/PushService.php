<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\RuntimeException;
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

    public function sendToUser(User $user, string $title, string $body, array $data = []): void
    {
        $subscriptions = $user->pushSubscriptions;

        if ($subscriptions->isEmpty()) {
            return;
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]) ?: '';

        foreach ($subscriptions as $subscription) {
            $this->webPush->sendOneNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding,
                ]),
                $payload,
            );

            $subscription->update(['last_seen_at' => now()]);
        }

        foreach ($this->webPush->flush() as $report) {
            if (! $report instanceof MessageSentReport) {
                continue;
            }

            if ($report->isSubscriptionExpired()) {
                $user->pushSubscriptions()
                    ->where('endpoint', $report->getEndpoint())
                    ->delete();
            }
        }
    }
}
