import { Link, usePage } from '@inertiajs/react';

export default function AdminLayout({ children }) {
    const { flash } = usePage().props;

    const tabs = [
        { label: 'Overview', href: route('admin.dashboard'), name: 'admin.dashboard' },
        { label: 'Emotions', href: route('admin.emotions.index'), name: 'admin.emotions.index' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin</p>
                        <h1 className="text-2xl font-semibold text-slate-900">Mood Library</h1>
                        <p className="text-sm text-slate-500">Manage the emotions that power the tracker.</p>
                    </div>
                    <nav className="flex flex-wrap gap-2 text-sm font-semibold uppercase tracking-wide">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`rounded-full px-4 py-2 transition duration-150 ${
                                    route().current(tab.name)
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {tab.label}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            {flash?.success && (
                <div className="mx-auto mt-4 max-w-6xl px-4">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                </div>
            )}

            <main className="mx-auto max-w-6xl px-4 py-6">
                {children}
            </main>
        </div>
    );
}
