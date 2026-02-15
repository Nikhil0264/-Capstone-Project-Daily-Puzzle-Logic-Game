import React from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';

const Heatmap = () => {
    const { history } = useSelector((state) => state.user);
    const today = dayjs();
    const startDate = today.subtract(365, 'day').startOf('week');
    const weeks = [];
    let current = startDate;
    while (current.isBefore(today) || current.isSame(today, 'day')) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            week.push(current);
            current = current.add(1, 'day');
        }
        weeks.push(week);
    }
    const getColor = (date) => {
        const dateStr = date.format("YYYY-MM-DD");
        if (date.isAfter(today, 'day')) return "bg-transparent";
        const entry = history[dateStr];
        if (!entry) return "bg-gray-100";
        const s = entry.score;
        if (s >= 1000) return "bg-green-800";
        if (s >= 800) return "bg-green-600";
        if (s >= 500) return "bg-green-400";
        return "bg-green-200";
    };
    const getIntensityLabel = (date) => {
        const dateStr = date.format("YYYY-MM-DD");
        const entry = history[dateStr];
        if (!entry) return "No activity";
        return `${entry.score} pts`;
    };
    return (
        <div className="mt-8 p-6 bg-white rounded-xl shadow-sm w-full max-w-5xl mx-4 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                📊 Daily Activity <span className="text-gray-400 text-sm font-normal">(Last 365 Days)</span>
            </h2>

            <div className="overflow-x-auto pb-2">
                <div className="flex gap-1 min-w-max">
                    {weeks.map((week, wIndex) => (
                        <div key={wIndex} className="flex flex-col gap-1">
                            {week.map((day, dIndex) => (
                                <div
                                    key={day.format("YYYY-MM-DD")}
                                    className={`w-3 h-3 rounded-sm transition-colors ${getColor(day)}`}
                                    title={`${day.format("MMM D, YYYY")}: ${getIntensityLabel(day)}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-4 text-xs text-gray-400 flex gap-2 items-center justify-end">
                <span>Less</span>
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
                <span>More</span>
            </div>
        </div>
    );
};
export default Heatmap;
