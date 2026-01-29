<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login()
    {
        $response = $this->get('/log');

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_visit_log_page()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/log');

        $response->assertStatus(200);
    }
}
