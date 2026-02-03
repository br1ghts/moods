import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({
    children,
    containerClassName = '',
    cardClassName = '',
}) {
    return (
        <div className="relative min-h-screen bg-slate-50 text-slate-900">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
            >
                <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-slate-200/60 blur-3xl" />
                <div className="absolute -bottom-28 left-0 h-72 w-72 rounded-full bg-slate-100/80 blur-3xl" />
            </div>
            <div
                className={`relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-4 py-12 ${containerClassName}`}
            >
                <Link
                    href="/"
                    className="flex items-center gap-3 text-lg font-semibold text-slate-900"
                >
                    <ApplicationLogo className="h-10 w-10 fill-current text-slate-900" />
                    <span>Moods</span>
                </Link>

                <div
                    className={`mt-6 w-full overflow-hidden rounded-3xl border border-slate-200 bg-white/80 px-6 py-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:max-w-md ${cardClassName}`}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
