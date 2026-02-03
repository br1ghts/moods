<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use App\Models\PushSubscription;
use App\Models\ReminderSend;
use Illuminate\Support\Facades\Crypt;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
        'is_disabled',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_disabled' => 'boolean',
            'api_enabled' => 'boolean',
        ];
    }

    public function moodEntries()
    {
        return $this->hasMany(MoodEntry::class);
    }

    public function notificationSetting()
    {
        return $this->hasOne(NotificationSetting::class);
    }

    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }

    public function reminderSends(): HasMany
    {
        return $this->hasMany(ReminderSend::class);
    }

    public function ensureApiToken(): string
    {
        if (! $this->api_token_hash || ! $this->api_token_encrypted) {
            return $this->regenerateApiToken();
        }

        return Crypt::decryptString($this->api_token_encrypted);
    }

    public function regenerateApiToken(): string
    {
        $plain = bin2hex(random_bytes(32));

        $this->forceFill([
            'api_token_hash' => hash('sha256', $plain),
            'api_token_encrypted' => Crypt::encryptString($plain),
            'api_enabled' => true,
        ]);

        $this->save();

        return $plain;
    }
}
