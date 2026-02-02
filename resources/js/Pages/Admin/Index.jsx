import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

export default function AdminIndex({ emotionCount, memberCount, activeMemberCount, moodEntryCount, pushDeviceCount }) {
    return (
        <AdminLayout>
            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md shadow-slate-900/5">
                <div className="flex flex-col gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
                        <p className="text-sm text-slate-500">
                            This admin area is focused on shaping the emotions that people can log. Keep the list curated and only toggle entries rather than deleting them.
                        </p>
                    </div>

                    <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total emotions</p>
                            <p className="text-3xl font-semibold text-slate-900">{emotionCount}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Total members</p>
                            <p className="text-3xl font-semibold text-slate-900">{memberCount}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active members</p>
                            <p className="text-3xl font-semibold text-slate-900">{activeMemberCount}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Mood entries</p>
                            <p className="text-3xl font-semibold text-slate-900">{moodEntryCount}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Push devices</p>
                            <p className="text-3xl font-semibold text-slate-900">{pushDeviceCount}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">What you can do</p>
                            <ul className="mt-2 space-y-1">
                                <li>• Add new emotions for matching moods</li>
                                <li>• Edit labels, keys, or sort order</li>
                                <li>• Toggle active state without deleting entries</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Link
                            href={route('admin.emotions.index')}
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800"
                        >
                            Manage Emotions
                        </Link>
                    </div>
                </div>
            </section>
        </AdminLayout>
    );
}
