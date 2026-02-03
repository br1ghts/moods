import AdminLayout from '@/Layouts/AdminLayout';
import { getMoodColorClass } from '@/utils/moodColors';
import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function EmotionsIndex({ emotions }) {
    const [running, setRunning] = useState(null);
    const importForm = useForm({
        csv: null,
    });

    const handleToggle = (emotion) => {
        setRunning(emotion.id);

        router.patch(route('admin.emotions.toggle', emotion.id), {
            preserveScroll: true,
            onFinish: () => setRunning(null),
        });
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-md shadow-slate-900/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Manage Emotions</h2>
                        <p className="text-sm text-slate-500">Sort, edit, and toggle the emotions people can track.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('admin.emotions.create')}
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800"
                        >
                            Add Emotion
                        </Link>
                        <a
                            href={route('admin.emotions.export')}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                        >
                            Export CSV
                        </a>
                    </div>
                </div>

                <form
                    className="my-4 flex flex-wrap items-center gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();

                        if (!importForm.data.csv) {
                            return;
                        }

                        importForm.post(route('admin.emotions.import'), {
                            forceFormData: true,
                            preserveScroll: true,
                            onFinish: () => {
                                importForm.setData('csv', null);
                                importForm.reset('csv');
                            },
                        });
                    }}
                >
                    <label className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                        <span>Import CSV</span>
                        <span className="text-[10px] text-slate-400">(label,key,emoji,color,sort_order,is_active)</span>
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={(event) => {
                            importForm.setData('csv', event.target.files?.[0] ?? null);
                        }}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={importForm.processing}
                    >
                        {importForm.processing ? 'Importing…' : 'Upload'}
                    </button>
                    {importForm.errors.csv && (
                        <p className="w-full text-xs text-rose-600">{importForm.errors.csv}</p>
                    )}
                </form>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Emotion</th>
                                <th className="px-4 py-3">Key</th>
                                <th className="px-4 py-3">Color</th>
                                <th className="px-4 py-3">Sort</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {emotions.map((emotion) => (
                                <tr key={emotion.id} className="border-t border-slate-100">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{emotion.emoji}</span>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">{emotion.label}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{emotion.key}</td>
                                    <td className="px-4 py-3">
                                        <span className="flex items-center gap-2 text-sm">
                                            <span
                                                className={`inline-flex h-3 w-12 rounded-full ${getMoodColorClass(
                                                    emotion.color,
                                                    400,
                                                )}`}
                                            />
                                            {emotion.color || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{emotion.sort_order}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                                                emotion.is_active
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-rose-100 text-rose-700'
                                            }`}
                                        >
                                            {emotion.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                href={route('admin.emotions.edit', emotion.id)}
                                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleToggle(emotion)}
                                                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-300"
                                                disabled={running === emotion.id}
                                            >
                                                {running === emotion.id
                                                    ? emotion.is_active
                                                        ? 'Disabling…'
                                                        : 'Enabling…'
                                                    : emotion.is_active
                                                        ? 'Disable'
                                                        : 'Enable'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
