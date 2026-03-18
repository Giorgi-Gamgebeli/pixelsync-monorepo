import type { Metadata } from "next";
import "./globals.css";
import { DarkModeProvider } from "./_context/DarkModeContext";
import { ActiveSectionContextProvider } from "./_context/ActiveSectionContext";
import ClientProviders from "./ClientProviders";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "PixelSync | Collaborative Whiteboard for Teams",
  description:
    "The collaborative whiteboard where your team actually hangs out. Draw, design, and discuss - all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ActiveSectionContextProvider>
          <DarkModeProvider>
            <SessionProvider>
              <ClientProviders>{children}</ClientProviders>
            </SessionProvider>
          </DarkModeProvider>
        </ActiveSectionContextProvider>
      </body>
    </html>
  );
}
