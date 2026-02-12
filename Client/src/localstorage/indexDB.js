import { openDB } from "idb";

const DB_NAME = "puzzleDB";
const STORE_NAME = "dailyPuzzle";

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const savePuzzle = async (data) => {
  const db = await initDB();
  return db.put(STORE_NAME, data, "today");
};

export const getPuzzle = async () => {
  const db = await initDB();
  return db.get(STORE_NAME, "today");
};

export const clearPuzzle = async () => {
  const db = await initDB();
  return db.delete(STORE_NAME, "today");
};
