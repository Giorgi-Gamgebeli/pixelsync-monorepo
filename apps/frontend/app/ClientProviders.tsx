"use client";

import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import { ActiveSectionContextProvider } from "./_context/ActiveSectionContext";
import { DarkModeProvider } from "./_context/DarkModeContext";
import ReactQueryProvider from "./ReactQueryProvider";
import store from "./store";
import ToasterProvider from "./ToasterProvider";

function ClientProviders({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ReactQueryProvider>
      <ActiveSectionContextProvider>
        <DarkModeProvider>
          <SessionProvider>
            <ToasterProvider>
              <Provider store={store}>{children}</Provider>
            </ToasterProvider>
          </SessionProvider>
        </DarkModeProvider>
      </ActiveSectionContextProvider>
    </ReactQueryProvider>
  );
}

export default ClientProviders;
