<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EnsureUserNotDisabled
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check() && Auth::user()?->is_disabled) {
            Auth::logout();

            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('landing')
                ->with('error', 'Your account has been disabled. Contact support if you believe this is a mistake.');
        }

        return $next($request);
    }
}
