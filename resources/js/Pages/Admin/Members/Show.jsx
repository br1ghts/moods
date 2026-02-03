import { AdminButton, AdminLink } from '@/Components/Admin/AdminButton';
import AdminCard from '@/Components/Admin/AdminCard';
import StatCard from '@/Components/Admin/StatCard';
import StatusPill from '@/Components/Admin/StatusPill';
import AdminLayout from '@/Layouts/AdminLayout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export default function MemberShow({ member }) {
    const [running, setRunning] = useState(false);

    const toggleMember = () => {
        setRunning(true);
        router.patch(route('admin.members.toggle', member.id), {}, {
            preserveScroll: true,
            onFinish: () => setRunning(false),
        });
    };

    const revokePush = () => {
        if (!confirm(`Revoke all push devices for ${member.email}?`)) {
            return;
        }

        setRunning(true);
        router.delete(route('admin.members.push.revoke', member.id), {
            preserveScroll: true,
            onFinish: () => setRunning(false),
        });
    };

    return (
        <AdminLayout>
            <AdminCard>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Member</p>
                        <h2 className="text-2xl font-semibold text-slate-900">{member.name || 'Unnamed'}</h2>
                        <p className="text-sm text-slate-500">{member.email}</p>
                        <div className="mt-3">
                            <StatusPill
                                label={member.is_disabled ? 'Disabled' : 'Active'}
                                tone={member.is_disabled ? 'inactive' : 'active'}
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <AdminButton
                            type="button"
                            onClick={toggleMember}
                            variant="outline"
                            size="md"
                            disabled={running}
                        >
                            {member.is_disabled ? 'Enable' : 'Disable'}
                        </AdminButton>
                        <AdminButton
                            type="button"
                            onClick={revokePush}
                            variant="danger"
                            size="md"
                            disabled={running}
                        >
                            Revoke Push
                        </AdminButton>
                        <AdminLink
                            href={route('admin.members.index')}
                            variant="primary"
                            size="md"
                        >
                            Back
                        </AdminLink>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Created"
                        value={member.created_at ? new Date(member.created_at).toLocaleString() : '—'}
                    />
                    <StatCard
                        label="Mood entries"
                        value={member.mood_entries_count}
                    />
                    <StatCard
                        label="Push devices"
                        value={member.push_devices_count}
                    />
                    <StatCard
                        label="Status"
                        value={member.is_disabled ? 'Disabled' : 'Active'}
                    />
                </div>
            </AdminCard>
        </AdminLayout>
    );
}
