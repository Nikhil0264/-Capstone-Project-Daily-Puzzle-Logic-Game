import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadPuzzle } from "./features/puzzle/puzzleSlice";
import { loadUserStats, logout, processSyncQueue } from "./features/user/userSlice";


export default function App() {
  const dispatch = useDispatch();
  

  useEffect(() => {
    dispatch(loadUserStats());
    
    dispatch(loadPuzzle({ date: dayjs().format("YYYY-MM-DD") }));

    
    dispatch(processSyncQueue());

    
    const handleOnline = () => dispatch(processSyncQueue());
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [dispatch]);

  const handleTypeChange = (type) => {
    setPuzzleType(type);
  };

  const handleDateSelect = (date) => {
    
    dispatch(loadPuzzle({ date }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pb-10">
      {}
      <div className="w-full bg-white shadow-sm py-4 px-6 flex justify-between items-center max-w-4xl mt-4 rounded-xl mx-4">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
          🧠 Logic Looper
          <button
            onClick={() => setShowCalendar(true)}
            className="text-xl p-1 rounded-full hover:bg-gray-200 transition"
            title="Calendar"
          >
            📅
          </button>
        </h1>

        <div className="flex gap-6 items-center">
          {}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 uppercase font-bold">Streak</span>
              <span className="text-orange-500 font-bold text-xl">🔥 {streak}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 uppercase font-bold">Score</span>
              <span className="text-blue-600 font-bold text-xl">⭐ {totalPoints}</span>
            </div>
          </div>

          {}
          {token ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600 hidden sm:block">
                {user?.name || "User"}
              </span>
              <button
                onClick={() => dispatch(logout())}
                className="text-sm text-red-500 hover:text-red-700 font-semibold border border-red-200 px-3 py-1 rounded-md"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700"
            >
              Login to Sync
            </Link>
          )}
        </div>
      </div>

      {}
      <div className="bg-white p-1 rounded-lg shadow-sm mt-6 flex gap-1">
        <button
          onClick={() => handleTypeChange('binary')}
          className={`px-4 py-2 rounded-md font-semibold text-sm transition ${puzzleType === 'binary' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Binary Grid
        </button>
        <button
          onClick={() => handleTypeChange('sudoku')}
          className={`px-4 py-2 rounded-md font-semibold text-sm transition ${puzzleType === 'sudoku' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          Mini Sudoku
        </button>
      </div>

      <PuzzleBoard />

      <Heatmap />
    </div>
  );
}
