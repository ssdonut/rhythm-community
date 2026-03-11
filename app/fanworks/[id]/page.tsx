"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type FanworkDetail = {
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

export default function FanworkDetailPage() {
    const params = useParams();
    const fanworkId = Number(params.id);
    const [fanwork, setFanwork] = useState<FanworkDetail | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!fanworkId) {
            return;
        }
        fetch(`/api/fanworks/${fanworkId}`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setFanwork(result.data);
                    return;
                }
                setMessage(result.message || "加载作品失败");
            })
            .catch(() => setMessage("加载作品失败"));
    }, [fanworkId]);

    return (
        <main className="min-h-screen bg-[#f9f7f2] text-[var(--rc-text)]">
            <div className="mx-auto max-w-5xl px-6 py-16">
                <div className="flex items-center justify-between">
                    <Link href="/fanworks" className="text-sm text-[var(--rc-muted)]">
                        返回画廊
                    </Link>
                    <Link
                        href="/fanworks/new"
                        className="rounded-full bg-black px-4 py-2 text-sm text-white"
                    >
                        发布作品
                    </Link>
                </div>

                {fanwork ? (
                    <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-4">
                            {fanwork.imageUrls
                                .split(",")
                                .filter(Boolean)
                                .map((url) => (
                                    <div
                                        key={url}
                                        className="overflow-hidden rounded-3xl border border-black/10 bg-[var(--rc-bg)] shadow-sm"
                                    >
                                        <img
                                            src={url}
                                            alt={fanwork.title}
                                            className="w-full object-cover"
                                        />
                                    </div>
                                ))}
                        </div>
                        <div className="rounded-3xl border border-black/10 bg-[var(--rc-bg)] p-6 shadow-sm">
                            <h1 className="text-3xl font-bold">
                                {fanwork.title}
                            </h1>
                            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--rc-muted)]">
                                <Link
                                    href={`/users/${fanwork.author.id}`}
                                    className="inline-flex items-center gap-2"
                                >
                                    {fanwork.author.avatar ? (
                                        <img
                                            src={fanwork.author.avatar}
                                            alt="用户头像"
                                            className="h-8 w-8 rounded-full border object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                            无
                                        </span>
                                    )}
                                    <span>
                                        {fanwork.author.nickname ||
                                            fanwork.author.username}
                                    </span>
                                    {fanwork.author.role === "admin" && (
                                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                            管理员
                                        </span>
                                    )}
                                </Link>
                                <span>·</span>
                                <span>
                                    {new Date(
                                        fanwork.createdAt
                                    ).toLocaleString("zh-CN")}
                                </span>
                            </div>
                            <p className="mt-4 text-[var(--rc-text)]">
                                {fanwork.description}
                            </p>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {fanwork.tags.split(",").map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-black/5 px-3 py-1 text-xs text-[var(--rc-text)]"
                                    >
                                        #{tag.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="mt-8 text-sm text-[var(--rc-muted)]">
                        正在加载作品...
                    </p>
                )}

                {message && (
                    <p className="mt-6 text-sm text-red-600">{message}</p>
                )}
            </div>
        </main>
    );
}
