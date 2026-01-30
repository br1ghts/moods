<?php

namespace Database\Seeders;

use App\Models\Mood;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MoodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $moods = [
            ['key' => 'happy', 'label' => 'Happy', 'emoji' => '😄', 'color' => 'yellow', 'sort_order' => 1, 'is_active' => true],
            ['key' => 'peaceful', 'label' => 'Peaceful', 'emoji' => '😌', 'color' => 'emerald', 'sort_order' => 2, 'is_active' => true],
            ['key' => 'focused', 'label' => 'Focused', 'emoji' => '🎯', 'color' => 'blue', 'sort_order' => 3, 'is_active' => true],
            ['key' => 'tired', 'label' => 'Tired', 'emoji' => '😴', 'color' => 'slate', 'sort_order' => 4, 'is_active' => true],
            ['key' => 'anxious', 'label' => 'Anxious', 'emoji' => '😰', 'color' => 'orange', 'sort_order' => 5, 'is_active' => true],
            ['key' => 'sad', 'label' => 'Sad', 'emoji' => '😔', 'color' => 'indigo', 'sort_order' => 6, 'is_active' => true],
            ['key' => 'angry', 'label' => 'Angry', 'emoji' => '😠', 'color' => 'red', 'sort_order' => 7, 'is_active' => true],
            ['key' => 'grateful', 'label' => 'Grateful', 'emoji' => '🙏', 'color' => 'teal', 'sort_order' => 8, 'is_active' => true],
            ['key' => 'overwhelmed', 'label' => 'Overwhelmed', 'emoji' => '🫠', 'color' => 'purple', 'sort_order' => 9, 'is_active' => true],
            ['key' => 'excited', 'label' => 'Excited', 'emoji' => '🤩', 'color' => 'pink', 'sort_order' => 10, 'is_active' => true],
        ];

        foreach ($moods as $mood) {
            Mood::updateOrCreate(['key' => $mood['key']], $mood);
        }
    }
}
