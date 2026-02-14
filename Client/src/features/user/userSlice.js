import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserStats, saveUserStats, saveDailyScore, addToSyncQueue, getSyncQueue, removeFromSyncQueue } from "../../localstorage/indexDB";
import dayjs from "dayjs";
import { authAPI, setAuthToken, scoreAPI } from "../../services/api";



export const processSyncQueue = createAsyncThunk(
  "user/processSyncQueue",
  async (_, { getItem, dispatch }) => {
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    console.log(`Processing ${queue.length} offline scores...`);

    for (const item of queue) {
      try {
        
        
        await scoreAPI.submitScore({
          score: item.score,
          date: item.date,
          timeTaken: item.timeTaken,
          puzzleId: item.puzzleId
        });
        await removeFromSyncQueue(item.id);
        console.log(`Synced offline score for ${item.date}`);
      } catch (err) {
        console.error(`Failed to sync item ${item.id}`, err);
        
        
      }
    }
  }
);

export const completePuzzle = createAsyncThunk(
  "user/completePuzzle",
  async ({ score, date, timeTaken, puzzleId }, { getState, dispatch }) => {
    const { user } = getState();
    const today = dayjs().format("YYYY-MM-DD");
    const isToday = date === today;

    
    let newStreak = user.streak;
    const lastPlayed = user.lastPlayed;

    if (isToday) {
      if (lastPlayed === dayjs().subtract(1, 'day').format("YYYY-MM-DD")) {
        newStreak += 1;
      } else if (lastPlayed === today) {
        
      } else {
        newStreak = 1;
      }
    }

    const newStats = {
      ...user,
      streak: newStreak,
      lastPlayed: today,
      totalPoints: user.totalPoints + score,
      history: {
        ...user.history,
        [date]: { score, solved: true, timestamp: Date.now() }
      }
    };

    await saveUserStats(newStats);

    
    if (user.token) {
      try {
        await scoreAPI.submitScore({
          score,
          date,
          timeTaken: timeTaken || 0,
          puzzleId: puzzleId || "daily-" + date
        });
        console.log("Score synced to backend");
      } catch (err) {
        console.error("Backend sync failed, saving to queue:", err);
        
        await addToSyncQueue({
          score,
          date,
          timeTaken,
          puzzleId,
          userId: user.user?.id
        });
      }
    } else {
      
      
    }

    return newStats;
  }
);



const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      setAuthToken(null);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserStats.fulfilled, (state, action) => {
        state.streak = action.payload.streak || 0;
        state.lastPlayed = action.payload.lastPlayed;
        state.totalPoints = action.payload.totalPoints || 0;
        state.history = action.payload.history || {};
        const savedToken = localStorage.getItem("token");
        if (savedToken) state.token = savedToken;
        state.loading = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      
      .addCase(completePuzzle.fulfilled, (state, action) => {
        state.streak = action.payload.streak;
        state.lastPlayed = action.payload.lastPlayed;
        state.totalPoints = action.payload.totalPoints;
        state.history = action.payload.history;
      });
  }
});

export const { logout } = userSlice.actions;

export default userSlice.reducer;
