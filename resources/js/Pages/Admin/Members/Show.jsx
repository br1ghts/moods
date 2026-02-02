import AdminLayout from '@/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
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
            <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md shadow-slate-900/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Member</p>
                        <h2 className="text-2xl font-semibold text-slate-900">{member.name || 'Unnamed'}</h2>
                        <p className="text-sm text-slate-500">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleMember}
                            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                            disabled={running}
                        >
                            {member.is_disabled ? 'Enable' : 'Disable'}
                        </button>
                        <button
                            type="button"
                            onClick={revokePush}
                            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                            disabled={running}
                        >
                            Revoke Push
                        </button>
                        <Link
                            href={route('admin.members.index')}
                            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800"
                        >
                            Back
                        </Link>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Created</p>
                        <p className="text-lg font-semibold text-slate-900">
                            {member.created_at ? new Date(member.created_at).toLocaleString() : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
                        <p className="text-lg font-semibold text-slate-900">
                            {member.is_disabled ? 'Disabled' : 'Active'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Mood entries</p>
                        <p className="text-lg font-semibold text-slate-900">{member.mood_entries_count}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Push devices</p>
                        <p className="text-lg font-semibold text-slate-900">{member.push_devices_count}</p>
                    </div>
                </div>
            </section>
        </AdminLayout>
    );
}
