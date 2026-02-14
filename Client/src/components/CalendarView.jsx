import React from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';

const CalendarView = ({ onClose, onSelectDate }) => {
    const { history } = useSelector((state) => state.user);
    const today = dayjs();
    const startOfMonth = today.startOf('month');
    const endOfMonth = today.endOf('month');

    
    
    
    

    const daysInMonth = [];
    for (let i = 1; i <= endOfMonth.date(); i++) {
        daysInMonth.push(startOfMonth.date(i));
    }

    
    const getDayStatus = (date) => {
        const dateStr = date.format("YYYY-MM-DD");
        const isToday = date.isSame(today, 'day');
        const isFuture = date.isAfter(today, 'day');
        const entry = history[dateStr];

        if (isFuture) return "locked";
        if (entry && entry.solved) return "solved";
        if (isToday) return "active"; 
        return "missed"; 
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                    {today.format("MMMM YYYY")}
                </h2>

                <div className="grid grid-cols-7 gap-2 text-center text-sm font-semibold text-gray-400 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {}
                    {Array.from({ length: startOfMonth.day() }).map((_, i) => (
                        <div key={`pad-${i}`} />
                    ))}

                    {daysInMonth.map((date) => {
                        const status = getDayStatus(date);
                        const isToday = date.isSame(today, 'day');

                        let btnClass = "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ";
                        let disabled = false;

                        if (status === "locked") {
                            btnClass += "bg-gray-100 text-gray-300 cursor-not-allowed";
                            disabled = true;
                        } else if (status === "solved") {
                            btnClass += "bg-green-100 text-green-700 border border-green-300";
                            disabled = true; 
                        } else if (status === "active") {
                            btnClass += "bg-blue-600 text-white shadow-lg scale-110";
                        } else if (status === "missed") {
                            btnClass += "bg-red-50 text-red-300 border border-red-100";
                            disabled = true; 
                        }

                        return (
                            <button
                                key={date.toString()}
                                disabled={disabled}
                                onClick={() => {
                                    if (!disabled) {
                                        onSelectDate(date.format("YYYY-MM-DD"));
                                        onClose();
                                    }
                                }}
                                className={btnClass}
                            >
                                {date.date()}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 text-xs text-gray-500 flex justify-center gap-3">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Today</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-200"></div> Solved</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-100"></div> Missed</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
