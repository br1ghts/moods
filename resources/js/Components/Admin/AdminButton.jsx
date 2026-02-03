import { Link } from '@inertiajs/react';

const base =
    'inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-[0.28em] transition duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const sizes = {
    sm: 'px-3 py-1 text-[10px]',
    md: 'px-4 py-2 text-xs',
    lg: 'px-5 py-2.5 text-xs',
};

const variants = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300',
    subtle: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
    outline: 'border border-slate-200 bg-transparent text-slate-600 hover:border-slate-300',
    danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300',
};

export function AdminButton({
    variant = 'secondary',
    size = 'md',
    className = '',
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

export function AdminLink({
    variant = 'secondary',
    size = 'md',
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        >
            {children}
        </Link>
    );
}
