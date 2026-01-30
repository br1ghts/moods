<?php

namespace Tests\Feature;

use App\Models\Mood;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\MoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MoodEntryTimezoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_log_recent_entries_include_local_and_human_timestamps()
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $mood = Mood::firstOrFail();

        $entry = $user->moodEntries()->create([
            'mood_id' => $mood->id,
            'intensity' => 3,
            'notes' => null,
            'occurred_at' => Carbon::parse('2026-01-30T04:18:00Z'),
        ]);

        $entry->forceFill([
            'created_at' => Carbon::parse('2026-01-30T05:20:00Z'),
            'updated_at' => Carbon::parse('2026-01-30T05:20:00Z'),
        ])->save();

        $response = $this->actingAs($user)->get(route('log'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Log')
                ->has('recentEntries', 1)
                ->where('recentEntries.0.id', $entry->id)
                ->where('recentEntries.0.occurred_at_iso_utc', '2026-01-30T04:18:00+00:00')
                ->where('recentEntries.0.occurred_at_local', '2026-01-29T22:18:00-06:00')
                ->where('recentEntries.0.occurred_at_human', 'Jan 29 at 10:18pm')
                ->where('recentEntries.0.created_at_iso_utc', '2026-01-30T05:20:00+00:00')
                ->where('recentEntries.0.created_at_local', '2026-01-29T23:20:00-06:00')
                ->where('recentEntries.0.created_at_human', 'Jan 29 at 11:20pm')
            );
    }
}
