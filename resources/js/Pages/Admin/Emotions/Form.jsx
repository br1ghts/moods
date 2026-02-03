import { AdminButton, AdminLink } from '@/Components/Admin/AdminButton';
import AdminCard from '@/Components/Admin/AdminCard';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    allowedColors,
    formatMoodColorLabel,
    getMoodColorClass,
    normalizeMoodColorKey,
} from '@/utils/moodColors';
import { useForm } from '@inertiajs/react';

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
            <AdminCard>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Moods</p>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            {isEditing ? 'Edit emotion' : 'Add emotion'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {isEditing
                                ? 'Update the mood metadata so it appears in the right order.'
                                : 'New moods are appended unless you set a sort order.'}
                        </p>
                    </div>
                    <AdminLink
                        href={route('admin.emotions.index')}
                        variant="secondary"
                        size="md"
                    >
                        Back to list
                    </AdminLink>
                </div>

                <form className="space-y-6" onSubmit={submit}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Label</label>
                            <p className="mt-1 text-xs text-slate-400">Human-friendly name shown in the UI.</p>
                            <input
                                type="text"
                                value={form.data.label}
                                onChange={(event) => form.setData('label', event.target.value)}
                                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                            />
                            {form.errors.label && (
                                <p className="mt-2 text-xs text-rose-600">{form.errors.label}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Key</label>
                            <p className="mt-1 text-xs text-slate-400">Short identifier used in the database.</p>
                            <input
                                type="text"
                                value={form.data.key}
                                onChange={(event) => form.setData('key', event.target.value)}
                                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                                placeholder="e.g. calm"
                            />
                            {form.errors.key && (
                                <p className="mt-2 text-xs text-rose-600">{form.errors.key}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Emoji</label>
                            <p className="mt-1 text-xs text-slate-400">Helps make the list scannable.</p>
                            <input
                                type="text"
                                value={form.data.emoji}
                                onChange={(event) => form.setData('emoji', event.target.value)}
                                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                                placeholder="🙂"
                            />
                            {form.errors.emoji && (
                                <p className="mt-2 text-xs text-rose-600">{form.errors.emoji}</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Color key</label>
                            <p className="mt-1 text-xs text-slate-400">Shown on charts and lists.</p>
                            <div className="mt-3 flex items-center gap-3">
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
                                <p className="mt-2 text-xs text-rose-600">{form.errors.color}</p>
                            )}
                            {hasInvalidStoredColor && (
                                <p className="mt-2 text-xs text-amber-600">Invalid color stored.</p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sort order</label>
                            <p className="mt-1 text-xs text-slate-400">Lower numbers appear first.</p>
                            <input
                                type="number"
                                min={0}
                                value={form.data.sort_order ?? ''}
                                onChange={(event) => form.setData('sort_order', event.target.value)}
                                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-400"
                                placeholder="Auto"
                            />
                            {form.errors.sort_order && (
                                <p className="mt-2 text-xs text-rose-600">{form.errors.sort_order}</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                        <label htmlFor="is_active" className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={form.data.is_active}
                                onChange={(event) => form.setData('is_active', event.target.checked)}
                                className="h-4 w-4 rounded border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-900"
                            />
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Active</p>
                                <p className="text-xs text-slate-400">Inactive moods stay in history but hide from new logs.</p>
                            </div>
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <AdminButton
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={form.processing}
                        >
                            {isEditing ? 'Update' : 'Create'}
                        </AdminButton>
                    </div>
                </form>
            </AdminCard>
        </AdminLayout>
    );
}
