<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoodEntry extends Model
{
    protected $fillable = [
        'user_id',
        'mood_id',
        'intensity',
        'notes',
        'occurred_at',
    ];

    protected $casts = [
        'intensity' => 'integer',
        'occurred_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mood(): BelongsTo
    {
        return $this->belongsTo(Mood::class);
    }
}
