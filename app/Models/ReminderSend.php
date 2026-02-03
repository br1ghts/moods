<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReminderSend extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'bucket_key',
        'due_at_utc',
        'attempted_at_utc',
        'completed_at_utc',
        'status',
        'failure_reason',
        'devices_targeted',
        'devices_succeeded',
        'devices_failed',
        'created_at',
    ];

    protected $casts = [
        'due_at_utc' => 'datetime',
        'attempted_at_utc' => 'datetime',
        'completed_at_utc' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
