"use client";

import { Toaster } from "react-hot-toast";
import { useDarkModeContext } from "./_context/DarkModeContext";
import { Provider } from "react-redux";
import store from "./store";
// import { AppProgressBar } from "next-nprogress-bar";

function ClientProviders({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useDarkModeContext();

  // Best place to add progressbar seemd here
  return (
    <>
      {/* <AppProgressBar
        // height="2px"
        // color="#4f46e5"
        options={{ showSpinner: false }}
      /> */}

      <Provider store={store}>{children}</Provider>

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

export default ClientProviders;
