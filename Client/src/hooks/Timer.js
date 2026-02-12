import { useEffect, useState } from "react";

export const useGameTimer = (isRunning, startTime) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      setTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  return time;
};
