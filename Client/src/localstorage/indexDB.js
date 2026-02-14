import { openDB } from "idb";

const DB_NAME = "puzzleDB";
const STORE_NAME = "dailyPuzzle"; 

export const initDB = async () => {
  return openDB(DB_NAME, 2, {
    upgrade(db) {
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }

      if (!db.objectStoreNames.contains("userStats")) {
        db.createObjectStore("userStats", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
    },
  });
};

export const saveUserStats = async (stats) => {
  const db = await initDB();
  
  return db.put("userStats", { ...stats, id: "userStats" });
};

export const getUserStats = async () => {
  const db = await initDB();
  return db.get(STORE_NAME, "userStats");
};

export const saveDailyScore = async (date, scoreData) => {
  const db = await initDB();
  const stats = await getUserStats() || { history: {} };
  if (!stats.history) stats.history = {};
  stats.history[date] = scoreData;
  return saveUserStats(stats);
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
  const tx = db.transaction("syncQueue", "readwrite");
  await tx.store.add({
    ...data,
    createdAt: Date.now()
  });
  await tx.done;
};

export const getSyncQueue = async () => {
  const db = await initDB();
  return await db.getAll("syncQueue");
};

export const removeFromSyncQueue = async (id) => {
  const db = await initDB();
  const tx = db.transaction("syncQueue", "readwrite");
  await tx.store.delete(id);
  await tx.done;
};
