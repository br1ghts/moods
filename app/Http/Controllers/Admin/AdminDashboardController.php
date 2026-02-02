<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Mood;
use App\Models\MoodEntry;
use App\Models\PushSubscription;
use App\Models\User;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Index', [
            'emotionCount' => Mood::count(),
            'memberCount' => User::count(),
            'activeMemberCount' => User::where('is_disabled', false)->count(),
            'moodEntryCount' => MoodEntry::count(),
            'pushDeviceCount' => PushSubscription::count(),
        ]);
    }
}
