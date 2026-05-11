import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LaunchKit — AI-powered launch copy",
  description:
    "Paste a GitHub URL or describe your project. Get launch-ready copy — landing page, social posts, and your perfect pitch — in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
