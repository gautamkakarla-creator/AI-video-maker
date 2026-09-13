import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"AI Video Maker",description:"Create TikTok-ready AI videos."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
