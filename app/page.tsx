"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecommendedPost = {
    id: number;
    title: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    section: string;
    sectionName: string;
    username: string;
    nickname?: string | null;
    role?: string | null;
};

type RhythmStats = {
    todayPosts: number;
    todayBeatmaps: number;
    todayFanworks: number;
    activeGroups: number;
};

export default function HomePage() {
    const [posts, setPosts] = useState<RecommendedPost[]>([]);
    const [message, setMessage] = useState("");
    const [stats, setStats] = useState<RhythmStats | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchRecommendations = async () => {
        setIsRefreshing(true);
        setMessage("");
        try {
            const response = await fetch("/api/posts/recommend");
            const result = await response.json();
            if (result.success && result.data) {
                setPosts(result.data);
                return;
            }
            setMessage(result.message || "加载推荐帖子失败");
        } catch {
            setMessage("加载推荐帖子失败");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();

        fetch("/api/stats")
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setStats(result.data);
                }
            })
            .catch(() => null);
    }, []);

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <header className="flex flex-wrap items-center justify-between gap-6">
                    <div className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.4em] text-[var(--rc-muted)]">
                            音游论坛计划
                        </p>
                        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                            把热爱打成节拍，把讨论汇成舞台
                        </h1>
                        <p className="max-w-2xl text-base text-[var(--rc-muted)] sm:text-lg">
                            玻璃拟态的律动空间，帖子、谱面、同人作品与开团活动都围绕节拍脉冲展开。
                        </p>
                    </div>
                    <div className="glass-panel note-hit flex w-full max-w-md flex-col gap-4 sm:w-auto">
                        <div className="flex items-center gap-3">
                            <span className="pulse-dot" />
                            <span className="text-sm text-[var(--rc-muted)]">
                                判定线启动中
                            </span>
                        </div>
                        <div className="neon-line" />
                        <div className="flex flex-wrap gap-3">
                            <Link href="/forum/new" className="ripple-button">
                                发布帖子
                            </Link>
                            <Link href="/beatmaps/new" className="ripple-button ghost">
                                发布谱面
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="mt-12 grid gap-6 lg:grid-cols-[280px_1fr]">
                    <aside className="space-y-6 lg:sticky lg:top-10 lg:h-fit">
                        <div className="bento-card">
                            <h2 className="text-lg font-semibold">快捷入口</h2>
                            <div className="mt-4 grid gap-3">
                                <Link href="/forum" className="glass-panel note-hit">
                                    进入论坛
                                </Link>
                                <Link href="/beatmaps" className="glass-panel note-hit">
                                    谱面分享
                                </Link>
                                <Link href="/fanworks" className="glass-panel note-hit">
                                    同人画廊
                                </Link>
                                <Link href="/groups" className="glass-panel note-hit">
                                    开团市集
                                </Link>
                            </div>
                        </div>

                        <div className="bento-card">
                            <h2 className="text-lg font-semibold">今日节奏</h2>
                            <div className="mt-4 grid gap-3 text-center text-sm">
                                <div className="glass-panel">
                                    <p className="text-xs text-[var(--rc-muted)]">今日帖子</p>
                                    <p className="mt-2 text-xl font-semibold">
                                        {stats ? stats.todayPosts : "--"}
                                    </p>
                                </div>
                                <div className="glass-panel">
                                    <p className="text-xs text-[var(--rc-muted)]">谱面更新</p>
                                    <p className="mt-2 text-xl font-semibold">
                                        {stats ? stats.todayBeatmaps : "--"}
                                    </p>
                                </div>
                                <div className="glass-panel">
                                    <p className="text-xs text-[var(--rc-muted)]">今日同人图</p>
                                    <p className="mt-2 text-xl font-semibold">
                                        {stats ? stats.todayFanworks : "--"}
                                    </p>
                                </div>
                                <div className="glass-panel">
                                    <p className="text-xs text-[var(--rc-muted)]">开团中</p>
                                    <p className="mt-2 text-xl font-semibold">
                                        {stats ? stats.activeGroups : "--"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="space-y-6">
                        <div className="bento-card">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">随机推荐帖子</h2>
                                <div className="flex items-center gap-3 text-xs text-[var(--rc-muted)]">
                                    <button
                                        type="button"
                                        onClick={fetchRecommendations}
                                        disabled={isRefreshing}
                                        className="rounded-full border border-[var(--rc-border)] px-3 py-1 text-[var(--rc-text)] transition hover:border-[var(--rc-neon)] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isRefreshing ? "刷新中" : "刷新"}
                                    </button>
                                    <Link href="/forum">更多</Link>
                                </div>
                            </div>
                            {message && (
                                <p className="mt-3 text-sm text-red-400">{message}</p>
                            )}
                            <div className="mt-4 grid gap-3">
                                {posts.map((post) => (
                                    <Link
                                        key={post.id}
                                        href={`/forum/${post.id}`}
                                        className="glass-panel note-hit flex min-h-[160px] items-stretch justify-between gap-4"
                                    >
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-xs text-[var(--rc-muted)]">
                                                    <span>{post.nickname || post.username}</span>
                                                    {post.role === "admin" && (
                                                        <span className="admin-pill">
                                                            管理员
                                                        </span>
                                                    )}
                                                    <span className="rounded-full border border-[var(--rc-border)] px-2 py-0.5 text-[10px] text-white">
                                                        {post.sectionName}
                                                    </span>
                                                </div>
                                                <h3 className="mt-2 text-base font-semibold text-white">
                                                    {post.title}
                                                </h3>
                                                <p className="mt-2 line-clamp-2 text-xs text-[var(--rc-muted)]">
                                                    {post.content}
                                                </p>
                                            </div>
                                            <p className="mt-3 text-[10px] text-[var(--rc-muted)]">
                                                {new Date(post.createdAt).toLocaleString("zh-CN")}
                                            </p>
                                        </div>
                                        {post.imageUrl && (
                                            <img
                                                src={post.imageUrl}
                                                alt={post.title}
                                                className="h-full w-40 rounded-xl object-cover"
                                            />
                                        )}
                                    </Link>
                                ))}
                                {!posts.length && !message && (
                                    <div className="glass-panel flex items-center justify-center text-sm text-[var(--rc-muted)]">
                                        暂无推荐帖子
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

