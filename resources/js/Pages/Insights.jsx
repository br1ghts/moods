import AppLayout from '@/Layouts/AppLayout';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';

const chartColorMap = {
    emerald: '#10b981',
    yellow: '#eab308',
    blue: '#3b82f6',
    slate: '#64748b',
    orange: '#f97316',
    indigo: '#6366f1',
    red: '#ef4444',
    teal: '#14b8a6',
    purple: '#a855f7',
    pink: '#ec4899',
};
const fallbackColor = '#94a3b8';

const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
});
const dayAxisFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
});
const dayTooltipFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
});

const getMoodColor = (color) => chartColorMap[color] ?? fallbackColor;

const parseLocalDate = (value) => {
    if (!value) {
        return null;
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
};

const formatMonthLabel = (value) => {
    if (!value) {
        return '';
    }
    const [year, month] = value.split('-').map(Number);
    if (!year || !month) {
        return '';
    }
    return monthFormatter.format(new Date(year, month - 1));
};

const formatYearLabel = (value) => (value ? String(value) : '');

const formatDayLabel = (value) => {
    const date = parseLocalDate(value);

    if (!date) {
        return '';
    }

    return dayAxisFormatter.format(date);
};

const formatDayTooltip = (value) => {
    const date = parseLocalDate(value);

    if (!date) {
        return '';
    }

    return dayTooltipFormatter.format(date);
};

const tooltipHourDateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
});

const formatRollingHourLabel = (date) => {
    if (!date || Number.isNaN(date.getTime())) {
        return '';
    }

    const hour = date.getHours();
    const period = hour >= 12 ? 'p' : 'a';
    const normalized = hour % 12 === 0 ? 12 : hour % 12;

    return `${normalized}${period}`;
};

const formatRollingHourTooltipTitle = (date) => {
    const start = date;
    const end = new Date(date);
    end.setHours(end.getHours() + 1);

    const startPeriod = start.getHours() >= 12 ? 'PM' : 'AM';
    const endPeriod = end.getHours() >= 12 ? 'PM' : 'AM';

    const formatNumber = (value) => {
        const remainder = value % 12;
        return remainder === 0 ? 12 : remainder;
    };

    const range =
        startPeriod === endPeriod
            ? `${formatNumber(start.getHours())}–${formatNumber(end.getHours())} ${startPeriod}`
            : `${formatNumber(start.getHours())} ${startPeriod}–${formatNumber(end.getHours())} ${endPeriod}`;

    return `${tooltipHourDateFormatter.format(start)}, ${range}`;
};

const sumCounts = (counts = {}) =>
    Object.values(counts).reduce((total, value) => total + (value ?? 0), 0);

const buildHourlySeries = (buckets = [], moods = []) =>
    buckets.map((bucket) => {
        const date = bucket.timestamp ? new Date(bucket.timestamp) : null;
        const counts = bucket.counts ?? {};
        const row = {
            label: bucket.label ?? formatRollingHourLabel(date),
            tooltipLabel: date ? formatRollingHourTooltipTitle(date) : bucket.label,
            bucketKey: bucket.timestamp,
            total: bucket.total ?? sumCounts(counts),
        };

        moods.forEach((mood) => {
            row[mood.key] = counts[mood.key] ?? 0;
        });

        return row;
    });

const ChartCard = ({ title, subtitle, actions, children, className = '' }) => (
    <div
        className={`rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm shadow-slate-900/5 ${className}`}
    >
        <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                    {subtitle}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
            </div>
            {actions}
        </header>
        {children}
    </div>
);

const SummaryCard = ({ title, children }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-xs uppercase tracking-widest text-slate-400">{title}</p>
        <div className="mt-3">{children}</div>
    </div>
);

const StatusNotice = ({ message, tone = 'info' }) => {
    const tones = {
        info: 'border-slate-200 bg-slate-50 text-slate-600',
        error: 'border-rose-200 bg-rose-50 text-rose-600',
        neutral: 'border-slate-200 bg-white/60 text-slate-600',
    };

    return (
        <div
            className={`rounded-2xl border px-6 py-8 text-center text-sm font-medium ${tones[tone]}`}
        >
            {message}
        </div>
    );
};

