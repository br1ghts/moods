import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import MoodWheel from '@/Components/MoodWheel';
import { getMoodColorClass } from '@/utils/moodColors';

const recentEntryFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
});

const formatRecentEntry = (timestamp) => {
    if (!timestamp) {
        return '';
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return timestamp;
    }

    return recentEntryFormatter.format(date);
};

export default function Log({ moods, recentEntries }) {
    const [selectedMood, setSelectedMood] = useState(moods[0]?.id ?? null);
    const [intensity, setIntensity] = useState(3);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const selectedMoodDetails = useMemo(
        () => moods.find((mood) => mood.id === selectedMood),
        [moods, selectedMood],
    );

    const intensityDescriptor = useMemo(() => {
        if (intensity <= 2) {
            return 'low';
        }
        if (intensity === 3) {
            return 'medium';
        }

        return 'high';
    }, [intensity]);

    const sliderProgress = ((intensity - 1) / (5 - 1)) * 100;

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!selectedMood) {
            return;
        }

        setSubmitting(true);

        router.post(
            route('mood-entries.store'),
            {
                mood_id: selectedMood,
                intensity,
                notes,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                    setNotes('');
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-900/5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">
                            Log Mood
                        </h1>
                        <p className="text-sm text-slate-500">
                            Pick an emoji, add intensity, and note how you’re
                            feeling.
                        </p>
                    </div>
                    {selectedMoodDetails && (
                        <div className="flex flex-col items-end text-sm text-slate-500">
                            {/* <span>{selectedMoodDetails.label}</span> */}
                            <span>
                                {selectedMoodDetails.emoji} ·{' '}
                                {selectedMoodDetails.key}
                            </span>
                        </div>
                    )}
                </div>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <div className="md:hidden">
                        <MoodWheel
                            moods={moods}
                            value={selectedMood}
                            onChange={setSelectedMood}
                        />
                    </div>

                    <div className="hidden gap-3 md:grid md:grid-cols-5">
                        {moods.map((mood) => (
                            <button
                                key={mood.id}
                                type="button"
                                onClick={() => setSelectedMood(mood.id)}
                                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition ${
                                    selectedMood === mood.id
                                        ? 'border-slate-900 bg-slate-900/5 shadow'
                                        : 'border-slate-100 bg-white hover:border-slate-300'
                                }`}
                            >
                                <span className="text-3xl">{mood.emoji}</span>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {mood.label}
                                </span>
                                <span
                                    className={`h-2 w-6 rounded-full ${getMoodColorClass(
                                        mood.color,
                                        400,
                                    )}`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">

                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-lg font-semibold text-slate-900">
                                    Intensity: {intensity} / 5{' '}
                                    <span className="text-sm font-normal uppercase tracking-wide text-slate-400">
                                        ({intensityDescriptor})
                                    </span>
                                </p>

                            </div>
                        </div>

                        <div className="relative range-slider-wrapper">
                            <input
                                type="range"
                                min={1}
                                max={5}
                                step={1}
                                value={intensity}
                                aria-label="Intensity slider"
                                onChange={(event) =>
                                    setIntensity(
                                        Number(event.currentTarget.value),
                                    )
                                }
                                className="range-slider"
                                style={{
                                    '--range-progress': `${sliderProgress}%`,
                                }}
                            />
                            <div className="range-slider-ticks pointer-events-none mt-3 flex flex-col gap-1">
                                <div className="range-slider-tick-row">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <span
                                            key={`tick-${index}`}
                                            className="range-slider-tick"
                                            style={{
                                                left: `${(index / 4) * 100}%`,
                                            }}
                                        >
                                            <span className="h-1 w-3 rounded-full bg-slate-200" />
                                        </span>
                                    ))}
                                </div>
                                <div className="range-slider-label-row text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                        <span
                                            key={`label-${index}`}
                                            className="range-slider-label"
                                            style={{
                                                left: `${(index / 4) * 100}%`,
                                            }}
                                        >
                                            {index + 1}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-600">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(event) =>
                                setNotes(event.target.value)
                            }
                            rows={3}
                            className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 focus:ring-offset-0"
                            placeholder="One line to remember what shifted the vibe."
                        />
                        <p className="text-xs text-slate-400">
                            Optional note to remember context or trigger.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!selectedMood || submitting}
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {submitting ? 'Saving…' : 'Save mood'}
                        </button>
                    </div>
                </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Recent entries
                    </h2>
                </div>
                <div className="mt-5 space-y-3">
                    {recentEntries.length === 0 && (
                        <div className="text-sm text-slate-500">
                            Start logging moods to see your vibe here.
                        </div>
                    )}
                    {recentEntries.map((entry) => (
                        <div
                            key={entry.id}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        {entry.mood.emoji}
                                    </span>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">
                                            {entry.mood.label}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {entry.occurred_at_human ??
                                                formatRecentEntry(
                                                    entry.occurred_at_local ??
                                                        entry.occurred_at,
                                                )}
                                        </div>
                                        {entry.notes && (
                                            <p className="mt-1 max-w-prose text-xs text-slate-500 whitespace-pre-line">
                                                {entry.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-slate-600">
                                    {entry.intensity
                                        ? `Intensity ${entry.intensity}`
                                        : 'No intensity'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

Log.layout = (page) => <AppLayout>{page}</AppLayout>;
