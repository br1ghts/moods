import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import MoodWheel from '@/Components/MoodWheel';

const colorClasses = {
    yellow: 'bg-yellow-400',
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
    slate: 'bg-slate-400',
    orange: 'bg-orange-400',
    indigo: 'bg-indigo-400',
    red: 'bg-red-400',
    teal: 'bg-teal-400',
    purple: 'bg-purple-400',
    pink: 'bg-pink-400',
};

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
    const [occurredAt, setOccurredAt] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const selectedMoodDetails = useMemo(
        () => moods.find((mood) => mood.id === selectedMood),
        [moods, selectedMood],
    );

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!selectedMood) {
            return;
        }

        setSubmitting(true);

        const occurredAtIso = occurredAt
            ? new Date(occurredAt).toISOString()
            : null;

        router.post(
            route('mood-entries.store'),
            {
                mood_id: selectedMood,
                intensity,
                notes,
                ...(occurredAtIso ? { occurred_at: occurredAtIso } : {}),
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
                            <span>{selectedMoodDetails.label}</span>
                            <span>
                                {selectedMoodDetails.emoji} ·{' '}
                                Mood {selectedMoodDetails.key}
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
                                    className={`h-2 w-6 rounded-full ${
                                        colorClasses[mood.color] ??
                                        'bg-slate-200'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Intensity (1–5)
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={5}
                            value={intensity}
                            onChange={(event) =>
                                setIntensity(Number(event.currentTarget.value))
                            }
                            className="w-full"
                        />
                        <div className="text-sm text-slate-500">
                            Feeling level: {intensity}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>When did this happen?</span>
                            <input
                                type="datetime-local"
                                value={occurredAt}
                                onChange={(event) =>
                                    setOccurredAt(event.target.value)
                                }
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                            />
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Notes (optional)</span>
                            <textarea
                                value={notes}
                                onChange={(event) =>
                                    setNotes(event.target.value)
                                }
                                rows={3}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                                placeholder="One line to remember what shifted the vibe."
                            />
                        </label>
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
