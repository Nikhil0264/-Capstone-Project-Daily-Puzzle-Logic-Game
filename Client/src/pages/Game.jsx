import React from 'react';
import PuzzleBoard from '../components/PuzzleBoard';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Game = () => {
  const { puzzle, difficulty } = useSelector((state) => state.puzzle);

  return (
    <div className="flex flex-col items-center w-full min-h-screen p-4 pb-20">
      {}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6">
        <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-semibold flex items-center gap-1">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-gray-800">
          Daily Puzzle
        </h1>
        <div className="w-16">
          {}
        </div>
      </div>

      {}
      <div className="mb-2">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${difficulty === 'hard' ? 'bg-red-100 text-red-700' :
            difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
          }`}>
          {difficulty}
        </span>
      </div>

      {}
      <PuzzleBoard />

      {}
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
