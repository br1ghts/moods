<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSetting extends Model
{
    protected $fillable = [
        'user_id',
        'enabled',
        'test_mode_enabled',
        'test_interval_seconds',
        'cadence',
        'daily_time',
        'weekly_day',
        'timezone',
        'last_sent_at',
        'next_due_at',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'test_mode_enabled' => 'boolean',
        'weekly_day' => 'integer',
        'last_sent_at' => 'datetime',
        'next_due_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
