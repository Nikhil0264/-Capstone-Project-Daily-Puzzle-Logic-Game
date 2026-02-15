import { openDB } from "idb";

const DB_NAME = "puzzleDB";
const STORE_NAME = "dailyPuzzle";
const USER_STATS_STORE = "userStats";
const SYNC_QUEUE_STORE = "syncQueue";
const DAILY_SCORES_STORE = "dailyScores";

export const initDB = async () => {
  return openDB(DB_NAME, 3, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Puzzle progress store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }

      // User stats store (singleton pattern with 'userStats' key)
      if (!db.objectStoreNames.contains(USER_STATS_STORE)) {
        db.createObjectStore(USER_STATS_STORE);
      }

      // Sync queue for offline support
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }

      // Daily scores history (date as key for fast lookups)
      if (!db.objectStoreNames.contains(DAILY_SCORES_STORE)) {
        db.createObjectStore(DAILY_SCORES_STORE, { keyPath: "date" });
      }
    },
  });
};

export const saveUserStats = async (stats) => {
  const db = await initDB();
  return db.put(USER_STATS_STORE, stats, "userStats");
};

export const getUserStats = async () => {
  const db = await initDB();
  return db.get(USER_STATS_STORE, "userStats");
};

export const saveDailyScore = async (date, scoreData) => {
  const db = await initDB();
  const tx = db.transaction(DAILY_SCORES_STORE, "readwrite");
  await tx.store.put({
    date,
    ...scoreData,
    timestamp: Date.now()
  });
  await tx.done;
};

export const getDailyScore = async (date) => {
  const db = await initDB();
  return db.get(DAILY_SCORES_STORE, date);
};

export const getAllDailyScores = async () => {
  const db = await initDB();
  return db.getAll(DAILY_SCORES_STORE);
};

export const savePuzzleState = async (state) => {
  const db = await initDB();
  return db.put(STORE_NAME, state, "currentGameState");
};

export const getPuzzleState = async () => {
  const db = await initDB();
  return db.get(STORE_NAME, "currentGameState");
};

export const clearPuzzleState = async () => {
  const db = await initDB();
  return db.delete(STORE_NAME, "currentGameState");
};

export const addToSyncQueue = async (data) => {
  const db = await initDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, "readwrite");
  await tx.store.add({
    ...data,
    createdAt: Date.now(),
    synced: false
  });
  await tx.done;
};

export const getSyncQueue = async () => {
  const db = await initDB();
  return db.getAll(SYNC_QUEUE_STORE);
};

export const getSyncQueueUnsynced = async () => {
  const db = await initDB();
  const allQueue = await db.getAll(SYNC_QUEUE_STORE);
  return allQueue.filter(item => !item.synced);
};

export const removeFromSyncQueue = async (id) => {
  const db = await initDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, "readwrite");
  await tx.store.delete(id);
  await tx.done;
};

export const markSyncQueueItemSynced = async (id) => {
  const db = await initDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, "readwrite");
  const item = await tx.store.get(id);
  if (item) {
    item.synced = true;
    await tx.store.put(item);
  }
  await tx.done;
};
