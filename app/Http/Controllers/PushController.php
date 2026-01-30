<?php

namespace App\Http\Controllers;

use App\Services\PushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PushController extends Controller
{
    public function vapidPublicKey(Request $request)
    {
        return response()->json([
            'key' => config('push.vapid.public_key'),
        ]);
    }

    public function subscribe(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'endpoint' => ['required', 'url'],
            'keys' => ['required', 'array'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
            'content_encoding' => ['nullable', 'string'],
            'device_label' => ['nullable', 'string'],
        ]);

        $user->pushSubscriptions()->updateOrCreate([
            'endpoint' => $data['endpoint'],
        ], [
            'public_key' => $data['keys']['p256dh'],
            'auth_token' => $data['keys']['auth'],
            'content_encoding' => $data['content_encoding'] ?? null,
            'user_agent' => $request->userAgent(),
            'device_label' => $data['device_label'] ?? null,
            'last_seen_at' => now(),
        ]);

        Log::info('push.subscribe', [
            'user_id' => $user->id,
            'endpoint' => $data['endpoint'],
        ]);

        return response()->json(['status' => 'ok']);
    }

    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => ['required', 'url'],
        ]);

        $request->user()
            ->pushSubscriptions()
            ->where('endpoint', $request->input('endpoint'))
            ->delete();

        Log::info('push.unsubscribe', [
            'user_id' => $request->user()?->id,
            'endpoint' => $request->input('endpoint'),
        ]);

        return response()->json(['status' => 'ok']);
    }

    public function test(Request $request, PushService $pushService)
    {
        $user = $request->user();

        $result = $pushService->sendToUser(
            $user,
            'Mood Tracker test',
            'If you can read this, web push is working.',
            ['url' => '/settings'],
        );

        Log::info('push.test', [
            'user_id' => $user->id,
            ...$result,
        ]);

        return response()->json([
            'ok' => true,
            'sent' => $result['sent'] ?? 0,
            'failed' => $result['failed'] ?? 0,
            'expired' => $result['expired'] ?? 0,
        ]);
    }
}
