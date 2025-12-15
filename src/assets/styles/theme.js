import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDaytime, setIsDaytime] = useState(null);

  useEffect(() => {
    const hour = new Date().getHours();
    const day = hour >= 6 && hour < 18;
    setIsDaytime(day);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDaytime, setIsDaytime }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);