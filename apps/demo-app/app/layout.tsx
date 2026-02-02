import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LingoWrapper } from "../components/LingoWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lingo-Guardian Demo",
  description: "Automated i18n testing demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LingoWrapper>
          {children}
        </LingoWrapper>
      </body>
    </html>
  );
}
