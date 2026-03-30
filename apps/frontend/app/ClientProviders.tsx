"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Provider } from "react-redux";
import SocketWrapper from "./(privateRoutes)/SocketWrapper";
import { ActiveSectionContextProvider } from "./_context/ActiveSectionContext";
import { DarkModeProvider } from "./_context/DarkModeContext";
import store from "./store";
import ToasterProvider from "./ToasterProvider";

function ClientProviders({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
    <QueryClientProvider client={queryClient}>
      <ActiveSectionContextProvider>
        <DarkModeProvider>
          <SessionProvider>
            <ToasterProvider>
              <SocketWrapper>
                <Provider store={store}>{children}</Provider>
              </SocketWrapper>
            </ToasterProvider>
          </SessionProvider>
        </DarkModeProvider>
      </ActiveSectionContextProvider>
    </QueryClientProvider>
  );
}

export default ClientProviders;
