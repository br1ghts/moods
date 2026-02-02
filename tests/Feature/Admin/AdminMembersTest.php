<?php

namespace Tests\Feature\Admin;

use App\Models\PushSubscription;
use App\Models\User;
use Tests\TestCase;

class AdminMembersTest extends TestCase
{
    public function test_admin_can_view_members_list(): void
    {
        $admin = User::factory()->create([
            'email' => 'brendonbaughray@gmail.com',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.members.index'))
            ->assertOk();
    }

    public function test_admin_can_disable_and_enable_member_access(): void
    {
        $admin = User::factory()->create([
            'email' => 'brendonbaughray@gmail.com',
        ]);

        $member = User::factory()->create([
            'email' => 'member@example.com',
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.members.toggle', $member->id))
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'is_disabled' => true,
        ]);

        $member->refresh();

        $this->actingAs($member)
            ->get(route('log'))
            ->assertRedirect(route('landing'));

        $this->actingAs($admin)
            ->patch(route('admin.members.toggle', $member->id))
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $member->id,
            'is_disabled' => false,
        ]);
    }

    public function test_admin_can_revoke_push_subscriptions(): void
    {
        $admin = User::factory()->create([
            'email' => 'brendonbaughray@gmail.com',
        ]);

        $member = User::factory()->create([
            'email' => 'member@example.com',
        ]);

        PushSubscription::create([
            'user_id' => $member->id,
            'endpoint' => 'https://example.com/push/1',
            'public_key' => 'public',
            'auth_token' => 'auth',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.members.push.revoke', $member->id))
            ->assertRedirect();

        $this->assertDatabaseMissing('push_subscriptions', [
            'user_id' => $member->id,
        ]);
    }

    public function test_non_admin_cannot_access_members_routes(): void
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
        ]);

        $this->actingAs($user)
            ->get(route('admin.members.index'))
            ->assertForbidden();
    }
}
