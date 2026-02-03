import ApplicationLogo from '@/Components/ApplicationLogo';
import PrimaryButton from '@/Components/PrimaryButton';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Landing({ googleRedirect }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const error = flash?.error;
    const redirectUrl = googleRedirect ?? route('auth.google');

    return (
        <div className="relative min-h-screen bg-slate-50 text-slate-900">
            <Head title="Moods" />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
            >
                <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-slate-200/70 blur-3xl" />
                <div className="absolute -bottom-28 left-0 h-80 w-80 rounded-full bg-slate-100/80 blur-3xl" />
            </div>
            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur">
                    {error && (
                        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {error}
                        </div>
                    )}
                    <div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">

                            <div className="flex items-center gap-3">
                                <ApplicationLogo className="h-12 w-12 fill-current text-slate-900" />
                                <span className="text-2xl font-semibold">
                                    Moods
                                </span>
                            </div>  <p className="text-sm font-semibold text-slate-700">
                                Ready for a quick check-in?
                            </p>
                            <div className="mt-4 space-y-3">
                                {user ? (
                                    <Link
                                        href={route('log')}
                                        className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-0"
                                    >
                                        Continue logging
                                    </Link>
                                ) : (
                                    <PrimaryButton
                                        type="button"
                                        onClick={() => {
                                            window.location.href =
                                                redirectUrl;
                                        }}
                                        className="w-full justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white hover:bg-slate-800 focus:ring-slate-300 focus:ring-offset-0 active:bg-slate-950"
                                    >
                                        Continue with Google
                                    </PrimaryButton>
                                )}
                                <p className="text-xs text-slate-500">
                                    We only support Google sign-in.
                                </p>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
