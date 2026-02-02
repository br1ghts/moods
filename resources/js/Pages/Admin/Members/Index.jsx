import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function MembersIndex({ members, pagination, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [running, setRunning] = useState(null);

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(
            route('admin.members.index'),
            { search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const toggleMember = (member) => {
        setRunning(member.id);
        router.patch(route('admin.members.toggle', member.id), {}, {
            preserveScroll: true,
            onFinish: () => setRunning(null),
        });
    };

    const revokePush = (member) => {
        if (!confirm(`Revoke all push devices for ${member.email}?`)) {
            return;
        }

        setRunning(member.id);
        router.delete(route('admin.members.push.revoke', member.id), {
            preserveScroll: true,
            onFinish: () => setRunning(null),
        });
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-4">
                <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md shadow-slate-900/5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Members</h2>
                            <p className="text-sm text-slate-500">Review member activity, access, and push devices.</p>
                        </div>
                        <form onSubmit={submitSearch} className="flex items-center gap-2">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name or email"
                                className="w-56 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Member</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3">Mood Entries</th>
                                    <th className="px-4 py-3">Push Devices</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr key={member.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-slate-900">{member.name || 'Unnamed'}</div>
                                            <div className="text-xs text-slate-500">{member.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{member.mood_entries_count}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{member.push_devices_count}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                                                    member.is_disabled
                                                        ? 'bg-rose-100 text-rose-700'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                {member.is_disabled ? 'Disabled' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={route('admin.members.show', member.id)}
                                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                                                >
                                                    View
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMember(member)}
                                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                                                    disabled={running === member.id}
                                                >
                                                    {member.is_disabled ? 'Enable' : 'Disable'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => revokePush(member)}
                                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                                                    disabled={running === member.id}
                                                >
                                                    Revoke Push
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                            <span className="rounded-full px-4 py-2 opacity-50">Previous</span>
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
                            <span className="rounded-full px-4 py-2 opacity-50">Next</span>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
