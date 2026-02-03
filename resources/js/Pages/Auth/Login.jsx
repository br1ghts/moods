import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Login({ googleRedirect, status }) {
    const { flash } = usePage().props;
    const error = flash?.error;
    const redirectUrl = googleRedirect ?? route('auth.google');

    return (
        <GuestLayout cardClassName="sm:max-w-lg">
            <Head title="Log in" />

            {status && (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {status}
                </div>
            )}

            {error && (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Welcome back
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign in with Google to continue your mood log.
                    </p>
                </div>

                <PrimaryButton
                    type="button"
                    onClick={() => {
                        window.location.href = redirectUrl;
                    }}
                    className="w-full justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white hover:bg-slate-800 focus:ring-slate-300 focus:ring-offset-0 active:bg-slate-950"
                >
                    Continue with Google
                </PrimaryButton>

                <p className="text-xs text-slate-500">
                    We only support Google sign-in.
                </p>

                <Link
                    href={route('landing')}
                    className="text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:text-slate-700"
                >
                    Back to home
                </Link>
            </div>
        </GuestLayout>
    );
}
