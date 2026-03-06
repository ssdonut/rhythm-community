import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "音游论坛交流平台",
    description: "基于 Next.js 14 的音游论坛交流平台毕业设计项目",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
        <body>{children}</body>
        </html>
    );
}