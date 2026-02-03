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

export default function Settings({
    notificationSettings,
    pushStatus = {},
    isAdmin = false,
    apiKey = {},
    appUrl = '',
}) {
    const {
        subscriptions = [],
    } = pushStatus;

    const resolvedTimezone =
        typeof Intl !== 'undefined'
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : null;
    const timezoneOptions =
        resolvedTimezone && !timezones.includes(resolvedTimezone)
            ? [resolvedTimezone, ...timezones]
            : timezones;

    const form = useForm({
        enabled: notificationSettings?.enabled ?? false,
        test_mode_enabled: notificationSettings?.test_mode_enabled ?? false,
        test_interval_seconds: notificationSettings?.test_interval_seconds ?? 60,
        cadence: notificationSettings?.cadence ?? 'daily',
        daily_time: notificationSettings?.daily_time ?? '',
        weekly_day: notificationSettings?.weekly_day ?? 1,
        timezone:
            notificationSettings?.timezone ??
            resolvedTimezone ??
            'America/Chicago',
    });

    const [pushSupported, setPushSupported] = useState(false);
    const [permissionState, setPermissionState] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default',
    );
    const [registration, setRegistration] = useState(null);
    const [subscribed, setSubscribed] = useState(false);
    const [currentEndpoint, setCurrentEndpoint] = useState(null);
    const [subscriptionList, setSubscriptionList] = useState(subscriptions);
    const [pushProcessing, setPushProcessing] = useState(false);
    const [pushError, setPushError] = useState('');
    const [testResult, setTestResult] = useState(null);
    const [apiToken, setApiToken] = useState(apiKey?.token ?? '');
    const [showApiToken, setShowApiToken] = useState(false);
    const [apiCopyStatus, setApiCopyStatus] = useState('');
    const [apiProcessing, setApiProcessing] = useState(false);
    const [apiError, setApiError] = useState('');

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
                        setCurrentEndpoint(subscription.endpoint);
                        syncSubscription(subscription).catch(() => {
                            // ignore sync errors
                        });
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

    const handleCopyApiToken = async () => {
        if (!apiToken) {
            return;
        }

        try {
            await navigator.clipboard.writeText(apiToken);
            setApiCopyStatus('Copied!');
        } catch (error) {
            setApiCopyStatus('Copy failed');
        }

        setTimeout(() => setApiCopyStatus(''), 2000);
    };

    const handleRegenerateApiToken = async () => {
        if (!window.confirm('Regenerate your API key? This will invalidate the old one.')) {
            return;
        }

        setApiProcessing(true);
        setApiError('');

        try {
            const { data } = await axios.post(route('settings.api-key.regenerate'));
            setApiToken(data?.token ?? '');
            setShowApiToken(true);
        } catch (error) {
            setApiError(
                error?.response?.data?.message || 'Unable to regenerate API key.',
            );
        } finally {
            setApiProcessing(false);
        }
    };

    const syncSubscription = async (subscription) => {
        const payload = subscription.toJSON();
        payload.content_encoding = subscription.options?.contentEncoding ?? 'aes128gcm';
        payload.user_agent = navigator.userAgent;

        await axios.post(route('push.subscribe'), payload);
        await refreshSubscriptions();
    };

    const handleEnablePush = async () => {
        if (!registration || typeof Notification === 'undefined') {
            return;
        }

        setPushProcessing(true);
        setPushError('');

        try {
            const existingRegistrations = await navigator.serviceWorker.getRegistrations();
            const existingSubscriptions = [];

            for (const reg of existingRegistrations) {
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                    existingSubscriptions.push({ reg, sub });
                }
            }

            if (existingSubscriptions.length === 1) {
                const subscription = existingSubscriptions[0].sub;
                await syncSubscription(subscription);

                setSubscribed(true);
                setCurrentEndpoint(subscription.endpoint);
                return;
            }

            if (existingSubscriptions.length > 1) {
                for (const entry of existingSubscriptions) {
                    try {
                        await axios.delete(route('push.unsubscribe'), {
                            data: { endpoint: entry.sub.endpoint },
                        });
                    } catch (error) {
                        // ignore cleanup errors
                    }

                    try {
                        await entry.sub.unsubscribe();
                    } catch (error) {
                        // ignore cleanup errors
                    }
                }
            }

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

            await syncSubscription(subscription);

            setSubscribed(true);
            setCurrentEndpoint(subscription.endpoint);
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
            await syncCurrentSubscription();
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

    const resolveRegistration = async () => {
        if (registration) {
            return registration;
        }

        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
            throw new Error('Service worker registration is unavailable.');
        }

        const swRegistration = await navigator.serviceWorker.ready;
        setRegistration(swRegistration);

        return swRegistration;
    };

    const syncCurrentSubscription = async () => {
        try {
            const swRegistration = await resolveRegistration();
            const subscription = await swRegistration.pushManager.getSubscription();
            if (subscription) {
                await syncSubscription(subscription);
            }
        } catch (error) {
            // ignore sync failures
        }
    };

    const handleDisablePush = async () => {
        setPushProcessing(true);
        setPushError('');

        try {
            const registrations = await navigator.serviceWorker.getRegistrations();

            for (const reg of registrations) {
                const subscription = await reg.pushManager.getSubscription();

                if (subscription) {
                    try {
                        await axios.delete(route('push.unsubscribe'), {
                            data: { endpoint: subscription.endpoint },
                        });
                    } catch (error) {
                        // ignore cleanup errors
                    }

                    try {
                        await subscription.unsubscribe();
                    } catch (error) {
                        // ignore cleanup errors
                    }
                }
            }

            setSubscribed(false);
            setCurrentEndpoint(null);
            await refreshSubscriptions();
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

    const refreshSubscriptions = async () => {
        const { data } = await axios.get(route('push.subscriptions.index'));
        setSubscriptionList(data.subscriptions ?? []);
    };

    const handleRemoveSubscription = async (subscription) => {
        if (subscription.endpoint === currentEndpoint) {
            await handleDisablePush();
            return;
        }

        setPushProcessing(true);
        setPushError('');

        try {
            await axios.delete(route('push.subscriptions.destroy', subscription.id));
            setSubscriptionList((current) =>
                current.filter((item) => item.id !== subscription.id),
            );
        } catch (error) {
            setPushError(
                error?.response?.data?.message ||
                    error?.message ||
                    'Unable to remove this device.',
            );
        } finally {
            setPushProcessing(false);
        }
    };

    const formatDeviceName = (userAgent, deviceLabel) => {
        if (deviceLabel) {
            return deviceLabel;
        }

        if (!userAgent) {
            return 'Unknown device';
        }

        const ua = userAgent.toLowerCase();
        let browser = 'Browser';
        let os = 'Unknown OS';

        if (ua.includes('edg/')) {
            browser = 'Edge';
        } else if (ua.includes('opr/') || ua.includes('opera')) {
            browser = 'Opera';
        } else if (ua.includes('chrome/') || ua.includes('crios')) {
            browser = 'Chrome';
        } else if (ua.includes('firefox/') || ua.includes('fxios')) {
            browser = 'Firefox';
        } else if (ua.includes('safari/')) {
            browser = 'Safari';
        }

        if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
            os = 'iOS';
        } else if (ua.includes('android')) {
            os = 'Android';
        } else if (ua.includes('windows nt')) {
            os = 'Windows';
        } else if (ua.includes('mac os x')) {
            os = 'macOS';
        } else if (ua.includes('linux')) {
            os = 'Linux';
        }

        return `${browser} on ${os}`;
    };

    const formatDateTime = (value) => {
        if (!value) {
            return '—';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return '—';
        }

        return parsed.toLocaleString();
    };

    const isEnableMode = !subscribed;
    const pushButtonDisabled =
        pushProcessing ||
        (isEnableMode && (!pushSupported || permissionState === 'denied'));

    const statusItems = [
        { label: 'Push supported', value: pushSupported ? 'Yes' : 'No' },
        { label: 'Permission', value: permissionState },
        { label: 'Subscribed', value: subscribed ? 'Yes' : 'No' },
        { label: 'Saved subscriptions', value: String(subscriptionList.length) },
    ];

    const maskedToken = apiToken
        ? apiToken.replace(/.(?=.{4})/g, '•')
        : '—';
    const baseUrl =
        typeof window !== 'undefined' && window.location?.origin
            ? window.location.origin
            : appUrl;
    const exampleToken = apiToken || 'YOUR_API_KEY';
    const exampleBase = baseUrl ? `${baseUrl}/api/${exampleToken}/log` : `/api/${exampleToken}/log`;

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
                                name="daily_time"
                                value={form.data.daily_time}
                                onChange={(event) =>
                                    form.setData(
                                        'daily_time',
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
                                name="weekly_day"
                                value={form.data.weekly_day}
                                onChange={(event) =>
                                    form.setData(
                                        'weekly_day',
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
                            {timezoneOptions.map((tz) => (
                                <option key={tz} value={tz}>
                                    {tz}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isAdmin && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
                                Admin test mode
                            </p>
                            <p className="mt-2 text-sm text-amber-800">
                                Enable rapid test reminders. This overrides the normal cadence while enabled.
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-amber-900">
                                    <input
                                        type="checkbox"
                                        name="test_mode_enabled"
                                        checked={form.data.test_mode_enabled}
                                        onChange={(event) =>
                                            form.setData('test_mode_enabled', event.target.checked)
                                        }
                                        className="h-4 w-4"
                                    />
                                    <span>Enable test reminders</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm text-amber-900">
                                    <span>Interval</span>
                                    <select
                                        name="test_interval_seconds"
                                        value={form.data.test_interval_seconds}
                                        onChange={(event) =>
                                            form.setData('test_interval_seconds', Number(event.target.value))
                                        }
                                        disabled={!form.data.test_mode_enabled}
                                        className="rounded-full border border-amber-200 bg-white px-3 py-1 text-sm text-amber-900 disabled:opacity-60"
                                    >
                                        <option value={30}>30 seconds</option>
                                        <option value={60}>60 seconds</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    )}

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
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">
                            API Key
                        </h2>
                        <p className="text-sm text-slate-500">
                            Use this key to log moods from Apple Shortcuts or other tools.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleRegenerateApiToken}
                        disabled={apiProcessing}
                        className="rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-widest text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Regenerate Key
                    </button>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        API key
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <code className="rounded-xl bg-white px-3 py-2 text-xs text-slate-700">
                            {showApiToken ? apiToken || '—' : maskedToken}
                        </code>
                        <button
                            type="button"
                            onClick={() => setShowApiToken((prev) => !prev)}
                            className="text-xs font-semibold text-slate-600 underline-offset-4 hover:underline"
                        >
                            {showApiToken ? 'Hide' : 'Reveal'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyApiToken}
                            className="text-xs font-semibold text-slate-600 underline-offset-4 hover:underline"
                        >
                            Copy
                        </button>
                        {apiCopyStatus && (
                            <span className="text-xs text-emerald-600">
                                {apiCopyStatus}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <p className="font-semibold text-slate-700">Example URLs</p>
                    <code className="block rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                        {exampleBase}/happy
                    </code>
                    <code className="block rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                        {exampleBase}/happy?note=feeling%20great
                    </code>
                </div>

                <p className="mt-4 text-xs text-amber-700">
                    Treat this like a password. Anyone with this key can log moods to your account.
                </p>

                {apiError && (
                    <p className="mt-2 text-xs font-semibold text-red-600">
                        {apiError}
                    </p>
                )}
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
                        Devices
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Manage the devices that can receive your push reminders.
                    </p>

                    {!currentEndpoint && (
                        <p className="mt-2 text-xs text-slate-500">
                            Push disabled on this device.
                        </p>
                    )}

                    {subscriptionList.length === 0 ? (
                        <p className="mt-3 text-xs text-slate-500">
                            No subscriptions saved yet.
                        </p>
                    ) : (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                            <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-4">
                                <div className="bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Device
                                </div>
                                <div className="bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Created
                                </div>
                                <div className="bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Last seen
                                </div>
                                <div className="bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Actions
                                </div>
                            </div>
                            {subscriptionList.map((sub) => {
                                const isCurrentDevice = currentEndpoint === sub.endpoint;

                                return (
                                <div
                                    key={sub.id}
                                    className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-4"
                                >
                                    <div className="bg-white px-4 py-2 text-xs text-slate-700">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-slate-900">
                                                {formatDeviceName(
                                                    sub.user_agent,
                                                    sub.device_label,
                                                )}
                                            </span>
                                            {isCurrentDevice ? (
                                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                                    This device
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 text-[10px] text-slate-400">
                                            {sub.endpoint_display ?? sub.endpoint}
                                        </p>
                                    </div>
                                    <div className="bg-white px-4 py-2 text-xs text-slate-700">
                                        {formatDateTime(sub.created_at)}
                                    </div>
                                    <div className="bg-white px-4 py-2 text-xs text-slate-700">
                                        {formatDateTime(sub.last_seen_at)}
                                    </div>
                                    <div className="bg-white px-4 py-2 text-xs text-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSubscription(sub)}
                                            disabled={pushProcessing || isCurrentDevice}
                                            className="rounded-full border border-rose-200 bg-white px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Remove
                                        </button>
                                        {isCurrentDevice ? (
                                            <p className="mt-2 text-[10px] text-slate-400">
                                                Use “Disable Push” to remove this device.
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

Settings.layout = (page) => <AppLayout>{page}</AppLayout>;
