<?php

namespace Tests\Feature;

use App\Models\Mood;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\MoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoodEntryDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_delete_their_own_mood_entry()
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $mood = Mood::firstOrFail();

        $entry = $user->moodEntries()->create([
            'mood_id' => $mood->id,
            'intensity' => 2,
            'notes' => 'Delete me',
            'occurred_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($user)
            ->from(route('history'))
            ->delete(route('mood-entries.destroy', $entry));

        $response->assertRedirect(route('history'));

        $this->assertDatabaseMissing('mood_entries', [
            'id' => $entry->id,
        ]);
    }

    public function test_user_cannot_delete_another_users_mood_entry()
    {
        $this->seed(MoodSeeder::class);

        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $mood = Mood::firstOrFail();

        $entry = $owner->moodEntries()->create([
            'mood_id' => $mood->id,
            'intensity' => 5,
            'notes' => 'Keep me',
            'occurred_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($attacker)->delete(route('mood-entries.destroy', $entry));

        $response->assertForbidden();

        $this->assertDatabaseHas('mood_entries', [
            'id' => $entry->id,
            'user_id' => $owner->id,
        ]);
    }
}

