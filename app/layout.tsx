import { AppHeader } from "@/components/layout/app-header";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
