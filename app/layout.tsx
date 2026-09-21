import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typeahead Search Demo",
  description: "Debounced country search built for a take-home screen.",
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
