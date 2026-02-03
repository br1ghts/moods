import AdminLayout from '@/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

const weekdayLabel = (value) => {
    const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return map[value] ?? '—';
};

const formatDateTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
};

export default function ReminderUser({ user, setting, sends }) {
    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reminder detail</p>
                            <h2 className="text-2xl font-semibold text-slate-900">
                                {user?.name || 'Unnamed'}
                            </h2>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                        </div>
                        <Link
                            href={route('admin.reminders')}
                            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                        >
                            Back to reminders
                        </Link>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Devices</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-900">{user?.push_devices_count ?? 0}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next due (UTC)</p>
                            <p className="mt-2 text-sm font-semibold text-slate-700">{formatDateTime(setting?.next_due_at)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Last sent (UTC)</p>
                            <p className="mt-2 text-sm font-semibold text-slate-700">{formatDateTime(setting?.last_sent_at)}</p>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/5">
                    <h3 className="text-lg font-semibold text-slate-900">Notification settings</h3>
                    {setting ? (
                        <div className="mt-4 grid gap-4 text-sm text-slate-600 sm:grid-cols-4">
                            <div>
                                <span className="uppercase tracking-[0.2em] text-slate-400">Enabled</span>
                                <p className="mt-1 font-semibold text-slate-700">{setting.enabled ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                                <span className="uppercase tracking-[0.2em] text-slate-400">Cadence</span>
                                <p className="mt-1 font-semibold text-slate-700">
                                    {setting.test_mode_enabled
                                        ? `test (${setting.test_interval_seconds || 60}s)`
                                        : setting.cadence}
                                </p>
                            </div>
                            <div>
                                <span className="uppercase tracking-[0.2em] text-slate-400">Time</span>
                                <p className="mt-1 font-semibold text-slate-700">{setting.daily_time || '—'}</p>
                            </div>
                            <div>
                                <span className="uppercase tracking-[0.2em] text-slate-400">Weekday</span>
                                <p className="mt-1 font-semibold text-slate-700">
                                    {setting.weekly_day !== null ? weekdayLabel(setting.weekly_day) : '—'}
                                </p>
                            </div>
                            <div>
                                <span className="uppercase tracking-[0.2em] text-slate-400">Timezone</span>
                                <p className="mt-1 font-semibold text-slate-700">{setting.timezone}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-slate-500">No notification settings found.</p>
                    )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Reminder sends (latest 200)</h3>
                        <p className="text-sm text-slate-500">Newest first.</p>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Bucket</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Due (UTC)</th>
                                    <th className="px-4 py-3">Attempted</th>
                                    <th className="px-4 py-3">Completed</th>
                                    <th className="px-4 py-3">Devices</th>
                                    <th className="px-4 py-3">Failure</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sends.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-4 text-sm text-slate-500" colSpan={6}>
                                            No reminder sends yet.
                                        </td>
                                    </tr>
                                )}
                                {sends.map((send) => (
                                    <tr key={send.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 text-xs text-slate-600">{send.bucket_key}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{send.status}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(send.due_at_utc)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(send.attempted_at_utc)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(send.completed_at_utc)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {send.devices_succeeded}/{send.devices_targeted}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{send.failure_reason || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
