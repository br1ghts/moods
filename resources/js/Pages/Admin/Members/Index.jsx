import { AdminButton, AdminLink } from '@/Components/Admin/AdminButton';
import AdminCard from '@/Components/Admin/AdminCard';
import StatCard from '@/Components/Admin/StatCard';
import StatusPill from '@/Components/Admin/StatusPill';
import AdminLayout from '@/Layouts/AdminLayout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function MembersIndex({ members, pagination, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [running, setRunning] = useState(null);
    const stats = [
        { label: 'Total members', value: pagination?.total },
        { label: 'Showing', value: members.length, helper: 'This page' },
    ].filter((stat) => stat.value !== null && stat.value !== undefined);

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
            <div className="flex flex-col gap-6">
                <AdminCard>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Members</p>
                            <p className="text-sm text-slate-500">Review member activity, access, and push devices.</p>
                        </div>
                        <form onSubmit={submitSearch} className="flex flex-wrap items-center gap-2">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name or email"
                                className="w-60 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-400 focus:outline-none"
                            />
                            <AdminButton type="submit" variant="primary" size="md">
                                Search
                            </AdminButton>
                        </form>
                    </div>


                </AdminCard>

                <AdminCard>
                    <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 sm:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Member</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3">Mood Entries</th>
                                    <th className="px-4 py-3">Push Devices</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member) => (
                                    <tr
                                        key={member.id}
                                        className={`border-t border-slate-100 ${member.is_disabled ? 'bg-slate-50/80 text-slate-500' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className={`text-sm font-semibold ${member.is_disabled ? 'text-slate-600' : 'text-slate-900'}`}>
                                                {member.name || 'Unnamed'}
                                            </div>
                                            <div className="text-xs text-slate-500">{member.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{member.mood_entries_count}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{member.push_devices_count}</td>
                                        <td className="px-4 py-3">
                                            <StatusPill
                                                label={member.is_disabled ? 'Disabled' : 'Active'}
                                                tone={member.is_disabled ? 'inactive' : 'active'}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                <AdminLink
                                                    href={route('admin.members.show', member.id)}
                                                    size="sm"
                                                    variant="secondary"
                                                >
                                                    View
                                                </AdminLink>
                                                <AdminButton
                                                    type="button"
                                                    onClick={() => toggleMember(member)}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={running === member.id}
                                                >
                                                    {member.is_disabled ? 'Enable' : 'Disable'}
                                                </AdminButton>
                                                <AdminButton
                                                    type="button"
                                                    onClick={() => revokePush(member)}
                                                    size="sm"
                                                    variant="danger"
                                                    disabled={running === member.id}
                                                >
                                                    Revoke Push
                                                </AdminButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-3 sm:hidden">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className={`rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm ${member.is_disabled ? 'bg-slate-50/80 text-slate-500' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className={`text-sm font-semibold ${member.is_disabled ? 'text-slate-600' : 'text-slate-900'}`}>
                                            {member.name || 'Unnamed'}
                                        </p>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                    <StatusPill
                                        label={member.is_disabled ? 'Disabled' : 'Active'}
                                        tone={member.is_disabled ? 'inactive' : 'active'}
                                    />
                                </div>
                                <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                                    <div>Created: {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}</div>
                                    <div>Mood entries: {member.mood_entries_count}</div>
                                    <div>Push devices: {member.push_devices_count}</div>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <AdminLink
                                        href={route('admin.members.show', member.id)}
                                        size="sm"
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        View
                                    </AdminLink>
                                    <AdminButton
                                        type="button"
                                        onClick={() => toggleMember(member)}
                                        size="sm"
                                        variant="outline"
                                        disabled={running === member.id}
                                        className="flex-1"
                                    >
                                        {member.is_disabled ? 'Enable' : 'Disable'}
                                    </AdminButton>
                                    <AdminButton
                                        type="button"
                                        onClick={() => revokePush(member)}
                                        size="sm"
                                        variant="danger"
                                        disabled={running === member.id}
                                        className="flex-1"
                                    >
                                        Revoke Push
                                    </AdminButton>
                                </div>
                            </div>
                        ))}
                    </div>
                </AdminCard>

                {pagination && (
                    <AdminCard className="py-4">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                            {pagination.prev_page_url ? (
                                <AdminLink
                                    href={pagination.prev_page_url}
                                    size="sm"
                                    variant="secondary"
                                >
                                    Previous
                                </AdminLink>
                            ) : (
                                <span className="rounded-full px-4 py-2 opacity-50">Previous</span>
                            )}
                            <span>
                                Page {pagination.current_page} of {pagination.last_page}
                            </span>
                            {pagination.next_page_url ? (
                                <AdminLink
                                    href={pagination.next_page_url}
                                    size="sm"
                                    variant="secondary"
                                >
                                    Next
                                </AdminLink>
                            ) : (
                                <span className="rounded-full px-4 py-2 opacity-50">Next</span>
                            )}
                        </div>
                    </AdminCard>
                )}
            </div>
        </AdminLayout>
    );
}
