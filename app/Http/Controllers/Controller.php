<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected const DEFAULT_TIMEZONE = 'America/Chicago';

    protected function userTimezone(): string
    {
        $user = request()->user();

        return $user?->notificationSetting?->timezone ?? self::DEFAULT_TIMEZONE;
    }
}
