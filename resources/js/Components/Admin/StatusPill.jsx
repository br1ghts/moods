const tones = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-rose-100 text-rose-700',
    neutral: 'bg-slate-200 text-slate-600',
    warning: 'bg-amber-100 text-amber-700',
};

export default function StatusPill({ label, tone = 'neutral', className = '' }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${
                tones[tone] || tones.neutral
            } ${className}`}
        >
            {label}
        </span>
    );
}
