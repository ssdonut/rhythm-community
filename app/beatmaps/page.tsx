"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type BeatmapItem = {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    gameType: string;
    fileUrl: string;
    createdAt: string;
    uploader: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

export default function BeatmapListPage() {
    const [beatmaps, setBeatmaps] = useState<BeatmapItem[]>([]);
    const [message, setMessage] = useState("");
    const [query, setQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetch("/api/beatmaps/list")
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setBeatmaps(result.data);
                    return;
                }
                setMessage(result.message || "加载谱面列表失败");
            })
            .catch(() => setMessage("加载谱面列表失败"));
    }, []);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");
        try {
            const response = await fetch(
                `/api/beatmaps/list?query=${encodeURIComponent(query.trim())}`
            );
            const result = await response.json();
            if (result.success && result.data) {
                setBeatmaps(result.data);
                return;
            }
            setMessage(result.message || "搜索谱面失败");
        } catch (error) {
            console.error("搜索谱面失败：", error);
            setMessage("搜索谱面失败");
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">谱面分享</h1>
                        <p className="mt-2 text-[var(--rc-muted)]">
                            浏览玩家分享的谱面资源与下载地址。
                        </p>
                    </div>
                    <Link
                        href="/beatmaps/new"
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                        发布谱面
                    </Link>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="mt-6 flex flex-wrap gap-3"
                >
                    <input
                        type="text"
                        placeholder="搜索谱面、类型或上传者"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full max-w-md rounded-xl border px-4 py-2 outline-none"
                    />
                    <button
                        type="submit"
                        className="rounded-xl border px-4 py-2 text-sm text-[var(--rc-text)]"
                    >
                        搜索
                    </button>
                </form>

                {message && (
                    <p className="mt-6 text-sm text-red-600">{message}</p>
                )}

                <div className="mt-8 space-y-4">
                    {beatmaps.map((beatmap) => (
                        <Link
                            key={beatmap.id}
                            href={`/beatmaps/${beatmap.id}`}
                            className="block rounded-2xl border p-6 shadow-sm transition hover:border-[var(--rc-border)]"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {beatmap.title}
                                    </h2>
                                    <p className="mt-2 line-clamp-2 text-sm text-[var(--rc-muted)]">
                                        {beatmap.description}
                                    </p>
                                    <div className="mt-3 text-sm text-[var(--rc-muted)]">
                                        难度：{beatmap.difficulty} ・ 类型：
                                        {beatmap.gameType}
                                    </div>
                                    <div className="mt-3 text-sm text-blue-600 underline">
                                        点击查看详情下载
                                    </div>
                                </div>
                                <div className="text-right text-sm text-[var(--rc-muted)]">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            router.push(
                                                `/users/${beatmap.uploader.id}`
                                            );
                                        }}
                                        className="inline-flex items-center justify-end gap-2"
                                    >
                                        {beatmap.uploader.avatar ? (
                                            <img
                                                src={beatmap.uploader.avatar}
                                                alt="上传者头像"
                                                className="h-7 w-7 rounded-full border object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                                无
                                            </span>
                                        )}
                                        <p>
                                            {beatmap.uploader.nickname ||
                                                beatmap.uploader.username}
                                        </p>
                                        {beatmap.uploader.role === "admin" && (
                                            <span className="inline-flex rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                                管理员
                                            </span>
                                        )}
                                    </button>
                                    <p className="mt-1">
                                        {new Date(
                                            beatmap.createdAt
                                        ).toLocaleString("zh-CN")}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {!beatmaps.length && !message && (
                        <div className="rounded-2xl border border-dashed p-10 text-center text-[var(--rc-muted)]">
                            还没有谱面，去发布第一条吧。
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
