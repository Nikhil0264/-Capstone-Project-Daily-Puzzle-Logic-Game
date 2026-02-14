import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateCell, checkSolution, resetPuzzle, updateTimer, useHint, saveProgress } from '../features/puzzle/puzzleSlice';
import { completePuzzle } from '../features/user/userSlice';
import dayjs from 'dayjs';

const PuzzleBoard = () => {
  const dispatch = useDispatch();
  const { grid, puzzle, isSolved, cellStatus, score, elapsedTime, hintsUsed, date } =
    useSelector((state) => state.puzzle);

  const hasDispatchedCompletion = useRef(false);

  
  const displayDate = date ? dayjs(date).format("dddd, MMM D, YYYY") : dayjs().format("dddd, MMM D, YYYY");


  useEffect(() => {
    let interval;
    if (!isSolved && puzzle) {
      interval = setInterval(() => {
        dispatch(updateTimer());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSolved, puzzle, dispatch]);


  useEffect(() => {
    if (puzzle) {
      dispatch(saveProgress());
    }
  }, [grid, isSolved, score, hintsUsed, dispatch]);


  useEffect(() => {
    if (isSolved && !hasDispatchedCompletion.current) {
      hasDispatchedCompletion.current = true;
      const today = dayjs().format("YYYY-MM-DD");
      dispatch(completePuzzle({
        score,
        date: today,
        timeTaken: elapsedTime,
        puzzleId: puzzle ? puzzle.id : "unknown"
      }));
    }
    if (!isSolved) {
      hasDispatchedCompletion.current = false;
    }
  }, [isSolved, score, dispatch, elapsedTime, puzzle]);

  if (!puzzle) {
    return <div>No puzzle loaded</div>
  };

  const handleCellClick = (r, c) => {
    if (grid[r][c] !== "" || isSolved) return;

    
    const isSudoku = puzzle && puzzle.type === 'sudoku';
    const maxVal = isSudoku ? 4 : 1;

    
    

    
    
    

    let currentVal = grid[r][c] === "" ? 0 : Number(grid[r][c]);
    let nextVal;

    if (isSudoku) {
      nextVal = currentVal + 1;
      if (nextVal > 4) nextVal = ""; 
    } else {
      
      if (grid[r][c] === "") nextVal = 0;
      else if (grid[r][c] === 0) nextVal = 1;
      else nextVal = "";
    }

    dispatch(updateCell({ row: r, col: c, value: nextVal === "" ? "" : nextVal }));
  };

  const handleCheck = () => {
    dispatch(checkSolution());
  };

  const handleReset = () => {
    if (confirm("Are you sure? This will reset your progress for today!")) {
      dispatch(resetPuzzle());
    }
  };

  const handleHint = () => {
    dispatch(useHint());
  };


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center mt-6 w-full max-w-md px-4">
      {}
      <h2 className="text-xl font-bold text-gray-800 mb-2">{displayDate}</h2>
      <div className="w-full flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
        <div className="text-gray-700 font-semibold">
          ⏱️ {formatTime(elapsedTime)}
        </div>
        <div className="text-gray-700 font-semibold">
          💡 Hints: {hintsUsed}
        </div>
      </div>

      <div className="mb-4 text-center">
        {isSolved ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <strong className="font-bold">🎉 Puzzle Solved!</strong>
            <span className="block sm:inline"> Score: {score}</span>
          </div>
        ) : (
          <div className="text-gray-600 text-sm">
            {puzzle && puzzle.type === 'sudoku'
              ? "Fill the grid with 1-4. Each number must appear once per row, column, and 2x2 box."
              : "Fill the grid with 0s and 1s. No three 0s or 1s in a row/col."}
          </div>
        )}
      </div>

      {}
      <div className="flex flex-col gap-1 bg-gray-200 p-2 rounded-lg items-center">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((cell, colIndex) => {
              const isFixed = puzzle.grid[rowIndex][colIndex] !== "";
              const status = cellStatus[rowIndex]?.[colIndex];

              let bgColor = "bg-white";
              let textColor = "text-gray-800";
              let borderColor = "border-gray-200";
              let hoverClass = "hover:bg-blue-50";

              if (isFixed) {
                bgColor = "bg-gray-300";
                textColor = "text-gray-700 font-bold";
                borderColor = "border-gray-400";
                hoverClass = "";
              } else if (status === "correct") {
                bgColor = "bg-green-100";
                textColor = "text-green-800";
                borderColor = "border-green-500";
              } else if (status === "wrong") {
                bgColor = "bg-red-100";
                textColor = "text-red-800";
                borderColor = "border-red-500";
              }

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => !isFixed && handleCellClick(rowIndex, colIndex)}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12 
                    border-2 rounded-lg 
                    flex items-center justify-center 
                    text-xl sm:text-2xl 
                    cursor-pointer transition select-none
                    ${bgColor} ${textColor} ${borderColor} 
                    ${!isFixed ? hoverClass : 'cursor-default'}
                  `}
                >
                  {cell === "" ? "" : cell}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {}
      <div className="flex gap-4 mt-8 w-full justify-center">
        <button
          onClick={handleHint}
          disabled={isSolved || hintsUsed >= 3}
          className={`flex-1 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg font-semibold shadow-sm hover:bg-yellow-200 transition-colors ${(isSolved || hintsUsed >= 3) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          💡 Hint ({3 - hintsUsed})
        </button>

        <button
          onClick={handleCheck}
          disabled={isSolved}
          className={`flex-[2] px-6 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-transform active:scale-95 ${isSolved ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Check
        </button>

        <button
          onClick={handleReset}
          className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow-sm hover:bg-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default PuzzleBoard;