const ChartLegend = ({ moods }) => (
    <div className="flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {moods.map((mood) => {
            const color = getMoodColor(mood.color);

            return (
                <div
                    key={mood.key}
                    className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1"
                >
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <span>{mood.label}</span>
                </div>
            );
        })}
    </div>
);

const MinimalTooltip = ({ active, label, payload, moodLookup }) => {
    if (!active || !payload?.length) {
        return null;
    }

    const point = payload[0];
    const mood = moodLookup?.[point.dataKey];
    const total = point.payload?.total ?? 0;
    const displayLabel = point.payload?.tooltipLabel ?? label;

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
            <p className="text-xs font-semibold text-slate-600">{displayLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
                {mood ? mood.label : 'Entries'}: {point.value}
            </p>
            <p className="text-xs text-slate-500">Total entries: {total}</p>
        </div>
    );
};

const InsightChart = ({
    data,
    moods,
    chartType = 'bar',
    height = 260,
    showTooltip = true,
    onActive,
    onMouseLeave,
    moodLookup,
}) => {
    if (!data || data.length === 0) {
        return <StatusNotice message="Chart data is unavailable right now." tone="neutral" />;
    }

    const barsOrAreas = moods.map((mood) => {
        const color = getMoodColor(mood.color);
        const commonProps = {
            key: mood.key,
            dataKey: mood.key,
            stackId: 'moods',
            fill: color,
        };
        if (chartType === 'area') {
            return (
                <Area
                    {...commonProps}
                    stroke={color}
                    strokeWidth={2}
                    fillOpacity={0.85}
                    type="monotone"
                />
            );
        }
        return <Bar {...commonProps} radius={[4, 4, 0, 0]} />;
    });

    const ChartComponent = chartType === 'area' ? AreaChart : BarChart;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ChartComponent
                data={data}
                margin={{ top: 6, right: 8, left: 0, bottom: 8 }}
                onMouseMove={onActive}
                onClick={onActive}
                onMouseLeave={onMouseLeave}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    dataKey="label"
                    tick={{ fill: '#475569', fontSize: 12 }}
                    tickLine={false}
                />
                <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    tickLine={false}
                />
                {showTooltip ? (
                    <Tooltip
                        cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                        wrapperStyle={{ outline: 'none' }}
                        content={(props) => (
                            <MinimalTooltip {...props} moodLookup={moodLookup} />
                        )}
                        labelFormatter={(value, payload) =>
                            payload?.[0]?.payload?.tooltipLabel ?? value
                        }
                        shared={false}
                    />
                ) : null}
                {barsOrAreas}
            </ChartComponent>
        </ResponsiveContainer>
    );
};

