import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserStats, saveUserStats, saveDailyScore, addToSyncQueue, getSyncQueueUnsynced, removeFromSyncQueue, markSyncQueueItemSynced, getAllDailyScores } from "../../localstorage/indexDB";
import dayjs from "dayjs";
import { authAPI, setAuthToken, scoreAPI, userAPI } from "../../services/api";

export const processSyncQueue = createAsyncThunk(
  "user/processSyncQueue",
  async (_, { rejectWithValue }) => {
    try {
      const queue = await getSyncQueueUnsynced();
      if (queue.length === 0) return { synced: 0 };

      let syncedCount = 0;

      for (const item of queue) {
        try {
          await scoreAPI.submitScore({
            score: item.score,
            date: item.date,
            timeTaken: item.timeTaken,
            puzzleId: item.puzzleId
          });
          await markSyncQueueItemSynced(item.id);
          syncedCount++;
        } catch (err) {
          console.warn(`Failed to sync item ${item.id}:`, err.message);
          // Don't continue if sync fails
        }
      }

      return { synced: syncedCount };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const completePuzzle = createAsyncThunk(
  "user/completePuzzle",
  async ({ score, date, timeTaken, puzzleId }, { getState }) => {
    const { user } = getState();
    const today = dayjs().format("YYYY-MM-DD");
    const isToday = date === today;

    let newStreak = user.streak || 0;
    const lastPlayed = user.lastPlayed;

    if (isToday) {
      if (lastPlayed && lastPlayed === dayjs().subtract(1, 'day').format("YYYY-MM-DD")) {
        // Continuing the streak
        newStreak = (user.streak || 0) + 1;
      } else if (lastPlayed === today) {
        // Already played today, don't increment
        newStreak = user.streak || 0;
      } else {
        // First time or streak broken, start new streak
        newStreak = 1;
      }
    }

    const newStats = {
      user: user.user || { name: "Guest", id: "guest" },
      token: user.token,
      streak: newStreak,
      lastPlayed: today,
      totalPoints: (user.totalPoints || 0) + score,
      history: {
        ...user.history,
        [date]: { 
          score, 
          solved: true, 
          timeTaken,
          timestamp: Date.now() 
        }
      }
    };

    // Save to local storage
    await saveUserStats(newStats);
    await saveDailyScore(date, {
      score,
      timeTaken,
      puzzleId,
      solved: true
    });

    // Try to sync if logged in
    if (user.token) {
      try {
        await scoreAPI.submitScore({
          score,
          date,
          timeTaken: timeTaken || 0,
          puzzleId: puzzleId || "daily-" + date
        });
      } catch (err) {
        console.warn("Backend sync failed, queued for later:", err.message);
        await addToSyncQueue({
          score,
          date,
          timeTaken,
          puzzleId,
          userId: user.user?.id
        });
      }
    }

    return newStats;
  }
);

export const loadUserStats = createAsyncThunk(
  "user/loadUserStats",
  async (_, { rejectWithValue }) => {
    try {
      const localStats = await getUserStats();
      const token = localStorage.getItem("token");
      
      if (token) {
        try {
          const profile = await userAPI.getProfile();
          // Merge local and remote stats, preferring local if more recent
          return {
            user: profile.user || profile,
            token,
            streak: profile.streakCount || localStats?.streak || 0,
            totalPoints: profile.totalPoints || localStats?.totalPoints || 0,
            lastPlayed: profile.lastPlayed || localStats?.lastPlayed,
            history: localStats?.history || {}
          };
        } catch (apiError) {
          console.warn("Couldn't fetch from backend, using local stats", apiError.message);
          return localStats || {
            user: null,
            token,
            streak: 0,
            totalPoints: 0,
            lastPlayed: null,
            history: {}
          };
        }
      }
      
      // Guest mode - return local stats
      return localStats || {
        user: null,
        token: null,
        streak: 0,
        totalPoints: 0,
        lastPlayed: null,
        history: {}
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "user/login",
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const data = await authAPI.login(credentials);
      if (data.token) {
        setAuthToken(data.token);
        localStorage.setItem("token", data.token);
        
        // Refresh local stats with backend
        dispatch(loadUserStats());
        
        return {
          user: data.user,
          token: data.token
        };
      }
      throw new Error("No token received");
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

export const guestLogin = createAsyncThunk(
  "user/guestLogin",
  async (_, { rejectWithValue }) => {
    try {
      // Guest mode - no backend sync
      const guestStats = await getUserStats() || {
        user: { name: "Guest", id: "guest" },
        token: null,
        streak: 0,
        totalPoints: 0,
        lastPlayed: null,
        history: {}
      };
      return guestStats;
    } catch (error) {
      return rejectWithValue("Guest login failed");
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem("token") || null,
  streak: 0,
  totalPoints: 0,
  history: {},
  lastPlayed: null,
  loading: false,
  error: null,
  isGuest: !localStorage.getItem("token")
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.isGuest = true;
      state.streak = 0;
      state.totalPoints = 0;
      state.history = {};
      state.lastPlayed = null;
      localStorage.removeItem("token");
      setAuthToken(null);
    },
    setGuestMode: (state) => {
      state.isGuest = true;
      state.user = { name: "Guest", id: "guest" };
    }
  },
  extraReducers: (builder) => {
    builder
      // Load user stats
      .addCase(loadUserStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUserStats.fulfilled, (state, action) => {
        state.user = action.payload.user || state.user;
        state.streak = action.payload.streak || 0;
        state.lastPlayed = action.payload.lastPlayed;
        state.totalPoints = action.payload.totalPoints || 0;
        state.history = action.payload.history || {};
        state.token = action.payload.token || state.token;
        state.isGuest = !action.payload.token;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isGuest = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Guest login
      .addCase(guestLogin.fulfilled, (state, action) => {
        state.user = action.payload.user || { name: "Guest", id: "guest" };
        state.streak = action.payload.streak || 0;
        state.totalPoints = action.payload.totalPoints || 0;
        state.history = action.payload.history || {};
        state.lastPlayed = action.payload.lastPlayed;
        state.isGuest = true;
        state.token = null;
        state.loading = false;
      })

      // Complete puzzle
      .addCase(completePuzzle.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.streak = action.payload.streak;
        state.lastPlayed = action.payload.lastPlayed;
        state.totalPoints = action.payload.totalPoints;
        state.history = action.payload.history;
        state.error = null;
      })
      .addCase(completePuzzle.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Process sync queue
      .addCase(processSyncQueue.fulfilled, (state, action) => {
        // Sync complete
      })
      .addCase(processSyncQueue.rejected, (state, action) => {
        console.warn("Sync queue processing failed:", action.payload);
      });
  }
});

export const { logout, setGuestMode } = userSlice.actions;

export default userSlice.reducer;
