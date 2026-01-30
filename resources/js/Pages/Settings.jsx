import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

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

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
}

export default function Settings({ notificationSettings, pushStatus = {} }) {
    const {
        hasSubscription = false,
        subscriptionsCount = 0,
        subscriptions = [],
    } = pushStatus;

    const form = useForm({
        enabled: notificationSettings?.enabled ?? false,
        cadence: notificationSettings?.cadence ?? 'daily',
        preferred_time: notificationSettings?.preferred_time ?? '',
        preferred_weekday: notificationSettings?.preferred_weekday ?? 1,
        timezone: notificationSettings?.timezone ?? 'America/Chicago',
    });

    const [pushSupported, setPushSupported] = useState(false);
    const [permissionState, setPermissionState] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default',
    );
    const [registration, setRegistration] = useState(null);
    const [subscribed, setSubscribed] = useState(hasSubscription);
    const [pushProcessing, setPushProcessing] = useState(false);
    const [pushError, setPushError] = useState('');
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setPushSupported(true);

            navigator.serviceWorker.ready
                .then((reg) => {
                    setRegistration(reg);
                    return reg.pushManager.getSubscription();
                })
                .then((subscription) => {
                    if (subscription) {
                        setSubscribed(true);
                    }
                })
                .catch(() => {
                    setPushSupported(false);
                });
        }

        if (typeof Notification !== 'undefined') {
            setPermissionState(Notification.permission);

            if ('permissions' in navigator) {
                navigator.permissions
                    .query({ name: 'notifications' })
                    .then((status) => {
                        setPermissionState(status.state);
                        status.onchange = () => setPermissionState(status.state);
                    })
                    .catch(() => {
                        // ignore
                    });
            }
        }
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();

        form.put(route('settings.notifications.update'), {
            preserveScroll: true,
        });
    };

    const handleEnablePush = async () => {
        if (!registration || typeof Notification === 'undefined') {
            return;
        }

        setPushProcessing(true);
        setPushError('');

        try {
            const permission = await Notification.requestPermission();
            setPermissionState(permission);

            if (permission !== 'granted') {
                setPushError('Push permission was not granted.');
                return;
            }

            const { data } = await axios.get(route('push.vapid-public-key'));
            const key = data.key ?? '';

            if (!key) {
                throw new Error('Missing VAPID public key.');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(key),
            });

            const payload = subscription.toJSON();
            payload.content_encoding = subscription.options?.contentEncoding ?? 'aes128gcm';
            payload.user_agent = navigator.userAgent;

            await axios.post(route('push.subscribe'), payload);

            setSubscribed(true);
        } catch (error) {
            setPushError(
                error?.response?.data?.message ||
                    error?.message ||
                    'Unable to subscribe for push notifications.',
            );
        } finally {
            setPushProcessing(false);
        }
    };

    const handleTestPush = async () => {
        setPushProcessing(true);
        setPushError('');
        setTestResult(null);

        try {
            const { data } = await axios.post(route('push.test'));
            setTestResult(data);
        } catch (error) {
            setPushError(
                error?.response?.data?.message ||
                    error?.message ||
                    'Unable to send a test push.',
            );
        } finally {
            setPushProcessing(false);
        }
    };

    const handleDisablePush = async () => {
        if (!registration) {
            return;
        }

        setPushProcessing(true);
        setPushError('');

        try {
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await axios.delete(route('push.unsubscribe'), {
                    data: { endpoint: subscription.endpoint },
                });

                await subscription.unsubscribe();
            }

            setSubscribed(false);
        } catch (error) {
            setPushError(
                error?.response?.data?.message ||
                    error?.message ||
                    'Unable to unsubscribe from push notifications.',
            );
        } finally {
            setPushProcessing(false);
        }
    };

    const isEnableMode = !subscribed;
    const pushButtonDisabled =
        pushProcessing ||
        (isEnableMode && (!pushSupported || permissionState === 'denied'));

    const statusItems = [
        { label: 'Push supported', value: pushSupported ? 'Yes' : 'No' },
        { label: 'Permission', value: permissionState },
        { label: 'Subscribed', value: subscribed ? 'Yes' : 'No' },
        { label: 'Saved subscriptions', value: String(subscriptionsCount) },
    ];

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

            <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            Push Notifications
                        </h2>
                        <p className="text-sm text-slate-500">
                            Receive reminders right on your devices with push.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleTestPush}
                            disabled={pushProcessing || !subscribed}
                            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-widest text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Send Test Push
                        </button>
                        <button
                            type="button"
                            onClick={
                                isEnableMode ? handleEnablePush : handleDisablePush
                            }
                            disabled={pushButtonDisabled}
                            className="rounded-full bg-slate-900 px-6 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isEnableMode ? 'Enable Push' : 'Disable Push'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                    {statusItems.map((item) => (
                        <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <p className="text-[10px] text-slate-400">{item.label}</p>
                            <p className="text-sm text-slate-900">{item.value}</p>
                        </div>
                    ))}
                </div>

                {testResult && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">
                            Test push request complete
                        </p>
                        <p className="mt-1">
                            sent: {testResult.sent ?? 0}, failed:{' '}
                            {testResult.failed ?? 0}, expired:{' '}
                            {testResult.expired ?? 0}
                        </p>
                    </div>
                )}

                {pushError && (
                    <p className="mt-4 text-xs font-semibold text-red-600">
                        {pushError}
                    </p>
                )}

                {!pushSupported && (
                    <p className="mt-2 text-xs text-slate-500">
                        Push not supported in this browser/device.
                    </p>
                )}

                {permissionState === 'denied' && (
                    <p className="mt-2 text-xs text-red-600">
                        Notifications are blocked—enable them in your browser settings.
                    </p>
                )}

                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-900">
                        Push Diagnostics
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        What the server currently has stored for your account.
                    </p>

                    {subscriptions.length === 0 ? (
                        <p className="mt-3 text-xs text-slate-500">
                            No subscriptions saved yet.
                        </p>
                    ) : (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                            <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-4">
                                <div className="bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Endpoint
                                </div>
                                <div className="bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Last seen
                                </div>
                                <div className="bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Last push
                                </div>
                                <div className="bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Last error
                                </div>
                            </div>
                            {subscriptions.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-4"
                                >
                                    <div className="bg-white px-4 py-2 text-xs text-slate-700">
                                        {sub.endpoint}
                                        {sub.device_label ? (
                                            <span className="ml-2 text-[10px] text-slate-400">
                                                ({sub.device_label})
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="bg-white px-4 py-2 text-xs text-slate-700">
                                        {sub.last_seen_at ?? '—'}
                                    </div>
                                    <div className="bg-white px-4 py-2 text-xs text-slate-700">
                                        {sub.last_push_at ?? '—'}
                                    </div>
                                    <div className="bg-white px-4 py-2 text-xs text-slate-700">
                                        {sub.last_push_error ?? '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

Settings.layout = (page) => <AppLayout>{page}</AppLayout>;
