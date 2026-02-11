import { generatePuzzle } from "../../core/PuzzleChoice/puzzle";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// ✅ Async Thunk (even if sync today, future-safe)
export const loadPuzzle = createAsyncThunk(
    "puzzle/loadPuzzle",
    async (difficulty, thunkAPI) => {
        try {
            const puzzle = generatePuzzle(difficulty);
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
} = puzzleSlice.actions;

export default puzzleSlice.reducer;
