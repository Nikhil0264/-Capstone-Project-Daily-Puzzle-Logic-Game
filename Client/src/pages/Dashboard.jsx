import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Heatmap from '../components/Heatmap';
import dayjs from 'dayjs';
import CalendarView from '../components/CalendarView';
import { leaderboardAPI } from '../services/api';

const Dashboard = () => {
  const { user, streak, totalPoints, history, isGuest } = useSelector((state) => state.user);
  const [showCalendar, setShowCalendar] = useState(false);
  const [todaySolved, setTodaySolved] = useState(false);
  const [dailyTop, setDailyTop] = useState([]);
  const [allTimeTop, setAllTimeTop] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const today = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    setTodaySolved(history && history[today] && history[today].solved);
  }, [history, today]);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const [daily, allTime] = await Promise.all([
          leaderboardAPI.getDaily(),
          leaderboardAPI.getAllTime()
        ]);
        setDailyTop(Array.isArray(daily) ? daily.slice(0, 100) : []);
        setAllTimeTop(Array.isArray(allTime) ? allTime.slice(0, 100) : []);
      } catch (err) {
        console.warn('Leaderboard fetch failed:', err);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    fetchLeaderboards();
  }, []);

  const solvedCount = Object.values(history || {}).filter(h => h.solved).length;

  return (
    <div className="flex flex-col items-center w-full max-w-5xl px-4 py-8">
      {/* Welcome Section */}
      <div className="text-center mb-8 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Welcome back{user ? `, ${user.name}` : ''}! 👋
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          {todaySolved
            ? "Great job! You've solved today's puzzle. Come back tomorrow for a new challenge."
            : "Ready to challenge your brain today?"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full mb-8">
        <div className="bg-linear-to-br from-orange-50 to-orange-100 p-4 md:p-6 rounded-xl shadow-sm border-2 border-orange-200 flex flex-col items-center hover:shadow-md transition">
          <span className="text-3xl md:text-4xl mb-2">🔥</span>
          <span className="text-2xl md:text-3xl font-bold text-orange-600">{streak}</span>
          <span className="text-xs md:text-sm text-orange-600 uppercase tracking-wide font-semibold">Streak</span>
        </div>

        <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 md:p-6 rounded-xl shadow-sm border-2 border-blue-200 flex flex-col items-center hover:shadow-md transition">
          <span className="text-3xl md:text-4xl mb-2">⭐</span>
          <span className="text-2xl md:text-3xl font-bold text-blue-600">{totalPoints}</span>
          <span className="text-xs md:text-sm text-blue-600 uppercase tracking-wide font-semibold">Points</span>
        </div>

        <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 md:p-6 rounded-xl shadow-sm border-2 border-purple-200 flex flex-col items-center hover:shadow-md transition">
          <span className="text-3xl md:text-4xl mb-2">🧩</span>
          <span className="text-2xl md:text-3xl font-bold text-purple-600">{solvedCount}</span>
          <span className="text-xs md:text-sm text-purple-600 uppercase tracking-wide font-semibold">Solved</span>
        </div>

        <button
          onClick={() => setShowCalendar(true)}
          className="bg-linear-to-br from-green-50 to-green-100 p-4 md:p-6 rounded-xl shadow-sm border-2 border-green-200 flex flex-col items-center hover:shadow-md hover:bg-green-200 transition cursor-pointer"
        >
          <span className="text-3xl md:text-4xl mb-2">📅</span>
          <span className="text-xs md:text-sm text-green-700 font-bold uppercase tracking-wide text-center">View Calendar</span>
        </button>
      </div>

      {/* Daily Puzzle CTA */}
      <div className="w-full bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between mb-8 overflow-hidden relative">
        <div className="z-10 mb-4 md:mb-0">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Daily Puzzle</h2>
          <p className="text-blue-100 mb-4 md:mb-6 max-w-md">
            {todaySolved
              ? "You're on a roll! 🌟 Come back tomorrow for a new challenge."
              : "A new logic challenge awaits! Solve it to keep your streak alive."}
          </p>

          <Link
            to="/game"
            className={`px-6 py-3 rounded-lg font-bold shadow-md transition transform hover:scale-105 inline-block ${todaySolved
                ? 'bg-white text-blue-600 hover:bg-blue-50'
                : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300'
              }`}
          >
            {todaySolved ? "Play Again →" : "Start Puzzle →"}
          </Link>
        </div>

        {/* Decorative SVG */}
        <div className="absolute right-0 top-0 opacity-10 md:opacity-20 transform md:translate-x-0 translate-x-10 -translate-y-10">
          <svg width="200" height="200" viewBox="0 0 200 200" fill="white">
            <rect x="20" y="20" width="40" height="40" rx="4" />
            <rect x="80" y="80" width="40" height="40" rx="4" />
            <rect x="140" y="20" width="40" height="40" rx="4" />
            <rect x="20" y="140" width="40" height="40" rx="4" />
          </svg>
        </div>
      </div>

      {/* Top 100 performers */}
      <div className="w-full mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">🏆 Top performers</h2>
        {leaderboardLoading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
            Loading leaderboard...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-200 overflow-hidden">
              <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
                <h3 className="font-bold text-amber-800">Today&apos;s top scores</h3>
              </div>
              <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {dailyTop.length === 0 ? (
                  <li className="px-4 py-3 text-gray-500 text-sm">No scores yet today. Be the first!</li>
                ) : (
                  dailyTop.slice(0, 20).map((entry, i) => (
                    <li key={entry.id || i} className="px-4 py-2 flex justify-between items-center">
                      <span className="font-medium text-gray-800">
                        #{i + 1} {entry.user?.name || entry.user?.email || 'Anonymous'}
                      </span>
                      <span className="text-amber-600 font-bold">{entry.score} pts</span>
                    </li>
                  ))
                )}
              </ul>
              {dailyTop.length > 20 && (
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
                  Showing top 20 of {dailyTop.length} today
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 overflow-hidden">
              <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                <h3 className="font-bold text-blue-800">Top 100 all-time</h3>
              </div>
              <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {allTimeTop.length === 0 ? (
                  <li className="px-4 py-3 text-gray-500 text-sm">No players yet.</li>
                ) : (
                  allTimeTop.slice(0, 20).map((player, i) => (
                    <li key={i} className="px-4 py-2 flex justify-between items-center">
                      <span className="font-medium text-gray-800">
                        #{i + 1} {player.name || 'Anonymous'}
                      </span>
                      <span className="text-blue-600 font-bold">{player.totalPoints ?? 0} pts</span>
                    </li>
                  ))
                )}
              </ul>
              {allTimeTop.length > 20 && (
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
                  Showing top 20 of 100
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Heatmap */}
      <Heatmap />

      {/* Calendar Modal */}
      {showCalendar && (
        <CalendarView
          onClose={() => setShowCalendar(false)}
          onSelectDate={(date) => {
            setShowCalendar(false);
          }}
        />
      )}

      {/* Footer Info / Guest CTA */}
      {isGuest && (
        <div className="mt-8 w-full bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white p-3 rounded-full text-xl shadow-md">
              💡
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Playing as Guest</h3>
              <p className="text-sm text-blue-800">
                Your progress is stored locally on this device. Login to sync your streak and points across all your devices.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="whitespace-nowrap bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition transform hover:scale-105"
          >
            Login Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