const InsightPanel = ({ activeBucket, moods, emptyMessage, showIntensity }) => {
    if (!activeBucket) {
        return (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-500">
                {emptyMessage}
            </div>
        );
    }

    const entries = moods
        .map((mood) => ({
            mood,
            value: activeBucket[mood.key] ?? 0,
        }))
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

    return (
        <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                    Selected
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                    {activeBucket.tooltipLabel ?? activeBucket.label}
                </p>
            </div>
            <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">
                    Top emotions
                </p>
                {entries.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">No entries logged.</p>
                ) : (
                    <div className="mt-2 space-y-2">
                        {entries.map(({ mood, value }) => (
                            <div
                                key={mood.key}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2"
                            >
                                <div className="flex items-center gap-2">
                                    <span>{mood.emoji}</span>
                                    <span className="text-sm font-semibold text-slate-700">
                                        {mood.label}
                                    </span>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="mt-auto grid gap-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                    <span>Total entries</span>
                    <span className="font-semibold text-slate-900">
                        {activeBucket.total ?? 0}
                    </span>
                </div>
                {showIntensity ? (
                    <div className="flex items-center justify-between">
                        <span>Avg intensity</span>
                        <span className="font-semibold text-slate-900">
                            {activeBucket.intensityAvg
                                ? `${activeBucket.intensityAvg} / 5`
                                : '—'}
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const RangeToggle = ({ value, onChange }) => (
    <div className="flex items-center rounded-full border border-slate-200 bg-white/80 p-1 text-xs font-semibold text-slate-500">
        {[7, 14, 30].map((range) => (
            <button
                key={range}
                type="button"
                onClick={() => onChange(range)}
                className={`rounded-full px-3 py-1 transition ${
                    value === range
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                {range}d
            </button>
        ))}
    </div>
);

export default function Insights() {
    const {
        props: { moods = [] },
    } = usePage();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dailyRange, setDailyRange] = useState(14);
    const [activeDailyBucket, setActiveDailyBucket] = useState(null);
    const [activeHourlyBucket, setActiveHourlyBucket] = useState(null);

    useEffect(() => {
        let isMounted = true;

        fetch(route('insights.data'))
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to fetch insights');
                }
                return response.json();
            })
            .then((data) => {
                if (!isMounted) {
                    return;
                }
                setInsights(data);
                setError(null);
            })
            .catch(() => {
                if (!isMounted) {
                    return;
                }
                setError('We could not load insights just yet. Try again soon.');
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const moodLookup = useMemo(() => {
        return moods.reduce((acc, mood) => {
            acc[mood.key] = mood;
            return acc;
        }, {});
    }, [moods]);

    const chartData = useMemo(() => {
        if (!insights || moods.length === 0) {
            return null;
        }

        const buildSeries = (buckets = [], labelFormatter, keyFormatter, tooltipFormatter) =>
            buckets.map((bucket) => {
                const counts = bucket.counts ?? {};
                const row = {
                    label: labelFormatter(bucket),
                    tooltipLabel: tooltipFormatter ? tooltipFormatter(bucket) : labelFormatter(bucket),
                    bucketKey: keyFormatter(bucket),
                    total: bucket.total ?? sumCounts(counts),
                    intensityAvg: bucket.intensityAvg ?? null,
                };

                moods.forEach((mood) => {
                    row[mood.key] = counts[mood.key] ?? 0;
                });

                return row;
            });

        return {
            hourly: buildHourlySeries(insights.hourly, moods),
            daily: buildSeries(
                insights.daily,
                (bucket) => formatDayLabel(bucket.date),
                (bucket) => bucket.date,
                (bucket) => formatDayTooltip(bucket.date),
            ),
            monthly: buildSeries(
                insights.monthly,
                (bucket) => formatMonthLabel(bucket.month),
                (bucket) => bucket.month,
            ),
            yearly: buildSeries(
                insights.yearly,
                (bucket) => formatYearLabel(bucket.year),
                (bucket) => bucket.year,
            ),
        };
    }, [insights, moods]);

    const hasAnyData = useMemo(() => {
        if (!chartData) {
            return false;
        }

        return ['hourly', 'daily', 'monthly', 'yearly'].some((key) =>
            chartData[key].some((row) =>
                moods.some((mood) => (row[mood.key] ?? 0) > 0),
            ),
        );
    }, [chartData, moods]);

    const summary = insights?.summary ?? {};
    const dominantToday = moodLookup[summary.dominantToday];
    const dominantLast7Days = moodLookup[summary.dominantLast7Days];

    const dailyData = useMemo(() => {
        if (!chartData?.daily) {
            return [];
        }

        return chartData.daily.slice(-dailyRange);
    }, [chartData, dailyRange]);

    const updateActiveBucket = useCallback((event, setter) => {
        const next = event?.activePayload?.[0]?.payload ?? null;
        setter((prev) => {
            if (!next?.bucketKey) {
                return prev ? null : prev;
            }

            if (prev?.bucketKey === next.bucketKey) {
                return prev;
            }

            return next;
        });
    }, []);

    const handleDailyActive = useCallback(
        (event) => updateActiveBucket(event, setActiveDailyBucket),
        [updateActiveBucket],
    );
    const handleHourlyActive = useCallback(
        (event) => updateActiveBucket(event, setActiveHourlyBucket),
        [updateActiveBucket],
    );

    return (
        <div className="space-y-6 pb-10">
            <section className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Insights
                    </h1>
                    <p className="text-sm text-slate-500">
                        Track how moods ebb and flow over time without digging
                        through raw data.
                    </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard title="Dominant mood today">
                        {dominantToday ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{dominantToday.emoji}</span>
                                <div>
                                    <p className="text-base font-semibold text-slate-900">
                                        {dominantToday.label}
                                    </p>
                                    <p className="text-xs text-slate-500">{dominantToday.key}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-slate-600">— No data yet</p>
                        )}
                    </SummaryCard>
                    <SummaryCard title="Dominant mood (last 7 days)">
                        {dominantLast7Days ? (
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{dominantLast7Days.emoji}</span>
                                <div>
                                    <p className="text-base font-semibold text-slate-900">
                                        {dominantLast7Days.label}
                                    </p>
                                    <p className="text-xs text-slate-500">{dominantLast7Days.key}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-slate-600">— No data yet</p>
                        )}
                    </SummaryCard>
                    <SummaryCard title="Total entries (last 7 days)">
                        <p className="text-2xl font-semibold text-slate-900">
                            {summary.last7TotalEntries ?? 0}
                        </p>
                        <p className="text-xs text-slate-500">Logged check-ins</p>
                    </SummaryCard>
                    <SummaryCard title="Avg intensity (last 7 days)">
                        <p className="text-2xl font-semibold text-slate-900">
                            {summary.last7AvgIntensity ? `${summary.last7AvgIntensity} / 5` : '—'}
                        </p>
                        <p className="text-xs text-slate-500">Based on recorded intensity</p>
                    </SummaryCard>
                </div>

                <div className="mt-10 space-y-6">
                    {loading ? (
                        <StatusNotice message="Gathering your mood history..." />
                    ) : error ? (
                        <StatusNotice message={error} tone="error" />
                    ) : !hasAnyData ? (
                        <StatusNotice message="No entries yet—log a mood to unlock these charts." />
                    ) : (
                        <>
                            <div className="space-y-8">
                                <ChartCard
                                    title="Daily"
                                    subtitle="Last 7 / 14 / 30 days"
                                    className="p-7 md:p-8"
                                    actions={
                                        <RangeToggle
                                            value={dailyRange}
                                            onChange={setDailyRange}
                                        />
                                    }
                                >
                                    <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
                                        <div className="min-h-[320px] rounded-2xl border border-slate-100 bg-white/70 p-3">
                                            <InsightChart
                                                data={dailyData}
                                                moods={moods}
                                                chartType="bar"
                                                height={320}
                                                showTooltip={false}
                                                onActive={handleDailyActive}
                                                onMouseLeave={() => setActiveDailyBucket(null)}
                                                moodLookup={moodLookup}
                                            />
                                        </div>
                                        <InsightPanel
                                            activeBucket={activeDailyBucket}
                                            moods={moods}
                                            showIntensity
                                            emptyMessage="Hover or tap a day to see details."
                                        />
                                    </div>
                                    <div className="mt-5">
                                        <ChartLegend moods={moods} />
                                    </div>
                                </ChartCard>

                                <ChartCard
                                    title="Hourly"
                                    subtitle="Past 24 hours"
                                    className="bg-slate-50/70"
                                >
                                    <div className="mt-5 grid gap-4">
                                        <div className="min-h-[220px] max-h-[240px] rounded-2xl border border-slate-100 bg-white/70 p-3">
                                            <InsightChart
                                                data={chartData.hourly}
                                                moods={moods}
                                                chartType="bar"
                                                height={220}
                                                showTooltip={false}
                                                onActive={handleHourlyActive}
                                                onMouseLeave={() => setActiveHourlyBucket(null)}
                                                moodLookup={moodLookup}
                                            />
                                        </div>
                                        <InsightPanel
                                            activeBucket={activeHourlyBucket}
                                            moods={moods}
                                            emptyMessage="Hover or tap an hour to see details."
                                        />
                                    </div>
                                </ChartCard>
                            </div>

                            <details className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
                                <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                                    Long-term trends
                                </summary>
                                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                                    <ChartCard title="Monthly" subtitle="Last 12 months">
                                        <div className="mt-4 min-h-[260px] rounded-2xl border border-slate-100 bg-white/70 p-3">
                                            <InsightChart
                                                data={chartData.monthly}
                                                moods={moods}
                                                chartType="bar"
                                                height={260}
                                                moodLookup={moodLookup}
                                            />
                                        </div>
                                    </ChartCard>
                                    <ChartCard title="Yearly" subtitle="Last 5 years">
                                        <div className="mt-4 min-h-[260px] rounded-2xl border border-slate-100 bg-white/70 p-3">
                                            <InsightChart
                                                data={chartData.yearly}
                                                moods={moods}
                                                chartType="bar"
                                                height={260}
                                                moodLookup={moodLookup}
                                            />
                                        </div>
                                    </ChartCard>
                                </div>
                            </details>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

Insights.layout = (page) => <AppLayout>{page}</AppLayout>;
