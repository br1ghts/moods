<?php

namespace App\Providers;

use App\Models\MoodEntry;
use App\Policies\MoodEntryPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        MoodEntry::class => MoodEntryPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
