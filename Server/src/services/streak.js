import dayjs from "dayjs";

export const calculateStreak = (lastPlayed, currentDate) => {
  const today = currentDate ? dayjs(currentDate) : dayjs();
  const yesterday = today.subtract(1, "day");

  // No previous play — start/reset streak
  if (!lastPlayed) {
    return "reset";
  }

  const last = dayjs(lastPlayed);

  // Played today — no change
  if (last.isSame(today, "day")) {
    return "same";
  }

  // Played yesterday — increment streak
  if (last.isSame(yesterday, "day")) {
    return "increment";
  }

  // Otherwise streak resets
  return "reset";
};
