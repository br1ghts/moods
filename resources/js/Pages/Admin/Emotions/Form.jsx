import AdminLayout from '@/Layouts/AdminLayout';
import {
    allowedColors,
    formatMoodColorLabel,
    getMoodColorClass,
    normalizeMoodColorKey,
} from '@/utils/moodColors';
import { Link, useForm } from '@inertiajs/react';

export default function EmotionForm({ emotion }) {
    const isEditing = Boolean(emotion);
    const storedColor = emotion?.color ?? '';
    const normalizedStoredColor = storedColor
        ? normalizeMoodColorKey(storedColor)
        : 'slate';
    const hasInvalidStoredColor =
        storedColor !== '' && normalizedStoredColor !== storedColor;

    const form = useForm({
        label: emotion?.label ?? '',
        key: emotion?.key ?? '',
        emoji: emotion?.emoji ?? '',
        color: normalizedStoredColor,
        sort_order: emotion?.sort_order ?? '',
        is_active: emotion?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();

        const action = isEditing
            ? route('admin.emotions.update', emotion.id)
            : route('admin.emotions.store');

        const method = isEditing ? 'put' : 'post';

        const payload = { ...form.data };

        if (payload.sort_order === '') {
            delete payload.sort_order;
        }

        form[method](action, {
            data: payload,
            onSuccess: () => {
                if (!isEditing) {
                    form.reset();
                }
            },
        });
    };

    return (
        <AdminLayout>
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-md shadow-slate-900/5">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            {isEditing ? 'Edit Emotion' : 'Add Emotion'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {isEditing
                                ? 'Update the emotion metadata so it appears in the right order.'
                                : 'New emotions will be appended at the end unless you set a sort order.'}
                        </p>
                    </div>
                    <Link
                        href={route('admin.emotions.index')}
                        className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500"
                    >
                        Back to list
                    </Link>
                </div>

                <form className="space-y-4" onSubmit={submit}>
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Label</label>
                        <input
                            type="text"
                            value={form.data.label}
                            onChange={(event) => form.setData('label', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                        />
                        {form.errors.label && (
                            <p className="mt-1 text-xs text-rose-600">{form.errors.label}</p>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Key</label>
                        <input
                            type="text"
                            value={form.data.key}
                            onChange={(event) => form.setData('key', event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                            placeholder="e.g. calm"
                        />
                        {form.errors.key && (
                            <p className="mt-1 text-xs text-rose-600">{form.errors.key}</p>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Emoji
                            <input
                                type="text"
                                value={form.data.emoji}
                                onChange={(event) => form.setData('emoji', event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                                placeholder="🙂"
                            />
                            {form.errors.emoji && (
                                <p className="mt-1 text-xs text-rose-600">{form.errors.emoji}</p>
                            )}
                        </label>

                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Color key
                            <div className="mt-2 flex items-center gap-3">
                                <span
                                    aria-hidden
                                    className={`h-6 w-6 rounded-full ${getMoodColorClass(
                                        form.data.color || 'slate',
                                        500,
                                    )} ring-2 ring-slate-200`}
                                />
                                <select
                                    value={form.data.color}
                                    onChange={(event) =>
                                        form.setData('color', event.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                                >
                                    {allowedColors.map((color) => (
                                        <option key={color} value={color}>
                                            {formatMoodColorLabel(color)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {form.errors.color && (
                                <p className="mt-1 text-xs text-rose-600">{form.errors.color}</p>
                            )}
                            {hasInvalidStoredColor && (
                                <p className="mt-1 text-xs text-amber-600">Invalid color stored.</p>
                            )}
                        </label>

                        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            Sort order
                            <input
                                type="number"
                                min={0}
                                value={form.data.sort_order ?? ''}
                                onChange={(event) => form.setData('sort_order', event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                                placeholder="Auto"
                            />
                            {form.errors.sort_order && (
                                <p className="mt-1 text-xs text-rose-600">{form.errors.sort_order}</p>
                            )}
                        </label>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={form.data.is_active}
                            onChange={(event) => form.setData('is_active', event.target.checked)}
                            className="rounded border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-900"
                        />
                        <label htmlFor="is_active" className="text-sm font-semibold text-slate-700">
                            Active
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isEditing ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
