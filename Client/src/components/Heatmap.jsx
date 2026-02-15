import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';

const Heatmap = () => {
    const { history } = useSelector((state) => state.user);
    const [weeks, setWeeks] = useState([]);

    useEffect(() => {
        // Generate 365-day heatmap grid
        const today = dayjs();
        const startDate = today.subtract(365, 'day').startOf('week');

        const weeksArray = [];
        let current = startDate;

        while (current.isBefore(today) || current.isSame(today, 'day')) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                week.push(current);
                current = current.add(1, 'day');
            }
            weeksArray.push(week);
        }

        setWeeks(weeksArray);
    }, []);

    const getColor = (date) => {
        const dateStr = date.format("YYYY-MM-DD");
        const today = dayjs();

        // Future dates are transparent
        if (date.isAfter(today, 'day')) return "bg-transparent";

        const entry = history[dateStr];
        if (!entry || !entry.solved) return "bg-gray-100";

        // Color intensity based on score
        const score = entry.score || 0;
        if (score >= 1000) return "bg-green-800";
        if (score >= 800) return "bg-green-600";
        if (score >= 500) return "bg-green-400";
        return "bg-green-200";
    };

    const getTooltip = (date) => {
        const dateStr = date.format("YYYY-MM-DD");
        const entry = history[dateStr];
        
        if (!entry) return `${date.format("MMM D, YYYY")}: No activity`;
        if (!entry.solved) return `${date.format("MMM D, YYYY")}: Not solved yet`;
        
        return `${date.format("MMM D, YYYY")}: ${entry.score} pts (${entry.timeTaken || 0}s)`;
    };

    return (
        <div className="mt-8 p-6 bg-white rounded-xl shadow-sm w-full max-w-5xl mx-4 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                📊 Activity Heatmap <span className="text-gray-400 text-sm font-normal">(365 Days)</span>
            </h2>

            {weeks.length > 0 ? (
                <div className="overflow-x-auto pb-2">
                    <div className="flex gap-1 min-w-max">
                        {weeks.map((week, wIndex) => (
                            <div key={wIndex} className="flex flex-col gap-1">
                                {week.map((day) => (
                                    <div
                                        key={day.format("YYYY-MM-DD")}
                                        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-all hover:shadow-md cursor-pointer ${getColor(day)}`}
                                        title={getTooltip(day)}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-gray-500 text-sm">Loading heatmap...</p>
            )}

            <div className="mt-4 text-xs text-gray-500 flex gap-2 items-center justify-end flex-wrap">
                <span>Less activity</span>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-100 rounded-sm border border-gray-300"></div>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-200 rounded-sm"></div>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-sm"></div>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-600 rounded-sm"></div>
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-800 rounded-sm"></div>
                <span>More activity</span>
            </div>
        </div>
    );
};

export default Heatmap;
