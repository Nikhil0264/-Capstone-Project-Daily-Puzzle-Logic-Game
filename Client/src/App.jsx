import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";

import { loadUserStats, logout, processSyncQueue } from "./features/user/userSlice";
import { loadPuzzle } from "./features/puzzle/puzzleSlice";

import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import CalendarView from "./components/CalendarView";

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, token, streak, totalPoints } = useSelector((state) => state.user);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    dispatch(loadUserStats());
    dispatch(loadPuzzle({ date: dayjs().format("YYYY-MM-DD") }));

    // Attempt to process sync queue when online
    dispatch(processSyncQueue());
    const handleOnline = () => dispatch(processSyncQueue());
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [dispatch]);

  // Handle protected routes
  const ProtectedRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pb-10 font-sans">
      {/* Global Header */}
      <div className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center max-w-4xl mt-4 rounded-xl mx-4 z-50 relative">
        <Link to="/dashboard" className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3 no-underline">
          🧠 Logic Looper
        </Link>

        {token && (
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowCalendar(true)}
              className="text-2xl p-2 rounded-full hover:bg-gray-100 transition"
              title="Calendar"
            >
              📅
            </button>

            <div className="hidden sm:flex gap-4 border-r border-gray-300 pr-4">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 uppercase font-bold">Streak</span>
                <span className="text-orange-500 font-bold text-xl">🔥 {streak}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 uppercase font-bold">Score</span>
                <span className="text-blue-600 font-bold text-xl">⭐ {totalPoints}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-lg transition">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                  👤
                </div>
                <span className="text-sm font-semibold text-gray-600 hidden md:block">
                  {user?.name || "User"}
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 flex flex-col items-center pt-6">
        <Routes>
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/game" element={
            <ProtectedRoute>
              <Game />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>

      {showCalendar && (
        <CalendarView
          onClose={() => setShowCalendar(false)}
          onSelectDate={(date) => {
            dispatch(loadPuzzle({ date }));
            setShowCalendar(false);
          }}
        />
      )}
    </div>
  );
}
