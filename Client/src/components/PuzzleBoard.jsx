import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateCell ,checkSolution ,resetPuzzle } from '../features/puzzle/puzzleSlice';


const PuzzleBoard = () => {
    const dispatch = useDispatch();
    const { grid, puzzle, isSolved, cellStatus, score, startTime } =
  useSelector((state) => state.puzzle);


    if(!puzzle){
        return <div>No puzzle loaded</div>
    };

    const handleChange = (row,col,value)=>{
        dispatch(updateCell({row,col,value:Number(value)}));
    }

    const handleCheck = () => {
      dispatch(checkSolution());
    };

    const handleReset = () => {
      dispatch(resetPuzzle());
    };

  return (
     <div className="flex flex-col items-center mt-10">
     <div className="mb-4 text-center">
          {isSolved ? (
            <div className="text-green-600 font-bold text-xl">
              🎉 Puzzle Solved! Score: {score}
            </div>
          ) : (
            <div className="text-gray-600">
              Solve the puzzle correctly to win!
            </div>
          )}
        </div>
          {!isSolved && startTime && (
              <div className="text-sm text-gray-500 mt-1">
                Time running...
              </div>
            )}

      <div className="grid gap-2">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((cell, colIndex) => {
              const isFixed = puzzle.grid[rowIndex][colIndex] !== "";
              return (
                <input
                key={colIndex}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={cell}
                disabled={isFixed}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === "0" || val === "1" || val === "") {
                    handleChange(rowIndex, colIndex, val === "" ? "" : Number(val));
                    }
                }}
                className={`
                    w-14 h-14 
                    text-xl font-bold 
                    text-center 
                    border-2 
                    rounded-lg 
                    transition-all 
                    duration-200
                    focus:outline-none
                    focus:ring-2 focus:ring-blue-400
                    ${isFixed ? "bg-gray-300 cursor-not-allowed" : "bg-white hover:bg-blue-50"}
                    ${cellStatus[rowIndex]?.[colIndex] === "correct" ? "border-green-500 bg-green-100" : ""}
                    ${cellStatus[rowIndex]?.[colIndex] === "wrong" ? "border-red-500 bg-red-100" : ""}
                    ${!cellStatus[rowIndex]?.[colIndex] ? "border-gray-400" : ""}
                `}
                />

              );
            })}
          </div>
        ))}
      </div>

      <button
        onClick={handleCheck}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Check Solution
      </button>
      <button
        onClick={handleReset}
        className="mt-3 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
        Reset Puzzle
      </button>

    </div>
  )
}

export default PuzzleBoard;
