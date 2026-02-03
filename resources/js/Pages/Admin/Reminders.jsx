import { AdminButton, AdminLink } from '@/Components/Admin/AdminButton';
import AdminCard from '@/Components/Admin/AdminCard';
import StatCard from '@/Components/Admin/StatCard';
import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';

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

const formatQueueAge = (timestamp) => {
    if (!timestamp) return '—';
    const ms = Number(timestamp) * 1000;
    if (Number.isNaN(ms)) return '—';
    const ageMs = Date.now() - ms;
    if (ageMs < 0) return '0s';
    const seconds = Math.floor(ageMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
};

export default function Reminders({ lastTickAt, dueCount, dueSettings, recentSends, failureGroups, queueStats }) {
    const runTick = () => {
        router.post(route('admin.reminders.tick'), {}, { preserveScroll: true });
    };

    const simulateDue = () => {
        router.post(route('admin.reminders.simulate'), {}, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <AdminCard>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reminders</p>
                            <p className="text-sm text-slate-500">Track due users, recent sends, and failures.</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard label="Last tick" value={formatDateTime(lastTickAt)} />
                        <StatCard label="Due now" value={dueCount} />
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 ">Recent failures</p>
                            <div className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
                                {failureGroups.length === 0 && <span>None</span>}
                                {failureGroups.map((group) => (
                                    <span key={group.failure_reason}>
                                        {group.failure_reason}: {group.count}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Queue</p>
                            <div className="mt-2 space-y-1 text-sm text-slate-600">
                                <div>Pending: {queueStats?.pending ?? 0}</div>
                                <div>Reserved: {queueStats?.reserved ?? 0}</div>
                                <div>Failed: {queueStats?.failed ?? 0}</div>
                                <div>Oldest: {formatQueueAge(queueStats?.oldest_available_at)}</div>
                            </div>
                        </div>
                    </div>
                </AdminCard>

                <AdminCard>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Due users</h3>
                        <p className="text-sm text-slate-500">Showing up to 20 users due in the next 30 seconds.</p>
                    </div>

                    <div className="mt-4 space-y-4">
                        {dueSettings.length === 0 && (
                            <p className="text-sm text-slate-500">No users are currently due.</p>
                        )}
                        {dueSettings.map((setting) => (
                            <div key={setting.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {setting.user?.name || 'Unnamed'}
                                        </p>
                                        <p className="text-xs text-slate-500">{setting.user?.email}</p>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Devices: {setting.user?.push_devices_count ?? 0}
                                    </div>
                                    {setting.user?.id && (
                                        <AdminLink
                                            href={route('admin.reminders.user', setting.user.id)}
                                            size="sm"
                                            variant="secondary"
                                        >
                                            View user
                                        </AdminLink>
                                    )}
                                </div>

                                <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-4">
                                    <div>
                                        <span className="uppercase tracking-[0.2em] text-slate-400">Cadence</span>
                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            {setting.test_mode_enabled
                                                ? `test (${setting.test_interval_seconds || 60}s)`
                                                : setting.cadence}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="uppercase tracking-[0.2em] text-slate-400">Time</span>
                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            {setting.daily_time || '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="uppercase tracking-[0.2em] text-slate-400">Weekday</span>
                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            {setting.weekly_day !== null ? weekdayLabel(setting.weekly_day) : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="uppercase tracking-[0.2em] text-slate-400">Next due (UTC)</span>
                                        <p className="mt-1 text-sm font-semibold text-slate-700">
                                            {formatDateTime(setting.next_due_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Last 10 sends</p>
                                    {setting.recent_sends.length === 0 ? (
                                        <p className="mt-2 text-sm text-slate-500">No sends yet.</p>
                                    ) : (
                                        <div className="mt-2 grid gap-2">
                                            {setting.recent_sends.map((send) => (
                                                <div
                                                    key={send.id}
                                                    className="flex flex-wrap items-center justify-between rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-xs text-slate-600"
                                                >
                                                    <span className="font-semibold text-slate-700">{send.bucket_key}</span>
                                                    <span>Status: {send.status}</span>
                                                    <span>Reason: {send.failure_reason || '—'}</span>
                                                    <span>
                                                        Devices: {send.devices_succeeded}/{send.devices_targeted}
                                                    </span>
                                                    <span>Attempted: {formatDateTime(send.attempted_at_utc)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </AdminCard>

                <AdminCard>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Recent reminder sends</h3>
                        <p className="text-sm text-slate-500">Last 100 send attempts.</p>
                    </div>

                    <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 sm:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Bucket</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Due (UTC)</th>
                                    <th className="px-4 py-3">Attempted</th>
                                    <th className="px-4 py-3">Devices</th>
                                    <th className="px-4 py-3">Failure</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSends.map((send) => (
                                    <tr key={send.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            {send.user?.id ? (
                                                <Link
                                                    href={route('admin.reminders.user', send.user.id)}
                                                    className="block"
                                                >
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {send.user?.name || 'Unnamed'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{send.user?.email}</div>
                                                </Link>
                                            ) : (
                                                <>
                                                    <div className="text-sm font-semibold text-slate-900">
                                                        {send.user?.name || 'Unnamed'}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{send.user?.email}</div>
                                                </>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{send.bucket_key}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{send.status}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(send.due_at_utc)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(send.attempted_at_utc)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            {send.devices_succeeded}/{send.devices_targeted}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{send.failure_reason || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-3 sm:hidden">
                        {recentSends.map((send) => (
                            <div key={send.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {send.user?.name || 'Unnamed'}
                                        </p>
                                        <p className="text-xs text-slate-500">{send.user?.email}</p>
                                    </div>
                                    {send.user?.id && (
                                        <AdminLink
                                            href={route('admin.reminders.user', send.user.id)}
                                            size="sm"
                                            variant="secondary"
                                        >
                                            View
                                        </AdminLink>
                                    )}
                                </div>
                                <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                                    <div>Bucket: {send.bucket_key}</div>
                                    <div>Status: {send.status}</div>
                                    <div>Due: {formatDateTime(send.due_at_utc)}</div>
                                    <div>Attempted: {formatDateTime(send.attempted_at_utc)}</div>
                                    <div>Devices: {send.devices_succeeded}/{send.devices_targeted}</div>
                                    <div>Failure: {send.failure_reason || '—'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </AdminCard>
            </div>
        </AdminLayout>
    );
}
