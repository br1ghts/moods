<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\MoodEntry;

class Mood extends Model
{
    protected $fillable = ['key', 'label', 'emoji', 'color', 'sort_order'];

    public function entries(): HasMany
    {
        return $this->hasMany(MoodEntry::class);
    }
}
