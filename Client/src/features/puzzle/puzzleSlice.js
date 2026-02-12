import { generatePuzzle } from "../../core/PuzzleChoice/puzzle";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getPuzzle, savePuzzle } from "../../localstorage/indexDB";
// ✅ Async Thunk (even if sync today, future-safe)
export const loadPuzzle = createAsyncThunk(
    "puzzle/loadPuzzle",
    async (difficulty, thunkAPI) => {
        try {
            const cached = await getPuzzle();
            if (cached) return cached;
            const puzzle = generatePuzzle(difficulty);
             await savePuzzle(puzzle);
            return puzzle;
        } catch (error) {
            return thunkAPI.rejectWithValue("Failed to generate puzzle",error);
        }
    }
);

const initialState = {
    puzzle: null,
    difficulty: "easy",
    grid: [],
    isSolved: false,
    error: null,
    startTime: null,
    endTime: null,
    score: 0,
    loading: false,
    cellStatus: [],
};

const puzzleSlice = createSlice({
    name: "puzzle",
    initialState,
    reducers: {
        updateCell: (state, action) => {
            const { row, col, value } = action.payload;
            state.grid[row][col] = value;
        },

        markSolved: (state) => {
            state.isSolved = true;
            state.endTime = Date.now();

            const timeTaken =
                (state.endTime - state.startTime) / 1000;

            state.score = Math.max(
                0,
                Math.round(1000 - timeTaken * 10)
            );
        },

        resetPuzzle: (state) => {
            state.puzzle = null;
            state.grid = [];
            state.isSolved = false;
            state.startTime = null;
            state.endTime = null;
            state.score = 0;
            state.error = null;
        },

        checkSolution: (state) => {
            let allCorrect = true;

            state.cellStatus = state.grid.map((row, i) =>
                row.map((cell, j) => {
                    if (Number(cell) === state.puzzle.solution[i][j]) {
                        return "correct";
                    } else {
                        allCorrect = false;
                        return "wrong";
                    }
                })
            );

            if (allCorrect) {
                state.isSolved = true;
                state.endTime = Date.now();

                const timeTaken =
                    (state.endTime - state.startTime) / 1000;

                state.score = Math.max(
                    0,
                    Math.round(1000 - timeTaken * 10)
                );
            }
    },

    },

    extraReducers: (builder) => {
        builder
            .addCase(loadPuzzle.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadPuzzle.fulfilled, (state, action) => {
                state.loading = false;
                state.puzzle = action.payload;
                state.grid = action.payload.grid.map(row => [...row]);
                state.cellStatus = action.payload.grid.map(row =>
                    row.map(() => null)
                );
                state.difficulty = action.payload.difficulty;
                state.isSolved = false;
                state.startTime = Date.now();
                state.endTime = null;
                state.score = 0;
            })

            .addCase(loadPuzzle.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    updateCell,
    markSolved,
    resetPuzzle,
     checkSolution,
} = puzzleSlice.actions;

export default puzzleSlice.reducer;
