import { generatePuzzle } from "../../core/PuzzleChoice/puzzle";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getPuzzleState, savePuzzleState, clearPuzzleState } from "../../localstorage/indexDB";
import { createSeededRandom } from "../../core/random";
import dayjs from "dayjs";
import { generateDailySeed } from "../../core/seed";


export const loadPuzzle = createAsyncThunk(
    "puzzle/loadPuzzle",
    async (args, thunkAPI) => {
        try {
            const difficulty = typeof args === 'object' ? args.difficulty : (args || "easy");
            const type = typeof args === 'object' ? args.type : 'binary';
            const date = (typeof args === 'object' && args.date) ? args.date : dayjs().format("YYYY-MM-DD");

            const today = dayjs().format("YYYY-MM-DD");
            if (dayjs(date).isAfter(dayjs(today), 'day')) {
                return thunkAPI.rejectWithValue("Cannot preserve future puzzles");
            }

            const savedState = await getPuzzleState();


            if (savedState && savedState.puzzle) {

                const seedForDate = generateDailySeed(date);
                if (savedState.puzzle.id.startsWith(seedForDate.toString()) && savedState.puzzle.type === type) {
                    return savedState;
                }
            }

            const puzzle = generatePuzzle(difficulty, type, date);

            const initialStatePayload = {
                puzzle,
                grid: puzzle.grid.map(row => [...row]),
                difficulty,
                isSolved: false,
                startTime: Date.now(),
                elapsedTime: 0,
                score: 0,
                hintsUsed: 0,
                isGameOver: false,
                date: date
            };

            await savePuzzleState(initialStatePayload);
            return initialStatePayload;

        } catch (error) {
            return thunkAPI.rejectWithValue("Failed to load puzzle", error);
        }
    }
);


export const saveProgress = createAsyncThunk(
    "puzzle/saveProgress",
    async (_, { getState }) => {
        const { puzzle } = getState();
        await savePuzzleState(puzzle);
    }
);

const initialState = {
    puzzle: null,
    difficulty: "easy",
    grid: [],
    isSolved: false,
    error: null,
    startTime: null,
    elapsedTime: 0,
    score: 0,
    loading: false,
    cellStatus: [],
    hintsUsed: 0,
    isGameOver: false,
};

const puzzleSlice = createSlice({
    name: "puzzle",
    initialState,
    reducers: {
        updateCell: (state, action) => {
            if (state.isSolved) return;
            const { row, col, value } = action.payload;
            state.grid[row][col] = value;

            if (state.cellStatus[row] && state.cellStatus[row][col]) {
                state.cellStatus[row][col] = null;
            }
        },

        updateTimer: (state) => {
            if (!state.isSolved && !state.isGameOver) {
                state.elapsedTime += 1;
            }
        },

        useHint: (state) => {
            if (state.isSolved) return;
            if (state.hintsUsed >= 3) return; 
            const candidates = [];
            state.grid.forEach((row, rIndex) => {
                row.forEach((cell, cIndex) => {
                    const correctVal = state.puzzle.solution[rIndex][cIndex];
                    if (cell === "" || Number(cell) !== correctVal) {
                        candidates.push({ r: rIndex, c: cIndex, val: correctVal });
                    }
                });
            });

            if (candidates.length > 0) {
                
                
                const randomIndex = Math.floor(Math.random() * candidates.length);
                const hint = candidates[randomIndex];

                state.grid[hint.r][hint.c] = hint.val;
                state.hintsUsed += 1;

                
                
            }
        },

        checkSolution: (state) => {
            if (!state.puzzle) return;

            let allCorrect = true;
            const newCellStatus = state.grid.map((row, i) =>
                row.map((cell, j) => {
                    if (cell === "") {
                        allCorrect = false;
                        return null; 
                    }
                    if (Number(cell) === state.puzzle.solution[i][j]) {
                        return "correct";
                    } else {
                        allCorrect = false;
                        return "wrong";
                    }
                })
            );

            state.cellStatus = newCellStatus;

            if (allCorrect) {
                state.isSolved = true;
                state.isGameOver = true;

                
                
                
                
                const baseScore = 1000;
                const timePenalty = state.elapsedTime;
                const hintPenalty = state.hintsUsed * 100;

                state.score = Math.max(0, baseScore - timePenalty - hintPenalty);
            }
        },

        resetPuzzle: (state) => {
            
            if (!state.puzzle) return;

            state.grid = state.puzzle.grid.map(row => [...row]);
            state.cellStatus = state.puzzle.grid.map(row => row.map(() => null));
            state.isSolved = false;
            state.isGameOver = false;
            state.startTime = Date.now();
            state.elapsedTime = 0;
            state.score = 0;
            state.hintsUsed = 0;
            clearPuzzleState(); 
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
                
                const payload = action.payload;
                state.puzzle = payload.puzzle;
                state.grid = payload.grid;
                state.difficulty = payload.difficulty;
                state.isSolved = payload.isSolved;
                state.startTime = payload.startTime || Date.now(); 
                state.elapsedTime = payload.elapsedTime || 0;
                state.score = payload.score || 0;
                state.hintsUsed = payload.hintsUsed || 0;
                state.isGameOver = payload.isGameOver || false;

                
                if (!state.cellStatus || state.cellStatus.length === 0) {
                    state.cellStatus = payload.grid.map(row => row.map(() => null));
                }
            })
            .addCase(loadPuzzle.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    updateCell,
    resetPuzzle,
    checkSolution,
    updateTimer,
    useHint
} = puzzleSlice.actions;

export default puzzleSlice.reducer;
