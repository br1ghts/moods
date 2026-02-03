import { useEffect, useMemo, useRef, useState } from 'react';
import { getMoodColorClass } from '@/utils/moodColors';

const ITEM_HEIGHT_PX = 64; // Tailwind h-16
const SPACER_HEIGHT_PX = 80; // Tailwind h-20
const SETTLE_MS = 90;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function MoodWheel({ moods, value, onChange }) {
    const scrollRef = useRef(null);
    const settleTimerRef = useRef(null);
    const rafRef = useRef(null);
    const isUserScrollingRef = useRef(false);
    const ignoreNextSyncRef = useRef(false);

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    }, []);

    const selectedIndex = useMemo(() => {
        const index = moods.findIndex((mood) => mood.id === value);
        return index >= 0 ? index : 0;
    }, [moods, value]);

    const [activeIndex, setActiveIndex] = useState(selectedIndex);

    const indexFromScrollTop = (scrollTop) => {
        if (moods.length === 0) {
            return 0;
        }

        return clamp(
            Math.round(scrollTop / ITEM_HEIGHT_PX),
            0,
            moods.length - 1,
        );
    };

    const scrollTopForIndex = (index) => index * ITEM_HEIGHT_PX;

    const scrollToIndex = (index, { behavior } = {}) => {
        const node = scrollRef.current;
        if (!node) {
            return;
        }

        node.scrollTo({
            top: scrollTopForIndex(index),
            behavior: behavior ?? (prefersReducedMotion ? 'auto' : 'smooth'),
        });
    };

    const settleToNearest = () => {
        const node = scrollRef.current;
        if (!node) {
            return;
        }

        const nextIndex = indexFromScrollTop(node.scrollTop);
        setActiveIndex(nextIndex);

        const nextMood = moods[nextIndex];
        if (nextMood && nextMood.id !== value) {
            ignoreNextSyncRef.current = true;
            onChange(nextMood.id);
        }

        scrollToIndex(nextIndex);
        isUserScrollingRef.current = false;
    };

    const handleScroll = () => {
        const node = scrollRef.current;
        if (!node) {
            return;
        }

        isUserScrollingRef.current = true;

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
            setActiveIndex(indexFromScrollTop(node.scrollTop));
        });

        if (settleTimerRef.current) {
            window.clearTimeout(settleTimerRef.current);
        }

        settleTimerRef.current = window.setTimeout(settleToNearest, SETTLE_MS);
    };

    useEffect(() => {
        setActiveIndex(selectedIndex);

        if (ignoreNextSyncRef.current) {
            ignoreNextSyncRef.current = false;
            return;
        }

        if (isUserScrollingRef.current) {
            return;
        }

        const node = scrollRef.current;
        if (!node) {
            return;
        }

        requestAnimationFrame(() => {
            scrollToIndex(selectedIndex, { behavior: 'auto' });
        });
    }, [selectedIndex, moods.length]);

    useEffect(() => {
        return () => {
            if (settleTimerRef.current) {
                window.clearTimeout(settleTimerRef.current);
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-white/90 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-white/90 to-transparent" />
            <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 h-16 -translate-y-1/2 rounded-2xl bg-slate-900/[0.04] ring-1 ring-slate-900/10" />

            <div
                ref={scrollRef}
                role="listbox"
                aria-label="Mood"
                onScroll={handleScroll}
                tabIndex={0}
                className="h-56 overflow-y-scroll overscroll-contain rounded-3xl border border-slate-200 bg-white/70 px-3 py-0 snap-y snap-mandatory touch-pan-y focus:outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                <div aria-hidden className="h-20" />
                {moods.map((mood, index) => {
                    const isActive = index === activeIndex;
                    const colorClass = getMoodColorClass(mood.color, 400);

                    return (
                        <button
                            key={mood.id}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            onClick={() => {
                                setActiveIndex(index);
                                onChange(mood.id);
                                scrollToIndex(index);
                            }}
                            className={`flex h-16 w-full snap-center snap-always items-center justify-between rounded-2xl px-4 text-left transition-[transform,filter,opacity,background-color,box-shadow] duration-150 motion-reduce:transition-none ${
                                isActive
                                    ? 'bg-white shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/10'
                                    : 'bg-transparent opacity-70 blur-[0.6px] scale-[0.98]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className={`text-3xl transition-transform duration-150 motion-reduce:transition-none ${
                                        isActive ? 'scale-100' : 'scale-95'
                                    }`}
                                >
                                    {mood.emoji}
                                </span>
                                <div className="min-w-0">
                                    <div
                                        className={`truncate text-base transition motion-reduce:transition-none ${
                                            isActive
                                                ? 'font-semibold text-slate-900'
                                                : 'font-medium text-slate-600'
                                        }`}
                                    >
                                        {mood.label}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        Mood {mood.key}
                                    </div>
                                </div>
                            </div>
                            <span
                                aria-hidden
                                className={`h-2 w-8 rounded-full ${colorClass} ${
                                    isActive ? 'opacity-100' : 'opacity-60'
                                }`}
                            />
                        </button>
                    );
                })}
                <div aria-hidden className="h-20" />
            </div>
        </div>
    );
}
