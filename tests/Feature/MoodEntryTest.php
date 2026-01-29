<?php

namespace Tests\Feature;

use App\Models\Mood;
use App\Models\User;
use Database\Seeders\MoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoodEntryTest extends TestCase
{
    use RefreshDatabase;

    public function test_mood_entry_can_be_created()
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $mood = Mood::first();

        $response = $this->actingAs($user)->post(route('mood-entries.store'), [
            'mood_id' => $mood->id,
            'intensity' => 4,
            'notes' => 'Test note',
        ]);

        $response->assertRedirect(route('log'));

        $this->assertDatabaseHas('mood_entries', [
            'user_id' => $user->id,
            'mood_id' => $mood->id,
            'intensity' => 4,
            'notes' => 'Test note',
        ]);
    }
}
