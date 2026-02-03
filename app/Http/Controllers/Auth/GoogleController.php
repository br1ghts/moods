<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            return redirect()
                ->route('login')
                ->with('error', 'Google sign-in failed. Please try again.');
        }

        if (! $googleUser->getEmail()) {
            return redirect()
                ->route('login')
                ->with('error', 'Google account did not provide an email.');
        }

        $user = User::firstOrNew(['email' => $googleUser->getEmail()]);
        $user->name = $user->name ?: $googleUser->getName() ?? $googleUser->getNickname() ?? 'Mood Tracker guest';
        $user->google_id = $googleUser->getId();
        $user->avatar = $googleUser->getAvatar();
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->save();

        Auth::login($user, true);

        return redirect()->route('log');
    }
}
