<?php

namespace Tests\Feature\Admin;

use App\Models\Mood;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminCsvTest extends TestCase
{
    public function test_admin_can_export_csv()
    {
        $admin = User::factory()->create([
            'email' => 'brendonbaughray@gmail.com',
        ]);

        Mood::create([
            'label' => 'Test',
            'key' => 'test',
            'emoji' => '🧪',
            'color' => 'blue',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->get(route('admin.emotions.export'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=utf-8');

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertStringContainsString('label,key,emoji,color,sort_order,is_active', $content);
        $this->assertStringContainsString('test', $content);
    }

    public function test_admin_can_import_csv()
    {
        $admin = User::factory()->create([
            'email' => 'brendonbaughray@gmail.com',
        ]);

        $csv = implode("\n", [
            'label,key,emoji,color,sort_order,is_active',
            'Curious,curious,🤔,teal,5,1',
            'Calm,calm,😌,emerald,6,0',
        ]);

        $file = UploadedFile::fake()->createWithContent('emotions.csv', $csv);

        $response = $this->actingAs($admin)
            ->post(route('admin.emotions.import'), [
                'csv' => $file,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('moods', [
            'key' => 'curious',
            'is_active' => true,
        ]);
        $this->assertDatabaseHas('moods', [
            'key' => 'calm',
            'is_active' => false,
        ]);
    }

    public function test_non_admin_cannot_import_csv()
    {
        $user = User::factory()->create([
            'email' => 'user@example.com',
        ]);

        $file = UploadedFile::fake()->createWithContent('emotions.csv', 'label,key\nUpset,upset');

        $this->actingAs($user)
            ->post(route('admin.emotions.import'), [
                'csv' => $file,
            ])
            ->assertForbidden();
    }
}
