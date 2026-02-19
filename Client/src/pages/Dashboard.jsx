import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Heatmap from '../components/Heatmap';
import dayjs from 'dayjs';
import CalendarView from '../components/CalendarView';
import { leaderboardAPI } from '../services/api';
import { calculateStreak } from '../utils/streak';

const Dashboard = () => {
  const { user, streak, totalPoints, level, achievements, history, isGuest } = useSelector((state) => state.user);
  const [showCalendar, setShowCalendar] = useState(false);
  const [todaySolved, setTodaySolved] = useState(false);
  const [dailyTop, setDailyTop] = useState([]);
  const [allTimeTop, setAllTimeTop] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const today = dayjs().format("YYYY-MM-DD");
  const currentStreak = useMemo(() => calculateStreak(history), [history]);

  // XP Progress Calculation (safe numeric handling)
  const numericTotal = Number(totalPoints) || 0;
  const levelVal = Number(level) || 1;
  const currentXP = numericTotal % 1000; // Simplified progress
  const nextLevelXP = 1000;
  const progressPercent = Math.min(100, (currentXP / nextLevelXP) * 100);

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
      {/* Level & Progress Section */}
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-black shadow-lg transform group-hover:rotate-12 transition">
            {levelVal}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            LEVEL
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back{user ? `, ${user.name}` : ''}!
              </h1>
              <p className="text-gray-500 text-sm">Rank: Logic Apprentice</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-400 uppercase">XP Progress</span>
              <p className="text-sm font-bold text-blue-600">{currentXP} / {nextLevelXP}</p>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-linear-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full mb-8">
        <div className="bg-linear-to-br from-orange-50 to-orange-100 p-4 md:p-6 rounded-xl shadow-sm border-2 border-orange-200 flex flex-col items-center hover:shadow-md transition">
          <span className="text-3xl md:text-4xl mb-2">🔥</span>
          <span className="text-2xl md:text-3xl font-bold text-orange-600">{currentStreak}</span>
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

      {/* Main Actions */}
      <div className="grid md:grid-cols-2 gap-6 w-full mb-8">
        {/* Daily Puzzle CTA */}
        <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative group">
          <div className="z-10 relative">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-blue-500/30 text-xs font-bold px-2 py-1 rounded">DAILY CHALLENGE</span>
              {todaySolved && <span className="text-green-300">✓ Completed</span>}
            </div>
            <h2 className="text-2xl font-bold mb-2">Today's Puzzle</h2>
            <p className="text-blue-100 text-sm mb-6">
              Keep your {currentStreak}-day streak alive!
            </p>
            <Link
              to="/game"
              className={`px-6 py-3 rounded-xl font-bold shadow-md transition transform hover:scale-105 inline-block ${todaySolved ? 'bg-white/20 text-white backdrop-blur-sm' : 'bg-yellow-400 text-yellow-900'}`}
            >
              {todaySolved ? "Play Again" : "Start Now"}
            </Link>
          </div>
        </div>

        {/* Practice Mode CTA */}
        <div className="bg-linear-to-r from-purple-600 to-fuchsia-700 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative group">
          <div className="z-10 relative">
            <span className="bg-purple-500/30 text-xs font-bold px-2 py-1 rounded">UNLIMITED PLAY</span>
            <h2 className="text-2xl font-bold mb-2 mt-4">Practice Mode</h2>
            <p className="text-purple-100 text-sm mb-6">
              No pressure, just logic. Earn XP anytime.
            </p>
            <Link
              to="/game" // We'll handle practice toggle in Game.jsx auto-loading or just navigating there
              className="px-6 py-3 bg-white text-purple-700 rounded-xl font-bold shadow-md transition transform hover:scale-105 inline-block"
            >
              Train Now
            </Link>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="w-full mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          🏅 Achievements
          <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {achievements?.length || 0} / 4
          </span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(achievements || []).map((ach) => (
            <div key={ach.id} className="bg-white p-4 rounded-xl border-2 border-yellow-100 flex flex-col items-center text-center shadow-sm">
              <span className="text-3xl mb-2">{ach.icon}</span>
              <span className="text-sm font-bold text-gray-800">{ach.name}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">Unlocked</span>
            </div>
          ))}
          {Array.from({ length: 4 - (achievements?.length || 0) }).map((_, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center opacity-50">
              <span className="text-3xl mb-2 grayscale">🔒</span>
              <span className="text-xs font-bold text-gray-400">Locked</span>
            </div>
          ))}
        </div>
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
            <div className="bg-blue-600 text-white p-3 rounded-full text-xl shadow-md">💡</div>
            <div>
              <h3 className="font-bold text-blue-900">Playing as Guest</h3>
              <p className="text-sm text-blue-800">Your progress is stored locally on this device. Login to sync across devices.</p>
            </div>
          </div>
          <Link to="/login" className="whitespace-nowrap bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700 transition transform hover:scale-105">Login Now</Link>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
