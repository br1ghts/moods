export default function AdminCard({ children, className = '' }) {
    return (
        <section
            className={`rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-900/5 ${className}`}
        >
            {children}
        </section>
    );
}
