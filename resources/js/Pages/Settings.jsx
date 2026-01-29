import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';

const cadenceOptions = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
];

const weekdays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

const timezones = [
    'America/Chicago',
    'America/New_York',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Phoenix',
];

export default function Settings({ notificationSettings }) {
    const form = useForm({
        enabled: notificationSettings?.enabled ?? false,
        cadence: notificationSettings?.cadence ?? 'daily',
        preferred_time: notificationSettings?.preferred_time ?? '',
        preferred_weekday: notificationSettings?.preferred_weekday ?? 1,
        timezone: notificationSettings?.timezone ?? 'America/Chicago',
    });

    const handleSubmit = (event) => {
        event.preventDefault();

        form.put(route('settings.notifications.update'), {
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Notification Settings
                </h1>
                <p className="text-sm text-slate-500">
                    Choose how often Mood Tracker nudges you to reflect.
                </p>

                <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="enabled"
                            checked={form.data.enabled}
                            onChange={(event) =>
                                form.setData('enabled', event.target.checked)
                            }
                            className="h-4 w-4"
                        />
                        <span className="text-sm font-semibold text-slate-600">
                            Enable notifications
                        </span>
                    </label>

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Cadence
                        </label>
                        <select
                            name="cadence"
                            value={form.data.cadence}
                            onChange={(event) =>
                                form.setData('cadence', event.target.value)
                            }
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                        >
                            {cadenceOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(form.data.cadence === 'daily' ||
                        form.data.cadence === 'weekly') && (
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Preferred time</span>
                            <input
                                type="time"
                                name="preferred_time"
                                value={form.data.preferred_time}
                                onChange={(event) =>
                                    form.setData(
                                        'preferred_time',
                                        event.target.value,
                                    )
                                }
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                            />
                        </label>
                    )}

                    {form.data.cadence === 'weekly' && (
                        <label className="flex flex-col gap-2 text-sm text-slate-600">
                            <span>Preferred weekday</span>
                            <select
                                name="preferred_weekday"
                                value={form.data.preferred_weekday}
                                onChange={(event) =>
                                    form.setData(
                                        'preferred_weekday',
                                        Number(event.target.value),
                                    )
                                }
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                            >
                                {weekdays.map((day) => (
                                    <option key={day.value} value={day.value}>
                                        {day.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Timezone
                        </label>
                        <select
                            name="timezone"
                            value={form.data.timezone}
                            onChange={(event) =>
                                form.setData('timezone', event.target.value)
                            }
                            className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                        >
                            {timezones.map((tz) => (
                                <option key={tz} value={tz}>
                                    {tz}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={form.processing}
                        >
                            Save preferences
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

Settings.layout = (page) => <AppLayout>{page}</AppLayout>;
