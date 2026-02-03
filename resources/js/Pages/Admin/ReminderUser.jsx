import { AdminLink } from '@/Components/Admin/AdminButton';
import AdminCard from '@/Components/Admin/AdminCard';
import StatCard from '@/Components/Admin/StatCard';
import AdminLayout from '@/Layouts/AdminLayout';

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
                <AdminCard>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reminder detail</p>
                            <h2 className="text-2xl font-semibold text-slate-900">
                                {user?.name || 'Unnamed'}
                            </h2>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                        </div>
                        <AdminLink
                            href={route('admin.reminders')}
                            variant="secondary"
                            size="md"
                        >
                            Back to reminders
                        </AdminLink>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard label="Devices" value={user?.push_devices_count ?? 0} />
                        <StatCard label="Next due (UTC)" value={formatDateTime(setting?.next_due_at)} />
                        <StatCard label="Last sent (UTC)" value={formatDateTime(setting?.last_sent_at)} />
                    </div>
                </AdminCard>

                <AdminCard>
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
                </AdminCard>

                <AdminCard>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Reminder sends (latest 200)</h3>
                        <p className="text-sm text-slate-500">Newest first.</p>
                    </div>

                    <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 sm:block">
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
                                        <td className="px-4 py-4 text-sm text-slate-500" colSpan={7}>
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

                    <div className="mt-4 space-y-3 sm:hidden">
                        {sends.length === 0 && (
                            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 text-sm text-slate-500 shadow-sm">
                                No reminder sends yet.
                            </div>
                        )}
                        {sends.map((send) => (
                            <div key={send.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{send.bucket_key}</p>
                                        <p className="text-xs text-slate-500">Status: {send.status}</p>
                                    </div>
                                </div>
                                <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                                    <div>Due: {formatDateTime(send.due_at_utc)}</div>
                                    <div>Attempted: {formatDateTime(send.attempted_at_utc)}</div>
                                    <div>Completed: {formatDateTime(send.completed_at_utc)}</div>
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
