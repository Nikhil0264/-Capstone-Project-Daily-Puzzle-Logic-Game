import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import HeatmapTooltip from './HeatmapTooltip';
import { calculateStreak, getIntensity } from '../utils/streak';

const HeatmapCell = React.memo(({ day, entry, onHover }) => {
    const intensity = getIntensity(entry);

    const intensityColors = {
        0: "bg-gray-100 dark:bg-gray-800",
        1: "bg-green-200 dark:bg-green-900/40",
        2: "bg-green-400 dark:bg-green-700",
        3: "bg-green-600 dark:bg-green-500",
        4: "bg-green-800 dark:bg-green-300"
    };

    return (
        <motion.div
            whileHover={{ scale: 1.2, zIndex: 10 }}
            onMouseEnter={(e) => onHover(e, day, entry)}
            onMouseLeave={() => onHover(null)}
            className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-[2px] cursor-pointer transition-colors duration-300 ${intensityColors[intensity]}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 0.2,
                // `day.week()` requires a dayjs plugin in production builds and may be undefined.
                // Use `day.date()` (day of month) for a small stable offset instead.
                delay: (day.day() * 0.01) + (day.date() * 0.0001)
            }}
        />
    );
});

HeatmapCell.displayName = 'HeatmapCell';

const Heatmap = () => {
    const { history } = useSelector((state) => state.user);
    const [tooltip, setTooltip] = useState({ active: false, day: null, entry: null, x: 0, y: 0 });

    const today = dayjs();
    const startDate = today.subtract(1, 'year').startOf('week');

    const weeks = useMemo(() => {
        const weeksArr = [];
        let current = startDate;

        // Generate 12-month grid
        for (let w = 0; w < 53; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                week.push(current);
                current = current.add(1, 'day');
            }
            weeksArr.push(week);
        }
        return weeksArr;
    }, []);

    const handleHover = (e, day, entry) => {
        if (!e) {
            setTooltip(prev => ({ ...prev, active: false }));
            return;
        }
        setTooltip({
            active: true,
            day,
            entry,
            x: e.clientX,
            y: e.clientY
        });
    };

    const currentStreak = useMemo(() => calculateStreak(history), [history]);

    return (
        <div className="mt-8 p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm w-full max-w-5xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        📊 Progress Heatmap
                    </h2>
                    <p className="text-gray-400 text-sm">Visualize your daily logic challenges over the past year</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Current Streak</span>
                        <span className="text-lg font-black text-orange-500 flex items-center gap-1">
                            {currentStreak} <span className="text-sm">🔥</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-1.5 min-w-max">
                    {/* Weekday Labels */}
                    <div className="flex flex-col gap-1.5 pr-2 pt-5">
                        {['Mon', 'Wed', 'Fri'].map(day => (
                            <span key={day} className="text-[10px] text-gray-400 h-3.5 flex items-center uppercase font-bold">
                                {day}
                            </span>
                        ))}
                    </div>

                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-1.5">
                            {/* Month Label */}
                            <div className="h-4 text-[10px] text-gray-400 font-bold uppercase truncate">
                                {wIndex % 4 === 0 && week[0].format('MMM')}
                            </div>

                            {week.map((day) => (
                                <HeatmapCell
                                    key={day.format("YYYY-MM-DD")}
                                    day={day}
                                    entry={history[day.format("YYYY-MM-DD")]}
                                    onHover={handleHover}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-50 dark:border-gray-800 pt-4">
                <div className="text-[10px] text-gray-400 font-medium italic">
                    Tip: Hover over a cell to see specific stats!
                </div>

                <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Intensity</span>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map(i => (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-[2px] ${i === 0 ? "bg-gray-100 dark:bg-gray-800" :
                                    i === 1 ? "bg-green-200" :
                                        i === 2 ? "bg-green-400" :
                                            i === 3 ? "bg-green-600" : "bg-green-800"
                                    }`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-4 ml-4 text-[10px] font-bold text-gray-400 uppercase">
                        <span>Less</span>
                        <span>More</span>
                    </div>
                </div>
            </div>

            <HeatmapTooltip {...tooltip} />
        </div>
    );
};

export default Heatmap;
