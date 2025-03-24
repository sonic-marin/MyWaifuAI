
import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MyWaifu AI - Your Personal Waifu Companion",
  description: "A waifu-based website that uses Google AI for image generation and DeepSeek for chat interactions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${quicksand.className} theme-pastel`}>
        {children}
      </body>
    </html>
  );
}
