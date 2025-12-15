import { useEffect, useState } from "react";

export default function useDayNight() {
  const [isDaytime, setIsDaytime] = useState(null);

  useEffect(() => {
    const evaluate = () => {
      const hour = new Date().getHours();
      const day = hour >= 6 && hour < 18;
      setIsDaytime(day);
    };

    evaluate();

    const interval = setInterval(evaluate, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    isDaytime,
    isNight: isDaytime === false,
  };
}