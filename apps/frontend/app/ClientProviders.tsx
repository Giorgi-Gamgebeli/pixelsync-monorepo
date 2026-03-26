"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useDarkModeContext } from "./_context/DarkModeContext";
import { Provider } from "react-redux";
import { useState } from "react";
import store from "./store";

function ClientProviders({ children }: { children: React.ReactNode }) {
  const { isDarkMode } = useDarkModeContext();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            gcTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            retry: false,
          },
        },
      }),
  );

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>{children}</Provider>
      </QueryClientProvider>

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
