import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  updateCell,
  checkSolution,
  resetPuzzle,
  updateTimer,
  applyHint,
  saveProgress
} from '../features/puzzle/puzzleSlice'
import { completePuzzle } from '../features/user/userSlice'
import dayjs from 'dayjs'

const PuzzleBoard = () => {
  const dispatch = useDispatch()
  const {
    grid,
    puzzle,
    isSolved,
    cellStatus,
    score,
    elapsedTime,
    hintsUsed,
    date
  } = useSelector((state) => state.puzzle)

  const hasDispatchedCompletion = useRef(false)
  const completionRef = useRef(null)

  const displayDate = date
    ? dayjs(date).format("dddd, MMM D, YYYY")
    : dayjs().format("dddd, MMM D, YYYY")

  /* =============================
     TIMER
  ============================== */
  useEffect(() => {
    if (isSolved || !puzzle) return

    const interval = setInterval(() => {
      dispatch(updateTimer())
    }, 1000)

    return () => clearInterval(interval)
  }, [isSolved, puzzle?.id, dispatch])

  /* =============================
     AUTO SAVE
  ============================== */
  useEffect(() => {
    if (!puzzle || isSolved) return

    const saveTimer = setTimeout(() => {
      dispatch(saveProgress())
    }, 5000)

    return () => clearTimeout(saveTimer)
  }, [grid, score, hintsUsed, isSolved, puzzle?.id, dispatch])

  /* =============================
     COMPLETION HANDLER
  ============================== */
  useEffect(() => {
    if (!isSolved) {
      hasDispatchedCompletion.current = false
      return
    }

    if (hasDispatchedCompletion.current) return

    hasDispatchedCompletion.current = true

    if (completionRef.current) {
      completionRef.current.classList.add('animate-bounce')
    }

    dispatch(
      completePuzzle({
        score,
        date: dayjs().format("YYYY-MM-DD"),
        timeTaken: elapsedTime,
        puzzleId: puzzle?.id ?? "unknown"
      })
    )
  }, [isSolved, score, elapsedTime, puzzle?.id, dispatch])

  /* =============================
     CELL CLICK LOGIC (FIXED)
  ============================== */
  const handleCellClick = (r, c) => {
    if (isSolved) return

    const isSudoku = puzzle?.type === 'sudoku'
    const currentVal = grid[r][c]
    let nextVal

    if (isSudoku) {
      // "" → 1 → 2 → 3 → 4 → ""
      if (currentVal === "") nextVal = 1
      else if (currentVal === 4) nextVal = ""
      else nextVal = Number(currentVal) + 1
    } else {
      // "" → 0 → 1 → ""
      if (currentVal === "") nextVal = 0
      else if (currentVal === 0) nextVal = 1
      else nextVal = ""
    }

    dispatch(updateCell({ row: r, col: c, value: nextVal }))
  }

  /* =============================
     CHECK LOGIC (CLEANER)
  ============================== */
  const handleCheck = () => {
    if (!grid?.length) {
      alert("Puzzle not loaded yet")
      return
    }

    const allFilled = grid.every(row =>
      row.every(cell => cell !== "" && cell !== null)
    )

    if (!allFilled) {
      alert("Please fill all empty cells before checking!")
      return
    }

    dispatch(checkSolution())
  }

  const handleReset = () => {
    if (window.confirm("Are you sure? This will reset your progress for today!")) {
      dispatch(resetPuzzle())
    }
  }

  const handleHint = () => {
    dispatch(applyHint())
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!puzzle) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin text-4xl mb-2">🧩</div>
        <p className="text-gray-600 font-semibold">Loading puzzle...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center mt-6 w-full max-w-md px-4">

      {/* Date + Stats */}
      <h2 className="text-xl font-bold text-gray-800 mb-2">
        {displayDate}
      </h2>

      <div className="w-full flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="text-gray-700 font-semibold">
          ⏱️ {formatTime(elapsedTime)}
        </div>
        <div className="text-gray-700 font-semibold">
          💡 Hints: {hintsUsed} / 3
        </div>
      </div>

      {/* Status Message */}
      <div className="mb-4 text-center w-full">
        {isSolved ? (
          <div
            ref={completionRef}
            className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-lg relative overflow-hidden"
          >
            <strong className="font-bold block">
              🎉 Puzzle Solved! 🎉
            </strong>
            <span className="block font-semibold text-lg mt-1">
              Score: {score} 🌟
            </span>
          </div>
        ) : (
          <div className="text-gray-600 text-sm">
            {puzzle?.type === 'sudoku'
              ? "Fill the grid with 1-4. Each number appears once per row, column, and 2×2 box."
              : "Fill with 0s and 1s. No three in a row. All rows/columns must be unique."}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-1 bg-gray-200 p-2 rounded-lg items-center mb-6">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1">
            {row.map((cell, colIndex) => {
              const isFixed = puzzle.grid[rowIndex][colIndex] !== ""
              const status = cellStatus[rowIndex]?.[colIndex]

              let bgColor = "bg-white"
              let textColor = "text-gray-800"
              let borderColor = "border-gray-200"
              let hoverClass = "hover:bg-blue-50"

              if (isFixed) {
                bgColor = "bg-gray-300"
                textColor = "text-gray-700 font-bold"
                borderColor = "border-gray-400"
                hoverClass = ""
              } else if (status === "correct") {
                bgColor = "bg-green-100"
                textColor = "text-green-800 font-semibold"
                borderColor = "border-green-500"
              } else if (status === "wrong") {
                bgColor = "bg-red-100"
                textColor = "text-red-800 font-semibold"
                borderColor = "border-red-500"
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
                    cursor-pointer transition select-none transform hover:scale-105
                    ${bgColor} ${textColor} ${borderColor}
                    ${!isFixed ? hoverClass : 'cursor-default hover:scale-100'}
                  `}
                >
                  {cell === "" ? "" : cell}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 sm:gap-4 w-full justify-center flex-wrap mb-4">
        <button
          onClick={handleHint}
          disabled={isSolved || hintsUsed >= 3}
          className={`px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg font-semibold shadow-sm hover:bg-yellow-200 active:scale-95 transition-all ${(isSolved || hintsUsed >= 3) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          💡 Hint ({3 - hintsUsed})
        </button>

        <button
          onClick={handleCheck}
          disabled={isSolved}
          className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all ${isSolved ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          ✓ Check
        </button>

        <button
          onClick={handleReset}
          disabled={isSolved}
          className={`px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow-sm hover:bg-gray-300 active:scale-95 transition-all ${isSolved ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          🔄 Reset
        </button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        💡 Tip: You have 3 hints per puzzle.
      </div>
    </div>
  )
}

export default PuzzleBoard
