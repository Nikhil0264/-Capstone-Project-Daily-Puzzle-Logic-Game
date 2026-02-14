import dayjs from "dayjs";
import CryptoJS from "crypto-js";

const SALT = "daily-puzzle-secret-salt-v1";

export function generateDailySeed(dateString) {
  
  
  const today = dateString || dayjs().format("YYYY-MM-DD");
  const raw = today + "-" + SALT;
  const hash = CryptoJS.SHA256(raw).toString(CryptoJS.enc.Hex);
  
  return parseInt(hash.substring(0, 8), 16);
}
