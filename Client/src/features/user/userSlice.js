import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserStats, saveUserStats, saveDailyScore, addToSyncQueue, getSyncQueueUnsynced, removeFromSyncQueue, markSyncQueueItemSynced } from "../../localstorage/indexDB";
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
          // Continue with next item even if one fails
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

    // Try to sync if logged in (not guest)
    if (user.token && !user.isGuest) {
      try {
        await scoreAPI.submitScore({
          score,
          date,
          timeTaken: timeTaken || 0,
          puzzleId: puzzleId || "daily-" + date
        });
        console.log("✅ Score synced to backend");
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
      const token = localStorage.getItem("token");
      const localStats = await getUserStats();

      // If we have a token, try to fetch from backend
      if (token) {
        try {
          // Set token for subsequent requests
          setAuthToken(token);

          const profile = await userAPI.getProfile();
          console.log("✅ Loaded profile from backend:", profile);

          // Merge local and remote stats
          return {
            user: profile.user || profile,
            token,
            streak: profile.streakCount || localStats?.streak || 0,
            totalPoints: profile.totalPoints || localStats?.totalPoints || 0,
            lastPlayed: profile.lastPlayed || localStats?.lastPlayed,
            history: localStats?.history || {}
          };
        } catch (apiError) {
          console.warn("Couldn't fetch from backend, using local stats:", apiError.message);
          // Still return local stats with token
          return {
            user: localStats?.user || { name: "User", id: "unknown" },
            token,
            streak: localStats?.streak || 0,
            totalPoints: localStats?.totalPoints || 0,
            lastPlayed: localStats?.lastPlayed,
            history: localStats?.history || {}
          };
        }
      }

      // No token - return local stats (could be guest or first time user)
      return {
        user: localStats?.user || null,
        token: null,
        streak: localStats?.streak || 0,
        totalPoints: localStats?.totalPoints || 0,
        lastPlayed: localStats?.lastPlayed,
        history: localStats?.history || {}
      };
    } catch (error) {
      console.error("Error loading user stats:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  "user/login",
  async (credentials, { rejectWithValue, dispatch }) => {
    try {
      const response = await authAPI.login(credentials);

      if (response.token && response.user) {
        setAuthToken(response.token);
        localStorage.setItem("token", response.token);

        console.log("✅ Login successful:", response.user);

        // Try to sync queue after login
        setTimeout(() => {
          dispatch(processSyncQueue());
        }, 500);

        return {
          user: response.user,
          token: response.token
        };
      }
      throw new Error("No token received from backend");
    } catch (error) {
      console.error("Login error:", error);
      const message =
        error?.error ||
        error?.message ||
        error?.response?.data?.error ||
        (typeof error === "string" ? error : "Login failed");
      return rejectWithValue(message);
    }
  }
);

export const guestLogin = createAsyncThunk(
  "user/guestLogin",
  async (_, { rejectWithValue }) => {
    try {
      // Guest mode - use local storage
      const guestStats = await getUserStats() || {
        user: { name: "Guest", id: "guest-" + Date.now() },
        token: null,
        streak: 0,
        totalPoints: 0,
        lastPlayed: null,
        history: {}
      };

      console.log("✅ Guest login successful");
      return guestStats;
    } catch (error) {
      console.error("Guest login error:", error);
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
        // Still mark as ready even if error
        state.user = state.user || null;
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
      .addCase(guestLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(guestLogin.fulfilled, (state, action) => {
        state.user = action.payload.user || { name: "Guest", id: "guest" };
        state.streak = action.payload.streak || 0;
        state.totalPoints = action.payload.totalPoints || 0;
        state.history = action.payload.history || {};
        state.lastPlayed = action.payload.lastPlayed;
        state.isGuest = true;
        state.token = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(guestLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        console.log(`✅ Synced ${action.payload.synced} items`);
      })
      .addCase(processSyncQueue.rejected, (state, action) => {
        console.warn("Sync queue processing failed:", action.payload);
      });
  }
});

export const { logout, setGuestMode } = userSlice.actions;

export default userSlice.reducer;
