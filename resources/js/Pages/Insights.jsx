import AppLayout from '@/Layouts/AppLayout';
import { useEffect, useMemo, useState } from 'react';
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

const weekFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
});
const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
});
const hourFormatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
});

const getMoodColor = (color) => chartColorMap[color] ?? fallbackColor;

const formatHourLabel = (value) => {
    if (!value) {
        return '';
    }
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return hourFormatter.format(date);
};

const formatWeekLabel = (value) => {
    if (!value) {
        return '';
    }
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return weekFormatter.format(date);
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

const buildRollingHourlySeries = (buckets = [], moods = []) => {
    const now = new Date();
    now.setMinutes(0, 0, 0, 0);

    const hours = Array.from({ length: 24 }, (_, index) => {
        const date = new Date(now);
        date.setHours(now.getHours() - (23 - index));
        return date;
    });

    const bucketMap = new Map();

    buckets.forEach((bucket) => {
        if (!bucket.timestamp) {
            return;
        }
        const parsed = new Date(bucket.timestamp);
        if (Number.isNaN(parsed.getTime())) {
            return;
        }
        parsed.setMinutes(0, 0, 0);
        bucketMap.set(parsed.getTime(), bucket.counts ?? {});
    });

    return hours.map((hour) => {
        const counts = bucketMap.get(hour.getTime()) ?? {};
        const row = {
            label: formatRollingHourLabel(hour),
            tooltipLabel: formatRollingHourTooltipTitle(hour),
        };

        moods.forEach((mood) => {
            row[mood.key] = counts[mood.key] ?? 0;
        });

        return row;
    });
};

const ChartCard = ({ title, subtitle, children }) => (
    <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm shadow-slate-900/5">
        <header>
            <p className="text-xs uppercase tracking-widest text-slate-400">
                {subtitle}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
        </header>
        <div className="mt-4 min-h-[260px] rounded-2xl border border-slate-100 bg-white/70 p-4">
            {children}
        </div>
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
    <div className="mt-6 flex flex-wrap gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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

const InsightCharts = ({ data, moods, chartType = 'bar', height = 260 }) => {
    if (!data || data.length === 0) {
        return (
            <StatusNotice message="Chart data is unavailable right now." tone="neutral" />
        );
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
        return (
            <Bar {...commonProps} radius={[4, 4, 0, 0]} />
        );
    });

    const ChartComponent = chartType === 'area' ? AreaChart : BarChart;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={data} margin={{ top: 0, right: 0, left: 0, bottom: 16 }}>
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
                <Tooltip
                    wrapperStyle={{
                        borderRadius: 12,
                        border: 'none',
                        boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)',
                    }}
                    contentStyle={{
                        background: '#0f172a',
                        borderRadius: '0.75rem',
                        padding: '0.5rem 1rem',
                    }}
                    labelStyle={{ color: '#e2e8f0', fontSize: 12 }}
                    labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.tooltipLabel ?? label
                    }
                />
                {barsOrAreas}
            </ChartComponent>
        </ResponsiveContainer>
    );
};

export default function Insights() {
    const {
        props: { moods = [] },
    } = usePage();
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

        const buildSeries = (buckets = [], formatter) =>
            buckets.map((bucket) => {
                const row = {
                    label: formatter(bucket),
                };

                moods.forEach((mood) => {
                    row[mood.key] = bucket.counts?.[mood.key] ?? 0;
                });

                return row;
            });

        return {
            hourly: buildRollingHourlySeries(insights.hourly, moods),
            weekly: buildSeries(insights.weekly, (bucket) =>
                formatWeekLabel(bucket.weekStart),
            ),
            monthly: buildSeries(insights.monthly, (bucket) =>
                formatMonthLabel(bucket.month),
            ),
            yearly: buildSeries(insights.yearly, (bucket) =>
                formatYearLabel(bucket.year),
            ),
        };
    }, [insights, moods]);

    const hasAnyData = useMemo(() => {
        if (!chartData) {
            return false;
        }

        return ['hourly', 'weekly', 'monthly', 'yearly'].some((key) =>
            chartData[key].some((row) =>
                moods.some((mood) => (row[mood.key] ?? 0) > 0),
            ),
        );
    }, [chartData, moods]);

    const summary = insights?.dominant ?? {};

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

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {[
                        { key: 'today', label: 'Today' },
                        { key: 'thisWeek', label: 'This week' },
                        { key: 'thisMonth', label: 'This month' },
                    ].map((period) => {
                        const moodKey = summary[period.key];
                        const mood = moodLookup[moodKey];
                        const accent = getMoodColor(mood?.color);
                        const accentBg = `${accent}20`;

                        return (
                            <div
                                key={period.key}
                                className="rounded-2xl border border-slate-100 bg-white shadow-sm"
                            >
                                <div className="flex h-full flex-col gap-3 p-5">
                                    <p className="text-xs uppercase tracking-widest text-slate-400">
                                        Dominant {period.label}
                                    </p>
                                    {mood ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-xl"
                                                    style={{
                                                        color: accent,
                                                        backgroundColor: accentBg,
                                                    }}
                                                >
                                                    {mood.emoji}
                                                </span>
                                                <div>
                                                    <p className="text-base font-semibold text-slate-900">
                                                        {mood.label}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {mood.key}
                                                    </p>
                                                </div>
                                            </div>
                                            <span
                                                className="rounded-full border px-3 py-1 text-xs font-semibold text-slate-500"
                                                style={{
                                                    borderColor: `${accent}40`,
                                                }}
                                            >
                                                Mood
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-semibold text-slate-600">
                                            — No data yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
                            <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm shadow-slate-900/5">
                                <ChartLegend moods={moods} />
                            </div>
                            <div className="grid gap-6 lg:grid-cols-2">
                                <ChartCard title="Hourly" subtitle="Past 24 hours">
                                    <InsightCharts
                                        data={chartData.hourly}
                                        moods={moods}
                                        chartType="bar"
                                    />
                                </ChartCard>
                                <ChartCard title="Weekly" subtitle="Last 12 weeks">
                                    <InsightCharts
                                        data={chartData.weekly}
                                        moods={moods}
                                        chartType="area"
                                    />
                                </ChartCard>
                                <ChartCard title="Monthly" subtitle="Last 12 months">
                                    <InsightCharts
                                        data={chartData.monthly}
                                        moods={moods}
                                        chartType="bar"
                                    />
                                </ChartCard>
                                <ChartCard title="Yearly" subtitle="Last 5 years">
                                    <InsightCharts
                                        data={chartData.yearly}
                                        moods={moods}
                                        chartType="bar"
                                    />
                                </ChartCard>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

Insights.layout = (page) => <AppLayout>{page}</AppLayout>;
