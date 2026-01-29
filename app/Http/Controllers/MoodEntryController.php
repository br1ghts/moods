<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMoodEntryRequest;
use App\Models\Mood;
use App\Models\MoodEntry;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class MoodEntryController extends Controller
{
    public function log()
    {
        $timezone = $this->userTimezone();
        $user = request()->user();
        $moods = Mood::orderBy('sort_order')->get(['id', 'key', 'label', 'emoji', 'color']);

        $recentEntries = $user->moodEntries()
            ->with('mood')
            ->latest('occurred_at')
            ->take(5)
            ->get()
            ->map(fn (MoodEntry $entry) => [
                'id' => $entry->id,
                'mood' => [
                    'key' => $entry->mood->key,
                    'label' => $entry->mood->label,
                    'emoji' => $entry->mood->emoji,
                ],
                'intensity' => $entry->intensity,
                'notes' => $entry->notes,
                'occurred_at' => $entry->occurred_at->timezone($timezone)->toIso8601String(),
            ]);

        return Inertia::render('Log', [
            'moods' => $moods,
            'recentEntries' => $recentEntries,
        ]);
    }

    public function store(StoreMoodEntryRequest $request)
    {
        $occurredAt = $request->get('occurred_at')
            ? Carbon::parse($request->get('occurred_at'))
            : now();

        $request->user()->moodEntries()->create([
            'mood_id' => $request->input('mood_id'),
            'intensity' => $request->input('intensity'),
            'notes' => $request->input('notes'),
            'occurred_at' => $occurredAt,
        ]);

        return redirect()
            ->route('log')
            ->with('success', 'Mood saved.');
    }

    public function history()
    {
        $timezone = $this->userTimezone();
        $user = request()->user();
        $entries = $user->moodEntries()
            ->with('mood')
            ->latest('occurred_at')
            ->paginate(12);

        $mapped = $entries->getCollection()
            ->map(fn (MoodEntry $entry) => [
                'id' => $entry->id,
                'mood' => [
                    'key' => $entry->mood->key,
                    'emoji' => $entry->mood->emoji,
                ],
                'notes' => $entry->notes,
                'intensity' => $entry->intensity,
                'occurred_at' => $entry->occurred_at->timezone($timezone)->toIso8601String(),
                'date' => $entry->occurred_at->timezone($timezone)->toDateString(),
            ]);

        $grouped = $mapped
            ->groupBy('date')
            ->map(fn ($group, $date) => [
                'date' => $date,
                'entries' => $group->values(),
            ])
            ->values();

        return Inertia::render('History', [
            'history' => $grouped,
            'pagination' => [
                'current_page' => $entries->currentPage(),
                'last_page' => $entries->lastPage(),
                'next_page_url' => $entries->nextPageUrl(),
                'prev_page_url' => $entries->previousPageUrl(),
            ],
        ]);
    }

    public function destroy(MoodEntry $moodEntry)
    {
        $this->authorize('delete', $moodEntry);

        $moodEntry->delete();

        return redirect()->back()->with('success', 'Entry removed.');
    }
}
