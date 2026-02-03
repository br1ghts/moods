import { AdminButton, AdminLink } from '@/Components/Admin/AdminButton';
import AdminCard from '@/Components/Admin/AdminCard';
import StatCard from '@/Components/Admin/StatCard';
import StatusPill from '@/Components/Admin/StatusPill';
import AdminLayout from '@/Layouts/AdminLayout';
import { getMoodColorClass } from '@/utils/moodColors';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function EmotionsIndex({ emotions }) {
    const [running, setRunning] = useState(null);
    const importForm = useForm({
        csv: null,
    });
    const totalEmotions = emotions.length;
    const activeCount = emotions.filter((emotion) => emotion.is_active).length;
    const disabledCount = totalEmotions - activeCount;
    const stats = [
        { label: 'Total moods', value: totalEmotions },
        { label: 'Active moods', value: activeCount },
        { label: 'Disabled moods', value: disabledCount },
    ];

    const handleToggle = (emotion) => {
        setRunning(emotion.id);

        router.patch(route('admin.emotions.toggle', emotion.id), {
            preserveScroll: true,
            onFinish: () => setRunning(null),
        });
    };

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <AdminCard>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Moods</p>
                            <h2 className="text-2xl font-semibold text-slate-900">Manage emotions</h2>
                            <p className="text-sm text-slate-500">Sort, edit, and toggle the moods people can track.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <AdminLink
                                href={route('admin.emotions.create')}
                                variant="primary"
                                size="md"
                            >
                                Add Emotion
                            </AdminLink>
                            <AdminLink
                                href={route('admin.emotions.export')}
                                variant="secondary"
                                size="md"
                            >
                                Export CSV
                            </AdminLink>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {stats.map((stat) => (
                            <StatCard key={stat.label} label={stat.label} value={stat.value} />
                        ))}
                    </div>
                </AdminCard>

                <AdminCard>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Import moods</h3>
                            <p className="text-sm text-slate-500">Upload a CSV to bulk-create or update moods.</p>
                        </div>
                    </div>
                    <form
                        className="mt-4 flex flex-wrap items-center gap-3"
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
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Import CSV
                            <span className="mt-1 block text-[10px] font-normal uppercase tracking-[0.25em] text-slate-400">
                                label, key, emoji, color, sort_order, is_active
                            </span>
                        </label>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={(event) => {
                                importForm.setData('csv', event.target.files?.[0] ?? null);
                            }}
                            className="w-full max-w-xs rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 file:rounded-full file:border-0 file:bg-slate-900 file:px-3 file:py-1 file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.25em] file:text-white sm:w-auto"
                        />
                        <AdminButton
                            type="submit"
                            variant="secondary"
                            size="md"
                            disabled={importForm.processing}
                        >
                            {importForm.processing ? 'Importing…' : 'Upload'}
                        </AdminButton>
                        {importForm.errors.csv && (
                            <p className="w-full text-xs text-rose-600">{importForm.errors.csv}</p>
                        )}
                    </form>
                </AdminCard>

                <AdminCard>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Mood list</h3>
                        <p className="text-sm text-slate-500">Order is determined by the sort value.</p>
                    </div>

                    <div className="mt-4 hidden overflow-hidden rounded-2xl border border-slate-100 sm:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-[0.3em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Mood</th>
                                    <th className="px-4 py-3">Key</th>
                                    <th className="px-4 py-3">Color</th>
                                    <th className="px-4 py-3">Sort</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emotions.map((emotion) => (
                                    <tr
                                        key={emotion.id}
                                        className={`border-t border-slate-100 ${emotion.is_active ? '' : 'bg-slate-50/80 text-slate-500'}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">{emotion.emoji}</span>
                                                <div>
                                                    <div className={`text-sm font-semibold ${emotion.is_active ? 'text-slate-900' : 'text-slate-600'}`}>
                                                        {emotion.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500">Label</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{emotion.key}</td>
                                        <td className="px-4 py-3">
                                            <span className="flex items-center gap-2 text-sm text-slate-600">
                                                <span
                                                    className={`inline-flex h-3 w-12 rounded-full ${getMoodColorClass(
                                                        emotion.color,
                                                        400,
                                                    )}`}
                                                />
                                                {emotion.color || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{emotion.sort_order ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <StatusPill
                                                label={emotion.is_active ? 'Active' : 'Disabled'}
                                                tone={emotion.is_active ? 'active' : 'inactive'}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex flex-wrap items-center justify-end gap-2">
                                                <AdminLink
                                                    href={route('admin.emotions.edit', emotion.id)}
                                                    size="sm"
                                                    variant="secondary"
                                                >
                                                    Edit
                                                </AdminLink>
                                                <AdminButton
                                                    type="button"
                                                    onClick={() => handleToggle(emotion)}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={running === emotion.id}
                                                >
                                                    {running === emotion.id
                                                        ? emotion.is_active
                                                            ? 'Disabling…'
                                                            : 'Enabling…'
                                                        : emotion.is_active
                                                            ? 'Disable'
                                                            : 'Enable'}
                                                </AdminButton>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-3 sm:hidden">
                        {emotions.map((emotion) => (
                            <div
                                key={emotion.id}
                                className={`rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm ${emotion.is_active ? '' : 'bg-slate-50/80 text-slate-500'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{emotion.emoji}</span>
                                        <div>
                                            <p className={`text-sm font-semibold ${emotion.is_active ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {emotion.label}
                                            </p>
                                            <p className="text-xs text-slate-500">{emotion.key}</p>
                                        </div>
                                    </div>
                                    <StatusPill
                                        label={emotion.is_active ? 'Active' : 'Disabled'}
                                        tone={emotion.is_active ? 'active' : 'inactive'}
                                    />
                                </div>

                                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`inline-flex h-3 w-10 rounded-full ${getMoodColorClass(
                                                emotion.color,
                                                400,
                                            )}`}
                                        />
                                        <span>{emotion.color || '—'}</span>
                                    </div>
                                    <span>Sort: {emotion.sort_order ?? '—'}</span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <AdminLink
                                        href={route('admin.emotions.edit', emotion.id)}
                                        size="sm"
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Edit
                                    </AdminLink>
                                    <AdminButton
                                        type="button"
                                        onClick={() => handleToggle(emotion)}
                                        size="sm"
                                        variant="outline"
                                        disabled={running === emotion.id}
                                        className="flex-1"
                                    >
                                        {running === emotion.id
                                            ? emotion.is_active
                                                ? 'Disabling…'
                                                : 'Enabling…'
                                            : emotion.is_active
                                                ? 'Disable'
                                                : 'Enable'}
                                    </AdminButton>
                                </div>
                            </div>
                        ))}
                    </div>
                </AdminCard>
            </div>
        </AdminLayout>
    );
}
