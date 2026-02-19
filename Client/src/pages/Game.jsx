import React, { useState } from 'react';
import PuzzleBoard from '../components/PuzzleBoard';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { loadPuzzle } from '../features/puzzle/puzzleSlice';
import dayjs from 'dayjs';

const Game = () => {
  const dispatch = useDispatch();
  const { puzzle, difficulty, isPractice, date } = useSelector((state) => state.puzzle);
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty || 'easy');

  const handleDifficultyChange = (newDifficulty) => {
    setSelectedDifficulty(newDifficulty);
    dispatch(loadPuzzle({
      difficulty: newDifficulty,
      isPractice,
      date: date || dayjs().format("YYYY-MM-DD")
    }));
  };

  const togglePractice = () => {
    dispatch(loadPuzzle({
      difficulty: selectedDifficulty,
      isPractice: !isPractice,
      date: dayjs().format("YYYY-MM-DD")
    }));
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4 pb-20">
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-semibold flex items-center gap-1">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-gray-800">
          {isPractice ? "Practice Mode" : "Daily Puzzle"}
        </h1>
        <button
          onClick={togglePractice}
          className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition"
        >
          {isPractice ? "Switch to Daily" : "Switch to Practice"}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['easy', 'medium', 'hard'].map((diff) => (
          <button
            key={diff}
            onClick={() => handleDifficultyChange(diff)}
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition ${selectedDifficulty === diff
                ? (diff === 'hard' ? 'bg-red-600 text-white' : diff === 'medium' ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white')
                : (diff === 'hard' ? 'bg-red-100 text-red-700' : diff === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')
              }`}
          >
            {diff}
          </button>
        ))}
      </div>

      <PuzzleBoard />

      <div className="mt-8 max-w-md text-center text-sm text-gray-500 bg-white p-4 rounded-xl shadow-sm">
        <p className="font-semibold mb-1">How to play:</p>
        {puzzle && puzzle.type === 'sudoku' ? (
          <p>Fill the 4x4 grid with numbers 1-4 so that each row, column, and 2x2 box contains all numbers exactly once.</p>
        ) : (
          <p>Fill the grid with 0s and 1s. No more than two of the same number adjacent to each other. Rows and columns must be unique.</p>
        )}
      </div>
    </div>
  );
};

export default Game;
