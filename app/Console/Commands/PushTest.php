<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\PushService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

class PushTest extends Command
{
    protected $signature = 'mood:push-test {user? : User id or email (defaults to latest subscribed user)}';

    protected $description = 'Send a test web push notification';

    public function handle(PushService $pushService): int
    {
        try {
            $user = $this->resolveUser();

            if (! $user) {
                $this->error('No user found. Provide a user id/email or create a push subscription first.');

                return self::FAILURE;
            }

            $subscriptionCount = $user->pushSubscriptions()->count();

            $this->line("Target user: {$user->id} <{$user->email}>");
            $this->line("Subscriptions: {$subscriptionCount}");

            $result = $pushService->sendToUser(
                $user,
                'Mood Tracker test',
                'If you can read this, web push is working.',
                ['url' => '/settings'],
            );

            Log::info('push.test.cli', [
                'user_id' => $user->id,
                ...$result,
            ]);

            $this->info("sent={$result['sent']} failed={$result['failed']} expired={$result['expired']}");

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }
    }

    protected function resolveUser(): ?User
    {
        $target = $this->argument('user');

        if (! $target) {
            return User::query()
                ->whereHas('pushSubscriptions')
                ->latest('id')
                ->first();
        }

        if (is_numeric($target)) {
            return User::query()->find((int) $target);
        }

        return User::query()->where('email', $target)->first();
    }
}

