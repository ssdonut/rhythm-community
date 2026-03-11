"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    role?: string | null;
    isBanned?: boolean | null;
};

const storageKey = "rc_user";

export default function TopNav() {
    const [user, setUser] = useState<StoredUser | null>(null);

    useEffect(() => {
        const syncUser = () => {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                setUser(null);
                return;
            }
            try {
                setUser(JSON.parse(raw));
            } catch {
                localStorage.removeItem(storageKey);
                setUser(null);
            }
        };

        syncUser();

        const handleStorage = (event: StorageEvent) => {
            if (event.key === storageKey) {
                syncUser();
            }
        };

        const handleCustom = () => syncUser();

        window.addEventListener("storage", handleStorage);
        window.addEventListener("rc-user-updated", handleCustom);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("rc-user-updated", handleCustom);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem(storageKey);
        setUser(null);
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-[var(--rc-border)] bg-[rgba(12,15,23,0.85)] backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
                <Link
                    href="/"
                    className="flex items-center gap-3 text-base font-semibold text-[var(--rc-text)]"
                >
                    <span className="pulse-dot" />
                    <span>音游论坛</span>
                    <span className="hidden text-xs text-[var(--rc-muted)] sm:inline">
                        节拍交流社区
                    </span>
                </Link>

                <div className="hidden items-center gap-4 text-sm text-[var(--rc-muted)] md:flex">
                    <Link href="/forum" className="hover:text-white">
                        论坛
                    </Link>
                    <Link href="/beatmaps" className="hover:text-white">
                        谱面
                    </Link>
                    <Link href="/fanworks" className="hover:text-white">
                        同人
                    </Link>
                    <Link href="/groups" className="hover:text-white">
                        开团
                    </Link>
                </div>

                <div className="flex items-center gap-3 text-sm text-[var(--rc-muted)]">
                    {user ? (
                        <>
                            <Link href="/profile" className="hover:text-white">
                                个人中心
                            </Link>
                            <Link
                                href="/scores"
                                className="hover:text-white"
                            >
                                我的战绩
                            </Link>
                            <span className="text-white">
                                {user.nickname || user.username}
                            </span>
                            {user.role === "admin" && (
                                <span className="admin-pill">管理员</span>
                            )}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-full border border-[var(--rc-border)] px-3 py-1 text-[var(--rc-text)] transition hover:border-[var(--rc-neon)]"
                            >
                                退出登录
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="hover:text-white">
                                登录
                            </Link>
                            <Link href="/register" className="ripple-button">
                                注册
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <div className="mx-auto max-w-6xl px-6">
                <div className="neon-line" />
            </div>
        </nav>
    );
}
