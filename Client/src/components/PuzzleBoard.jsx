import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { markSolved, updateCell } from '../features/puzzle/puzzleSlice';
import { validateGrid } from '../core/validator';

const PuzzleBoard = () => {
    const dispatch = useDispatch();
    const {grid,puzzle,isSolved} = useSelector((state)=>state.puzzle);

    if(!puzzle){
        return <div>No puzzle loaded</div>
    };

    const handleChange = (row,col,value)=>{
        dispatch(updateCell({row,col,value:Number(value)}));
    }

    const handleCheck = ()=>{
        if(validateGrid(grid,puzzle.solution)){
            dispatch(markSolved());
            alert("Congratulations! Puzzle Solved.");
        }else{
            alert("Incorrect solution. Please try again.");
        }
    }

  return (
     <div className="flex flex-col items-center mt-10">
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
                    ${isSolved ? "border-green-500" : "border-gray-400"}
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
    </div>
  )
}

export default PuzzleBoard;
