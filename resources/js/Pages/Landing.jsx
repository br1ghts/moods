import { Link, usePage } from '@inertiajs/react';

export default function Landing({ googleRedirect }) {
    const user = usePage().props.auth.user;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 px-4 py-10 text-white">
            <div className="flex max-w-3xl flex-col items-center justify-center gap-6 rounded-3xl border border-white/20 bg-white/5 p-8 text-center shadow-2xl shadow-slate-900/40 backdrop-blur">
                <div className="text-5xl">🌈 Mood Tracker</div>
                <p className="max-w-2xl text-lg leading-relaxed text-slate-200">
                    Quick, gentle logging for your emotional rhythm. Track moods,
                    revisit history, and spot patterns without judgement.
                </p>
                {user ? (
                    <Link
                        href={route('log')}
                        className="rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-slate-200"
                    >
                        Continue logging
                    </Link>
                ) : (
                    <a
                        href={googleRedirect}
                        className="rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-white"
                    >
                        Continue with Google
                    </a>
                )}
            </div>
        </div>
    );
}
