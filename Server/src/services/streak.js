import dayjs from "dayjs";

export const calculateStreak = (lastPlayed, currentDate) => {
  
  const today = currentDate ? dayjs(currentDate) : dayjs();
  const yesterday = today.subtract(1, "day");

  if (!lastPlayed) {
    return 1;
  }

  const last = dayjs(lastPlayed);

  if (last.isSame(today, "day")) {
    return null; 
  }

  if (last.isSame(yesterday, "day")) {
    return "increment";
  }

  return "reset";
};
