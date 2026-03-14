import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "./_context/DarkModeContext";
import { ActiveSectionContextProvider } from "./_context/ActiveSectionContext";
import ClientProviders from "./ClientProviders";
import { SessionProvider } from "next-auth/react";

const rubik = Rubik({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--fontFamily_Rubik",
});

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
      <body className={rubik.className}>
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
