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
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'preferred_weekday' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
