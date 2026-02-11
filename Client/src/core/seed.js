import dayjs from "dayjs";
import CryptoJS from "crypto-js";

export function generateDailySeed() {
  const today = dayjs().format("YYYY-MM-DD");
  const hash = CryptoJS.SHA256(today).toString(CryptoJS.enc.Hex);
  return parseInt(hash.substring(0, 8), 16);
}
