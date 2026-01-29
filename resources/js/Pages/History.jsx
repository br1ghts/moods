import { Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

const dayFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});
const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
});

const formatDayLabel = (dateValue) => {
    if (!dateValue) {
        return '';
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return dayFormatter.format(date);
};

const formatTimeLabel = (timestamp) => {
    if (!timestamp) {
        return '';
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return timestamp;
    }

    return timeFormatter.format(date);
};

export default function History({ history, pagination }) {
    const handleDelete = (id) => {
        if (!confirm('Delete this entry?')) {
            return;
        }

        router.delete(route('mood-entries.destroy', id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        History
                    </h1>
                    <p className="text-sm text-slate-500">
                        Tap to remove entries you no longer need.
                    </p>
                </header>

                {history.length === 0 && (
                    <div className="mt-6 text-sm text-slate-500">
                        No entries yet. Head to Log to record your first
                        mood.
                    </div>
                )}

                <div className="mt-6 space-y-5">
                    {history.map((day) => (
                        <div
                            key={day.date}
                            className="rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-4"
                        >
                            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                                {formatDayLabel(day.date)}
                            </div>
                            <div className="mt-3 space-y-3">
                                {day.entries.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex flex-col gap-3 rounded-2xl border border-white bg-white px-4 py-3 shadow"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">
                                                    {entry.mood.emoji}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {entry.mood.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {formatTimeLabel(
                                                            entry.occurred_at,
                                                        )}
                                                    </div>
                                                    {entry.notes && (
                                                        <p className="mt-1 max-w-prose text-xs text-slate-500">
                                                            {entry.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <div>
                                                    {entry.intensity
                                                        ? `Intensity ${entry.intensity}`
                                                        : 'No intensity'}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(entry.id)
                                                    }
                                                    className="text-xs font-semibold uppercase tracking-widest text-rose-600 hover:text-rose-500"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {pagination && (
                <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/90 px-6 py-3 text-sm text-slate-600 shadow">
                    {pagination.prev_page_url ? (
                        <Link
                            href={pagination.prev_page_url}
                            className="rounded-full px-4 py-2 text-slate-900 hover:bg-slate-100"
                        >
                            Previous
                        </Link>
                    ) : (
                        <span className="rounded-full px-4 py-2 opacity-50">
                            Previous
                        </span>
                    )}
                    <span>
                        Page {pagination.current_page} of {pagination.last_page}
                    </span>
                    {pagination.next_page_url ? (
                        <Link
                            href={pagination.next_page_url}
                            className="rounded-full px-4 py-2 text-slate-900 hover:bg-slate-100"
                        >
                            Next
                        </Link>
                    ) : (
                        <span className="rounded-full px-4 py-2 opacity-50">
                            Next
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

History.layout = (page) => <AppLayout>{page}</AppLayout>;
