<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

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

        return response()->json(['status' => 'ok']);
    }
}
