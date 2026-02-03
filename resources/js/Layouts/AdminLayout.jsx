import { AdminLink } from '@/Components/Admin/AdminButton';
import { usePage } from '@inertiajs/react';

export default function AdminLayout({ children }) {
    const { flash } = usePage().props;

    const tabs = [
        { label: 'Log', href: route('log'), name: 'log' },
        { label: 'Overview', href: route('admin.dashboard'), name: 'admin.dashboard' },
        { label: 'Members', href: route('admin.members.index'), name: 'admin.members.index' },
        { label: 'Reminders', href: route('admin.reminders'), name: 'admin.reminders' },
        { label: 'Emotions', href: route('admin.emotions.index'), name: 'admin.emotions.index' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200/80 bg-white/90 shadow-sm backdrop-blur">
                <div className="mx-auto flex lg:justify-center max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <nav className="flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                            <AdminLink
                                key={tab.name}
                                href={tab.href}
                                size="sm"
                                variant={route().current(tab.name) ? 'primary' : 'subtle'}
                                className="tracking-[0.22em]"
                            >
                                {tab.label}
                            </AdminLink>
                        ))}
                    </nav>
                </div>
            </header>

            {(flash?.success || flash?.error) && (
                <div className="mx-auto mt-4 max-w-6xl px-4">
                    {flash?.success && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 shadow-sm">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 shadow-sm">
                            {flash.error}
                        </div>
                    )}
                </div>
            )}

            <main className="mx-auto max-w-6xl px-4 py-6">
                {children}
            </main>
        </div>
    );
}
