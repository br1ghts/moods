import allowedColors from '@/moods/colors.json';

const colorClassMap = {
    slate: { 400: 'bg-slate-400', 500: 'bg-slate-500' },
    gray: { 400: 'bg-gray-400', 500: 'bg-gray-500' },
    zinc: { 400: 'bg-zinc-400', 500: 'bg-zinc-500' },
    neutral: { 400: 'bg-neutral-400', 500: 'bg-neutral-500' },
    stone: { 400: 'bg-stone-400', 500: 'bg-stone-500' },
    red: { 400: 'bg-red-400', 500: 'bg-red-500' },
    orange: { 400: 'bg-orange-400', 500: 'bg-orange-500' },
    amber: { 400: 'bg-amber-400', 500: 'bg-amber-500' },
    yellow: { 400: 'bg-yellow-400', 500: 'bg-yellow-500' },
    lime: { 400: 'bg-lime-400', 500: 'bg-lime-500' },
    green: { 400: 'bg-green-400', 500: 'bg-green-500' },
    emerald: { 400: 'bg-emerald-400', 500: 'bg-emerald-500' },
    teal: { 400: 'bg-teal-400', 500: 'bg-teal-500' },
    cyan: { 400: 'bg-cyan-400', 500: 'bg-cyan-500' },
    sky: { 400: 'bg-sky-400', 500: 'bg-sky-500' },
    blue: { 400: 'bg-blue-400', 500: 'bg-blue-500' },
    indigo: { 400: 'bg-indigo-400', 500: 'bg-indigo-500' },
    violet: { 400: 'bg-violet-400', 500: 'bg-violet-500' },
    purple: { 400: 'bg-purple-400', 500: 'bg-purple-500' },
    fuchsia: { 400: 'bg-fuchsia-400', 500: 'bg-fuchsia-500' },
    pink: { 400: 'bg-pink-400', 500: 'bg-pink-500' },
    rose: { 400: 'bg-rose-400', 500: 'bg-rose-500' },
    cobalt: { 400: 'bg-cobalt-400', 500: 'bg-cobalt-500' },
    coral: { 400: 'bg-coral-400', 500: 'bg-coral-500' },
    mint: { 400: 'bg-mint-400', 500: 'bg-mint-500' },
};

const colorHexMap = {
    slate: '#64748b',
    gray: '#6b7280',
    zinc: '#71717a',
    neutral: '#737373',
    stone: '#78716c',
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e',
    cobalt: '#3654ff',
    coral: '#ff7043',
    mint: '#14b8a6',
};

const allowedColorSet = new Set(allowedColors);

const normalizeMoodColorKey = (value) =>
    allowedColorSet.has(value) ? value : 'gray';

const getMoodColorClass = (value, shade = 400) => {
    const key = normalizeMoodColorKey(value);
    return colorClassMap[key]?.[shade] ?? colorClassMap.gray[shade];
};

const getMoodColorHex = (value) =>
    colorHexMap[normalizeMoodColorKey(value)] ?? colorHexMap.gray;

const formatMoodColorLabel = (value) =>
    value ? value.charAt(0).toUpperCase() + value.slice(1) : '';

export {
    allowedColors,
    normalizeMoodColorKey,
    getMoodColorClass,
    getMoodColorHex,
    formatMoodColorLabel,
};
