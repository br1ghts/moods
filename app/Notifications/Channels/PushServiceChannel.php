<?php

namespace App\Notifications\Channels;

use App\Services\PushService;
use Illuminate\Notifications\Notification;

class PushServiceChannel
{
    public function __construct(protected PushService $pushService)
    {
    }

    public function send($notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toPushService')) {
            return;
        }

        $payload = $notification->toPushService($notifiable);

        $this->pushService->sendToUser(
            $notifiable,
            $payload['title'] ?? '',
            $payload['body'] ?? '',
            $payload['data'] ?? [],
        );
    }
}
