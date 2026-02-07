import { Inconsolata } from "next/font/google";
import "./globals.css";

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
});

export const metadata = {
  title: "ZK-Bluff",
  description: "Bluff game with no cheating",
};

export default function Layout({ children }) {
  return (
    <html className={inconsolata.className}>
      <body className="relative w-screen h-screen overflow-hidden">{children}</body>
    </html>
  )
}
