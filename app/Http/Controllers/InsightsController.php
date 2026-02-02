<?php

namespace App\Http\Controllers;

use App\Models\Mood;
use App\Models\MoodEntry;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class InsightsController extends Controller
{
    public function index()
    {
        return Inertia::render('Insights', [
            'moods' => Mood::orderBy('sort_order')
                ->get(['id', 'key', 'label', 'emoji', 'color', 'sort_order']),
        ]);
    }

    public function data()
    {
        $timezone = $this->userTimezone();
        $now = CarbonImmutable::now($timezone);
        $user = request()->user();
        $baseQuery = MoodEntry::with('mood')->where('user_id', $user->id);
        $last7Start = $now->copy()->startOfDay()->subDays(6);

        $hourlyEntries = (clone $baseQuery)
            ->where('occurred_at', '>=', $now->copy()->subDay()->setTimezone('UTC'))
            ->get();

        $dailyEntries = (clone $baseQuery)
            ->where('occurred_at', '>=', $now->copy()->startOfDay()->subDays(29)->setTimezone('UTC'))
            ->get();

        $weeklyEntries = (clone $baseQuery)
            ->where('occurred_at', '>=', $now->copy()->startOfWeek()->subWeeks(11)->setTimezone('UTC'))
            ->get();

        $monthlyEntries = (clone $baseQuery)
            ->where('occurred_at', '>=', $now->copy()->startOfMonth()->subMonths(11)->setTimezone('UTC'))
            ->get();

        $yearlyEntries = (clone $baseQuery)
            ->where('occurred_at', '>=', $now->copy()->startOfYear()->subYears(4)->setTimezone('UTC'))
            ->get();

        $last7Entries = (clone $baseQuery)
            ->where('occurred_at', '>=', $last7Start->setTimezone('UTC'))
            ->get();

        return response()->json([
            'hourly' => $this->buildHourly($hourlyEntries, $timezone, $now),
            'daily' => $this->buildDaily($dailyEntries, $timezone, $now),
            'weekly' => $this->buildWeekly($weeklyEntries, $timezone, $now),
            'monthly' => $this->buildMonthly($monthlyEntries, $timezone, $now),
            'yearly' => $this->buildYearly($yearlyEntries, $timezone, $now),
            'dominant' => [
                'today' => $this->dominantMood((clone $baseQuery)->where('occurred_at', '>=', $now->copy()->startOfDay()->setTimezone('UTC'))->get()),
                'thisWeek' => $this->dominantMood((clone $baseQuery)->where('occurred_at', '>=', $now->copy()->startOfWeek()->setTimezone('UTC'))->get()),
                'thisMonth' => $this->dominantMood((clone $baseQuery)->where('occurred_at', '>=', $now->copy()->startOfMonth()->setTimezone('UTC'))->get()),
            ],
            'summary' => [
                'dominantToday' => $this->dominantMood((clone $baseQuery)->where('occurred_at', '>=', $now->copy()->startOfDay()->setTimezone('UTC'))->get()),
                'dominantLast7Days' => $this->dominantMood($last7Entries),
                'last7TotalEntries' => $last7Entries->count(),
                'last7AvgIntensity' => $this->averageIntensity($last7Entries),
            ],
        ]);
    }

    private function buildHourly(Collection $entries, string $timezone, CarbonImmutable $now): array
    {
        $buckets = $this->accumulate(
            $entries,
            fn (MoodEntry $entry) => $entry->occurred_at->timezone($timezone)->startOfHour()->toIso8601String(),
        );

        $hours = collect(range(0, 23))
            ->map(fn (int $offset) => $now->copy()->startOfHour()->subHours($offset))
            ->reverse()
            ->values();

        return $hours
            ->map(fn (CarbonImmutable $hour) => [
                'timestamp' => $hour->toIso8601String(),
                'label' => $hour->format('g a'),
                'counts' => $this->formatCounts($buckets[$hour->toIso8601String()] ?? []),
            ])
            ->toArray();
    }

    private function buildDaily(Collection $entries, string $timezone, CarbonImmutable $now): array
    {
        $buckets = $this->accumulateWithIntensity(
            $entries,
            fn (MoodEntry $entry) => $entry->occurred_at->timezone($timezone)->startOfDay()->toDateString(),
        );

        $days = collect(range(0, 29))
            ->map(fn (int $offset) => $now->copy()->startOfDay()->subDays($offset))
            ->reverse()
            ->values();

        return $days
            ->map(function (CarbonImmutable $day) use ($buckets) {
                $key = $day->toDateString();
                $bucket = $buckets[$key] ?? ['counts' => [], 'intensitySum' => 0, 'intensityCount' => 0];
                $counts = $this->formatCounts($bucket['counts'] ?? []);

                return [
                    'date' => $key,
                    'counts' => $counts,
                    'total' => array_sum($counts),
                    'intensityAvg' => $this->formatIntensityAverage(
                        $bucket['intensitySum'] ?? 0,
                        $bucket['intensityCount'] ?? 0,
                    ),
                ];
            })
            ->toArray();
    }

    private function buildWeekly(Collection $entries, string $timezone, CarbonImmutable $now): array
    {
        $buckets = $this->accumulate(
            $entries,
            fn (MoodEntry $entry) => $entry->occurred_at->timezone($timezone)->startOfWeek()->toDateString(),
        );

        $weeks = collect(range(0, 11))
            ->map(fn (int $offset) => $now->copy()->startOfWeek()->subWeeks($offset))
            ->reverse()
            ->values();

        return $weeks
            ->map(fn (CarbonImmutable $start) => [
                'weekStart' => $start->toDateString(),
                'counts' => $this->formatCounts($buckets[$start->toDateString()] ?? []),
            ])
            ->toArray();
    }

    private function buildMonthly(Collection $entries, string $timezone, CarbonImmutable $now): array
    {
        $buckets = $this->accumulate(
            $entries,
            fn (MoodEntry $entry) => $entry->occurred_at->timezone($timezone)->startOfMonth()->format('Y-m'),
        );

        $months = collect(range(0, 11))
            ->map(fn (int $offset) => $now->copy()->startOfMonth()->subMonths($offset))
            ->reverse()
            ->values();

        return $months
            ->map(fn (CarbonImmutable $start) => [
                'month' => $start->format('Y-m'),
                'counts' => $this->formatCounts($buckets[$start->format('Y-m')] ?? []),
            ])
            ->toArray();
    }

    private function buildYearly(Collection $entries, string $timezone, CarbonImmutable $now): array
    {
        $buckets = $this->accumulate(
            $entries,
            fn (MoodEntry $entry) => $entry->occurred_at->timezone($timezone)->startOfYear()->format('Y'),
        );

        $years = collect(range(0, 4))
            ->map(fn (int $offset) => $now->copy()->startOfYear()->subYears($offset))
            ->reverse()
            ->values();

        return $years
            ->map(fn (CarbonImmutable $start) => [
                'year' => (int) $start->format('Y'),
                'counts' => $this->formatCounts($buckets[$start->format('Y')] ?? []),
            ])
            ->toArray();
    }

    private function accumulate(Collection $entries, callable $bucket): array
    {
        $results = [];

        foreach ($entries as $entry) {
            $moodKey = $entry->mood?->key;

            if (! $moodKey) {
                continue;
            }

            $key = $bucket($entry);

            $results[$key][$moodKey] = ($results[$key][$moodKey] ?? 0) + 1;
        }

        return $results;
    }

    private function accumulateWithIntensity(Collection $entries, callable $bucket): array
    {
        $results = [];

        foreach ($entries as $entry) {
            $moodKey = $entry->mood?->key;

            if (! $moodKey) {
                continue;
            }

            $key = $bucket($entry);

            $results[$key]['counts'][$moodKey] = ($results[$key]['counts'][$moodKey] ?? 0) + 1;

            if (! is_null($entry->intensity)) {
                $results[$key]['intensitySum'] = ($results[$key]['intensitySum'] ?? 0) + $entry->intensity;
                $results[$key]['intensityCount'] = ($results[$key]['intensityCount'] ?? 0) + 1;
            }
        }

        return $results;
    }

    private function formatCounts(array $counts): array
    {
        return collect($counts)
            ->mapWithKeys(fn ($value, $moodKey) => [$moodKey => (int) $value])
            ->toArray();
    }

    private function formatIntensityAverage(int $sum, int $count): ?float
    {
        if ($count === 0) {
            return null;
        }

        return round($sum / $count, 1);
    }

    private function averageIntensity(Collection $entries): ?float
    {
        $intensityEntries = $entries->filter(fn (MoodEntry $entry) => ! is_null($entry->intensity));

        if ($intensityEntries->isEmpty()) {
            return null;
        }

        $average = $intensityEntries->avg('intensity');

        return $average ? round($average, 1) : null;
    }

    private function dominantMood(Collection $entries): ?string
    {
        $counts = [];

        foreach ($entries as $entry) {
            $moodKey = $entry->mood?->key;

            if (! $moodKey) {
                continue;
            }

            $counts[$moodKey] = ($counts[$moodKey] ?? 0) + 1;
        }

        if (empty($counts)) {
            return null;
        }

        arsort($counts);

        return array_key_first($counts);
    }
}
