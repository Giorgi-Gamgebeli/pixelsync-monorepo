"use client";

import { Toaster } from "react-hot-toast";
import { useDarkModeContext } from "./_context/DarkModeContext";

function ToasterProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isDarkMode } = useDarkModeContext();

  return (
    <>
      {children}

      <Toaster
        position="top-center"
        gutter={12}
        containerStyle={{ margin: "8px" }}
        toastOptions={{
          success: {
            duration: 3 * 1000,
          },
          error: {
            duration: 5 * 1000,
          },
          style: {
            fontSize: "16px",
            maxWidth: "500px",
            padding: "16px 24px",
            backgroundColor: isDarkMode ? "#18212f" : "white",
            color: isDarkMode ? "#e5e7eb" : "#374151",
          },
        }}
      />
    </>
  );
}

export default ToasterProvider;
