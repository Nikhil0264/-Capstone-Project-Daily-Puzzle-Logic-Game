import dayjs from "dayjs";
import CryptoJS from "crypto-js";

const SALT = "daily-puzzle-secret-salt-v1";

export function generateDailySeed(dateString) {
  const today = dateString || dayjs().format("YYYY-MM-DD");

  // Repeat the same seed for a 5-day cycle so puzzles repeat every 5 days
  const day = dayjs(today);
  const epoch = dayjs("1970-01-01");
  const dayIndex = day.diff(epoch, "day");
  const bucketStart = Math.floor(dayIndex / 5) * 5;
  const bucketDate = epoch.add(bucketStart, "day").format("YYYY-MM-DD");

  const raw = bucketDate + "-" + SALT;
  const hash = CryptoJS.SHA256(raw).toString(CryptoJS.enc.Hex);

  return parseInt(hash.substring(0, 8), 16);
}
