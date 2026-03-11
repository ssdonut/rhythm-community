import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
    title: "音游论坛",
    description: "一个面向音游玩家的交流社区。",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
            <body>
                <TopNav />
                {children}
            </body>
        </html>
    );
}
