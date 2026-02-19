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

      console.log(`🚀 Processing sync queue: ${queue.length} items`);

      const response = await scoreAPI.syncScores(queue);

      // If success, mark all as synced
      for (const item of queue) {
        await markSyncQueueItemSynced(item.id);
      }

      return {
        synced: response.synced || queue.length,
        totalPoints: response.totalPoints,
        streakCount: response.streakCount
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper for leveling logic
const calculateLevel = (totalPoints) => {
  // Level 1 starts at 0 pts
  // Level 2 at 500 pts
  // Level 3 at 1200 pts, etc.
  // Formula: Level = floor(5 * log10(TotalPoints/100 + 1)) + 1
  if (!totalPoints || totalPoints < 100) return 1;
  return Math.floor(5 * Math.log10(totalPoints / 100 + 1)) + 1;
};

// Achievement Definitions
const ACHIEVEMENTS = {
  FIRST_STEPS: { id: "first_steps", name: "First Steps", description: "Solve your first puzzle", icon: "🌱" },
  LOGIC_LOOP: { id: "logic_loop", name: "Logic Loop", description: "Solve 5 puzzles", icon: "🔄" },
  FIRE_STARTER: { id: "fire_starter", name: "Fire Starter", description: "Reach a 7-day streak", icon: "🔥" },
  MONTHLY_WARRIOR: { id: "monthly_warrior", name: "Monthly Warrior", description: "Reach a 30-day streak", icon: "🗓️" },
  CENTURION: { id: "centurion", name: "Centurion", description: "Solve 100 puzzles", icon: "🏛️" },
  EXPERT: { id: "expert", name: "Logic Expert", description: "Solve a hard puzzle", icon: "🧠" },
};

export const completePuzzle = createAsyncThunk(
  "user/completePuzzle",
  async ({ score, date, timeTaken, puzzleId, difficulty, isPractice }, { getState }) => {
    const { user } = getState();
    const today = dayjs().format("YYYY-MM-DD");
    const isToday = date === today;

    // 1. Calculate Streak (only for non-practice, daily puzzles)
    let newStreak = user.streak || 0;
    const lastPlayed = user.lastPlayed;

    if (isToday && !isPractice) {
      if (lastPlayed && lastPlayed === dayjs().subtract(1, 'day').format("YYYY-MM-DD")) {
        newStreak = (user.streak || 0) + 1;
      } else if (lastPlayed === today) {
        newStreak = user.streak || 0;
      } else {
        newStreak = 1;
      }
    }

    // 2. Calculate new XP and Level
    const newTotalPoints = (user.totalPoints || 0) + score;
    const newLevel = calculateLevel(newTotalPoints);
    const leveledUp = newLevel > (user.level || 1);

    // 3. Check Achievements
    const currentAchievements = user.achievements || [];
    const newAchievements = [...currentAchievements];
    const solvedCount = Object.keys(user.history || {}).length + 1;

    const checkAndAdd = (ach) => {
      if (!newAchievements.find(a => a.id === ach.id)) {
        newAchievements.push({ ...ach, unlockedAt: Date.now() });
        return true;
      }
      return false;
    };

    checkAndAdd(ACHIEVEMENTS.FIRST_STEPS);
    if (solvedCount >= 5) checkAndAdd(ACHIEVEMENTS.LOGIC_LOOP);
    if (solvedCount >= 100) checkAndAdd(ACHIEVEMENTS.CENTURION);
    if (newStreak >= 7) checkAndAdd(ACHIEVEMENTS.FIRE_STARTER);
    if (newStreak >= 30) checkAndAdd(ACHIEVEMENTS.MONTHLY_WARRIOR);
    if (difficulty === "hard") checkAndAdd(ACHIEVEMENTS.EXPERT);

    const newStats = {
      ...user,
      user: user.user || { name: "Guest", id: "guest" },
      token: user.token,
      streak: newStreak,
      lastPlayed: isPractice ? lastPlayed : today, // Don't update lastPlayed for practice
      totalPoints: newTotalPoints,
      level: newLevel,
      achievements: newAchievements,
      history: {
        ...user.history,
        [date]: {
          score,
          solved: true,
          timeTaken,
          difficulty,
          isPractice,
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
      // Add to sync queue first
      await addToSyncQueue({
        score,
        date,
        timeTaken: timeTaken || 0,
        difficulty: difficulty || "medium",
        puzzleId: puzzleId || "daily-" + date,
        userId: user.user?.id
      });

      // BATCH UPDATE: Only sync if queue reaches 5 items or if it's been a while
      const queue = await getSyncQueueUnsynced();
      if (queue.length >= 5) {
        console.log(`📦 Batch sync triggered: ${queue.length} items pending`);
        dispatch(processSyncQueue());
      } else {
        console.log(`🕒 Item queued. ${5 - queue.length} more until batch sync.`);
      }
    }

    return newStats;
  }
);

// Global cache for user profile to avoid redundant API calls
let profileCache = {
  data: null,
  timestamp: 0,
  expiry: 5 * 60 * 1000 // 5 minutes
};

export const loadUserStats = createAsyncThunk(
  "user/loadUserStats",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const localStats = await getUserStats();

      // If we have a token, try to fetch from backend
      if (token) {
        // CACHE CHECK: Use cached profile if still valid
        const now = Date.now();
        if (profileCache.data && (now - profileCache.timestamp < profileCache.expiry)) {
          console.log("🚀 Using cached profile data");
          return {
            ...profileCache.data,
            history: localStats?.history || {}
          };
        }

        try {
          // Set token for subsequent requests
          setAuthToken(token);

          const profile = await userAPI.getProfile();
          console.log("✅ Loaded profile from backend:", profile);

          const result = {
            user: profile.user || profile,
            token,
            streak: profile.streakCount || localStats?.streak || 0,
            totalPoints: profile.totalPoints || localStats?.totalPoints || 0,
            level: profile.level || localStats?.level || calculateLevel(profile.totalPoints || localStats?.totalPoints || 0),
            achievements: profile.achievements || localStats?.achievements || [],
            lastPlayed: profile.lastPlayed || localStats?.lastPlayed,
            history: localStats?.history || {}
          };

          // Update cache
          profileCache = {
            data: result,
            timestamp: now,
            expiry: 5 * 60 * 1000
          };

          return result;
        } catch (apiError) {
          console.warn("Couldn't fetch from backend, using local stats:", apiError.message);
          // Still return local stats with token
          return {
            user: localStats?.user || { name: "User", id: "unknown" },
            token,
            streak: localStats?.streak || 0,
            totalPoints: localStats?.totalPoints || 0,
            level: localStats?.level || calculateLevel(localStats?.totalPoints || 0),
            achievements: localStats?.achievements || [],
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
        level: localStats?.level || calculateLevel(localStats?.totalPoints || 0),
        achievements: localStats?.achievements || [],
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
  level: 1,
  achievements: [],
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
        state.level = action.payload.level || 1;
        state.achievements = action.payload.achievements || [];
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
        state.level = action.payload.level;
        state.achievements = action.payload.achievements;
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
