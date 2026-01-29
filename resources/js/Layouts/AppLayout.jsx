import { Link, usePage } from '@inertiajs/react';

export default function AppLayout({ children }) {
    const { auth, csrf } = usePage().props;
    const user = auth.user;

    const links = [
        { label: 'Log', href: route('log') },
        { label: 'History', href: route('history') },
        { label: 'Insights', href: route('insights') },
        { label: 'Settings', href: route('settings') },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 align-middle">
                        <Link
                            href={route('log')}
                            className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                        >
                            <span className="text-2xl">🌤</span>
                            <span>Mood Tracker</span>
                            <span className="text-xs text-slate-500">
                                By Brendon Baugh
                            </span>
                        </Link>


                    </div>

                    <nav className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-wide text-slate-500">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-full px-3 py-1 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <form
                            className="inline"
                            method="post"
                            action={route('logout')}
                        >
                            <input type="hidden" name="_token" value={csrf} />
                            <button
                                type="submit"
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-100"
                            >
                                Log out
                            </button>
                        </form>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}
