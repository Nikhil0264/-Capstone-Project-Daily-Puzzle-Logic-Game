import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import dayjs from "dayjs";

import { loadUserStats, logout, processSyncQueue, guestLogin } from "./features/user/userSlice";
import { loadPuzzle } from "./features/puzzle/puzzleSlice";

import Dashboard from "./pages/Dashboard";
import Game from "./pages/Game";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import CalendarView from "./components/CalendarView";

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, token, streak, totalPoints, isGuest } = useSelector((state) => state.user);
  const [showCalendar, setShowCalendar] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize app - load user stats or guest mode
    const initApp = async () => {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        await dispatch(loadUserStats());
      } else {
        // Check if user already has a session (guest or logged in)
        await dispatch(loadUserStats());
      }
      setInitialized(true);
    };

    initApp();

    // Load today's puzzle
    if (initialized) {
      dispatch(loadPuzzle({ date: dayjs().format("YYYY-MM-DD") }));

      // Process sync queue when online
      dispatch(processSyncQueue());
      const handleOnline = () => {
        dispatch(processSyncQueue());
      };
      
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }
  }, [dispatch, initialized]);

  // Allow access to dashboard for both logged-in and guest users
  const isAuthenticated = token || isGuest;

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logout());
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pb-10 font-sans">
      {/* Global Header */}
      <div className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center max-w-4xl mt-4 rounded-xl mx-4 z-50 relative">
        <Link 
          to={isAuthenticated ? "/dashboard" : "/login"} 
          className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3 no-underline hover:text-blue-600 transition"
        >
          🧠 Logic Looper
        </Link>

        {isAuthenticated && (
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowCalendar(true)}
              className="text-2xl p-2 rounded-full hover:bg-gray-100 transition"
              title="Calendar"
              aria-label="Open calendar"
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
              {!isGuest && (
                <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-lg transition">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold">
                    {user?.name?.[0]?.toUpperCase() || "👤"}
                  </div>
                  <span className="text-sm font-semibold text-gray-600 hidden md:block">
                    {user?.name || "User"}
                  </span>
                </Link>
              )}
              {isGuest && (
                <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  👤 Guest
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm font-semibold text-gray-600 hover:text-red-600 transition p-2"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 flex flex-col items-center pt-6">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />

          <Route path="/dashboard" element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          } />

          <Route path="/game" element={
            isAuthenticated ? <Game /> : <Navigate to="/login" replace />
          } />

          <Route path="/profile" element={
            isAuthenticated && !isGuest ? <Profile /> : <Navigate to="/dashboard" replace />
          } />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>

      {/* Calendar Modal */}
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
