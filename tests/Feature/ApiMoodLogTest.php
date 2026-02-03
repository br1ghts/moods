<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\MoodSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiMoodLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_token_logs_mood_entry(): void
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $token = $user->regenerateApiToken();

        $response = $this->getJson("/api/{$token}/log/happy");

        $response
            ->assertOk()
            ->assertJson([
                'ok' => true,
                'mood' => [
                    'key' => 'happy',
                    'label' => 'Happy',
                ],
                'note' => null,
            ]);

        $this->assertDatabaseHas('mood_entries', [
            'user_id' => $user->id,
            'notes' => null,
            'intensity' => 3,
        ]);
    }

    public function test_invalid_token_returns_unauthorized(): void
    {
        $this->seed(MoodSeeder::class);

        $response = $this->getJson('/api/short/log/happy');

        $response
            ->assertStatus(401)
            ->assertJson([
                'ok' => false,
                'error' => 'invalid_token',
            ]);
    }

    public function test_unknown_mood_returns_bad_request(): void
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $token = $user->regenerateApiToken();

        $response = $this->getJson("/api/{$token}/log/unknown");

        $response
            ->assertStatus(400)
            ->assertJson([
                'ok' => false,
                'error' => 'unknown_mood',
            ]);
    }

    public function test_note_parsing_from_path_plus(): void
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $token = $user->regenerateApiToken();

        $response = $this->getJson("/api/{$token}/log/happy+hello+world");

        $response->assertOk();

        $this->assertDatabaseHas('mood_entries', [
            'user_id' => $user->id,
            'notes' => 'hello world',
        ]);
    }

    public function test_note_parsing_from_query(): void
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $token = $user->regenerateApiToken();

        $response = $this->getJson("/api/{$token}/log/happy?note=hello%20world");

        $response->assertOk();

        $this->assertDatabaseHas('mood_entries', [
            'user_id' => $user->id,
            'notes' => 'hello world',
        ]);
    }

    public function test_rate_limit_returns_429(): void
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $token = $user->regenerateApiToken();

        for ($i = 0; $i < 20; $i++) {
            $this->getJson("/api/{$token}/log/happy");
        }

        $response = $this->getJson("/api/{$token}/log/happy");

        $response->assertStatus(429);
    }

    public function test_list_moods_returns_active_moods(): void
    {
        $this->seed(MoodSeeder::class);

        $user = User::factory()->create();
        $token = $user->regenerateApiToken();

        $response = $this->getJson("/api/{$token}/list");

        $response
            ->assertOk()
            ->assertJson([
                'ok' => true,
            ])
            ->assertJsonStructure([
                'moods' => [
                    '*' => ['key', 'label', 'emoji', 'color'],
                ],
            ]);
    }
}
