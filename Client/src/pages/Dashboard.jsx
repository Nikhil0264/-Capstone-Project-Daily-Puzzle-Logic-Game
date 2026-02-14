import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Heatmap from '../components/Heatmap';
import dayjs from 'dayjs';
import CalendarView from '../components/CalendarView';

const Dashboard = () => {
  const { user, streak, totalPoints, history } = useSelector((state) => state.user);
  const [showCalendar, setShowCalendar] = useState(false);

  const today = dayjs().format("YYYY-MM-DD");
  const hasPlayedToday = history && history[today] && history[today].solved;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl px-4 py-8">
      {}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user ? user.name : "Guest"}! 👋
        </h1>
        <p className="text-gray-600">
          Ready to challenge your brain today?
        </p>
      </div>

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex flex-col items-center">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-bold text-gray-800">{streak}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Streak</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center">
          <span className="text-2xl">⭐</span>
          <span className="text-xl font-bold text-gray-800">{totalPoints}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Total Points</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 flex flex-col items-center">
          <span className="text-2xl">🧩</span>
          <span className="text-xl font-bold text-gray-800">{Object.keys(history || {}).length}</span>
          <span className="text-xs text-gray-500 uppercase tracking-wide">Solved</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center cursor-pointer hover:bg-green-50 transition" onClick={() => setShowCalendar(true)}>
          <span className="text-2xl">📅</span>
          <span className="text-sm font-bold text-gray-800 mt-2">View Calendar</span>
        </div>
      </div>

      {}
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row items-center justify-between mb-8 overflow-hidden relative">
        <div className="z-10">
          <h2 className="text-2xl font-bold mb-2">Daily Puzzle</h2>
          <p className="text-blue-100 mb-6 max-w-md">
            {hasPlayedToday
              ? "You've already solved today's puzzle! Great job! Come back tomorrow for a new challenge."
              : "A new logic challenge awaits! Solve it to keep your streak alive."}
          </p>

          <Link
            to="/game"
            className={`px-6 py-3 rounded-lg font-bold shadow-md transition transform hover:scale-105 inline-block ${hasPlayedToday ? 'bg-white text-blue-600' : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300'}`}
          >
            {hasPlayedToday ? "Play Again" : "Start Puzzle"}
          </Link>
        </div>

        {}
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="white">
            <rect x="20" y="20" width="40" height="40" rx="4" />
            <rect x="80" y="80" width="40" height="40" rx="4" />
            <rect x="140" y="20" width="40" height="40" rx="4" />
            <rect x="20" y="140" width="40" height="40" rx="4" />
          </svg>
        </div>
      </div>

      {}
      <Heatmap />

      {showCalendar && (
        <CalendarView
          onClose={() => setShowCalendar(false)}
          onSelectDate={(date) => {
            console.log("Selected date:", date);
            
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
