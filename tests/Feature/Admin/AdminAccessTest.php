<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    public function test_admin_email_can_access_admin_pages()
    {
        $admin = User::factory()->create([
            'email' => 'brendonbaughray@gmail.com',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk();

        $this->actingAs($admin)
            ->get(route('admin.emotions.index'))
            ->assertOk();
    }

    public function test_non_admin_gets_forbidden()
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
        ]);

        $this->actingAs($user)
            ->get(route('admin.dashboard'))
            ->assertForbidden();

        $this->actingAs($user)
            ->get(route('admin.emotions.index'))
            ->assertForbidden();
    }

    public function test_guest_redirected_to_login()
    {
        $this->get(route('admin.dashboard'))
            ->assertRedirect(route('login'));
    }

    public function test_admin_can_create_emotion()
    {
        $admin = User::factory()->create([
            'email' => 'brendonbaughray@gmail.com',
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.emotions.store'), [
                'label' => 'Curious',
                'key' => 'curious',
                'emoji' => '🤔',
                'color' => 'teal',
                'sort_order' => 99,
                'is_active' => true,
            ]);

        $response->assertRedirect(route('admin.emotions.index'));

        $this->assertDatabaseHas('moods', [
            'label' => 'Curious',
            'key' => 'curious',
            'emoji' => '🤔',
            'color' => 'teal',
            'sort_order' => 99,
            'is_active' => true,
        ]);
    }

    public function test_non_admin_cannot_create_emotion()
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
        ]);

        $this->actingAs($user)
            ->post(route('admin.emotions.store'), [
                'label' => 'Sneaky',
                'key' => 'sneaky',
                'emoji' => '😏',
                'color' => 'red',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('moods', [
            'key' => 'sneaky',
        ]);
    }
}
