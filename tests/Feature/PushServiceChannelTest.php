<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\Channels\PushServiceChannel;
use App\Notifications\MoodReminderNotification;
use App\Services\PushService;
use Mockery\MockInterface;
use Tests\TestCase;

class PushServiceChannelTest extends TestCase
{
    public function test_channel_delegates_to_push_service(): void
    {
        $user = User::factory()->create();

        $this->mock(PushService::class, function (MockInterface $mock) use ($user) {
            $mock->shouldReceive('sendToUser')
                ->once()
                ->withArgs(function ($targetUser, $title, $body, $data) use ($user) {
                    return $targetUser->id === $user->id
                        && $title === 'Mood check-in'
                        && $body === "Take a moment to log how you're feeling."
                        && $data === ['url' => '/log'];
                });
        });

        $channel = app(PushServiceChannel::class);

        $channel->send($user, new MoodReminderNotification());
    }
}
