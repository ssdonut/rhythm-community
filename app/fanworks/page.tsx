"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FanworkItem = {
    id: number;
    title: string;
    description: string;
    imageUrls: string;
    tags: string;
    createdAt: string;
    author: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

export default function FanworkListPage() {
    const [fanworks, setFanworks] = useState<FanworkItem[]>([]);
    const [message, setMessage] = useState("");
    const [query, setQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetch("/api/fanworks/list")
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setFanworks(result.data);
                    return;
                }
                setMessage(result.message || "加载同人作品失败");
            })
            .catch(() => setMessage("加载同人作品失败"));
    }, []);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");
        try {
            const response = await fetch(
                `/api/fanworks/list?query=${encodeURIComponent(query.trim())}`
            );
            const result = await response.json();
            if (result.success && result.data) {
                setFanworks(result.data);
                return;
            }
            setMessage(result.message || "搜索同人作品失败");
        } catch (error) {
            console.error("搜索同人作品失败：", error);
            setMessage("搜索同人作品失败");
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">同人画廊</h1>
                        <p className="mt-2 text-[var(--rc-muted)]">
                            浏览同人作品与画廊分享，探索更多创作灵感。
                        </p>
                    </div>
                    <Link
                        href="/fanworks/new"
                        className="rounded-full bg-black px-5 py-2 text-sm text-white"
                    >
                        发布作品
                    </Link>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="mt-6 flex flex-wrap gap-3"
                >
                    <input
                        type="text"
                        placeholder="搜索作品标题或标签"
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

                <div className="mt-10 columns-1 gap-6 sm:columns-2 lg:columns-3">
                    {fanworks.map((item) => {
                        const cover =
                            item.imageUrls.split(",")[0] || item.imageUrls;
                        return (
                            <Link
                                key={item.id}
                                href={`/fanworks/${item.id}`}
                                className="mb-6 block break-inside-avoid rounded-3xl border border-[var(--rc-border)] bg-[var(--rc-bg)] shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="overflow-hidden rounded-t-3xl">
                                    <img
                                        src={cover}
                                        alt={item.title}
                                        className="w-full object-cover"
                                    />
                                </div>
                                <div className="p-5">
                                    <h2 className="text-lg font-semibold">
                                        {item.title}
                                    </h2>
                                    <p className="mt-2 line-clamp-2 text-sm text-[var(--rc-muted)]">
                                        {item.description}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {item.tags.split(",").map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full bg-black/20 px-2 py-1 text-xs text-[var(--rc-text)]"
                                            >
                                                #{tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-sm text-[var(--rc-muted)]">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                router.push(
                                                    `/users/${item.author.id}`
                                                );
                                            }}
                                            className="inline-flex items-center gap-2"
                                        >
                                            {item.author.avatar ? (
                                                <img
                                                    src={item.author.avatar}
                                                    alt="用户头像"
                                                    className="h-6 w-6 rounded-full border object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                                    无
                                                </span>
                                            )}
                                            <span>
                                                {item.author.nickname ||
                                                    item.author.username}
                                            </span>
                                            {item.author.role === "admin" && (
                                                <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                                    管理员
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                    {!fanworks.length && !message && (
                        <div className="rounded-3xl border border-dashed border-[var(--rc-border)] p-10 text-center text-[var(--rc-muted)]">
                            还没有作品，去发布第一条吧。
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
