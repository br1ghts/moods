import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function AppLayout({ children }) {
    const { auth, csrf } = usePage().props;
    const user = auth.user;
    const isAdmin = user?.email === 'brendonbaughray@gmail.com';
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    const links = [
        { label: 'Log', href: route('log'), name: 'log' },
        { label: 'History', href: route('history'), name: 'history' },
        { label: 'Insights', href: route('insights'), name: 'insights' },
        { label: 'Settings', href: route('settings'), name: 'settings' },
        ...(isAdmin
            ? [{ label: 'Admin', href: route('admin.dashboard'), name: 'admin.dashboard' }]
            : []),
    ];

    useEffect(() => {
        if (!isOpen) {
            document.body.classList.remove('overflow-hidden');
            return;
        }

        document.body.classList.add('overflow-hidden');
        menuRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);

        return () => {
            document.body.classList.remove('overflow-hidden');
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex w-full items-center justify-between gap-3 align-middle md:w-auto md:justify-start">
                        <Link
                            href={route('log')}
                            className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                        >
                            <img src="/images/moods_logo_xs.png" alt="Logo" className="h-[1.4em] w-[1.4em] align-middle ml-1"/>
                            <span className="md:hidden">Moods</span>
                            <span className="hidden md:inline">Moods</span>
                            <span className="hidden text-xs text-slate-500 md:inline">
                                By Brendon Baugh
                            </span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsOpen((prev) => !prev)}
                            aria-expanded={isOpen}
                            aria-controls="mobile-menu"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 md:hidden"
                        >
                            <span className="sr-only">Toggle navigation</span>
                            <svg
                                aria-hidden="true"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                {isOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </div>

                    <nav className="hidden flex-wrap items-center gap-3 text-sm uppercase tracking-wide text-slate-500 md:flex">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={route().current(link.name) ? 'page' : undefined}
                                className={`rounded-full px-3 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${
                                    route().current(link.name)
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
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
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                            >
                                Log out
                            </button>
                        </form>
                    </nav>
                </div>
            </header>

            <div
                className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 md:hidden ${
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            <div
                id="mobile-menu"
                ref={menuRef}
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation"
                className={`fixed left-0 right-0 top-0 z-50 origin-top rounded-b-2xl border-b border-slate-200 bg-white shadow-lg transition duration-200 md:hidden ${
                    isOpen
                        ? 'translate-y-0 opacity-100'
                        : '-translate-y-4 opacity-0 pointer-events-none'
                }`}
            >
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pb-6 pt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-slate-900">Moods</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                        >
                            <span className="sr-only">Close navigation</span>
                            <svg
                                aria-hidden="true"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <nav className="mt-2 flex flex-col gap-2 text-sm uppercase tracking-wide text-slate-600">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                aria-current={route().current(link.name) ? 'page' : undefined}
                                className={`rounded-xl px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${
                                    route().current(link.name)
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <form
                            className="mt-2"
                            method="post"
                            action={route('logout')}
                        >
                            <input type="hidden" name="_token" value={csrf} />
                            <button
                                type="submit"
                                onClick={() => setIsOpen(false)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                            >
                                Log out
                            </button>
                        </form>
                    </nav>
                </div>
            </div>

            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}
