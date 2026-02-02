<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationSetting extends Model
{
    protected $fillable = [
        'user_id',
        'enabled',
        'cadence',
        'preferred_time',
        'preferred_weekday',
        'timezone',
        'last_sent_at',
        'next_reminder_at',
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'preferred_weekday' => 'integer',
        'last_sent_at' => 'datetime',
        'next_reminder_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
