export default function StatCard({ label, value, helper, className = '' }) {
    if (value === null || value === undefined) {
        return null;
    }

    return (
        <div
            className={`rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 ${className}`}
        >
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
        </div>
    );
}
