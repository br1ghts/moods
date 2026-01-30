<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    use AuthorizesRequests;
    use ValidatesRequests;

    protected const DEFAULT_TIMEZONE = 'America/Chicago';

    protected function userTimezone(): string
    {
        $user = request()->user();

        return $user?->notificationSetting?->timezone ?? self::DEFAULT_TIMEZONE;
    }
}
