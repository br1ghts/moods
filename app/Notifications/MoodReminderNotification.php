<?php

namespace App\Notifications;

use App\Notifications\Channels\PushServiceChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class MoodReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return [PushServiceChannel::class];
    }

    public function toPushService(object $notifiable): array
    {
        return [
            'title' => 'Mood check-in',
            'body' => 'Take a moment to log how you\'re feeling.',
            'data' => ['url' => '/log'],
        ];
    }
}
