"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GroupItem = {
    id: number;
    title: string;
    description: string;
    imageUrls: string;
    price: number;
    stock: number;
    status: string;
    deadline?: string | null;
    createdAt: string;
    organizer: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

export default function GroupListPage() {
    const [groups, setGroups] = useState<GroupItem[]>([]);
    const [message, setMessage] = useState("");
    const [query, setQuery] = useState("");

    useEffect(() => {
        fetch("/api/groups/list")
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setGroups(result.data);
                    return;
                }
                setMessage(result.message || "加载开团列表失败");
            })
            .catch(() => setMessage("加载开团列表失败"));
    }, []);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");
        try {
            const response = await fetch(
                `/api/groups/list?query=${encodeURIComponent(query.trim())}`
            );
            const result = await response.json();
            if (result.success && result.data) {
                setGroups(result.data);
                return;
            }
            setMessage(result.message || "搜索开团失败");
        } catch (error) {
            console.error("搜索开团失败：", error);
            setMessage("搜索开团失败");
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">开团市集</h1>
                        <p className="mt-2 text-[var(--rc-muted)]">
                            浏览开团商品与拼团信息，参与同好一起下单。
                        </p>
                    </div>
                    <Link
                        href="/groups/new"
                        className="rounded-full bg-orange-500 px-5 py-2 text-sm text-white shadow"
                    >
                        发起开团
                    </Link>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="mt-6 flex flex-wrap gap-3"
                >
                    <input
                        type="text"
                        placeholder="搜索开团标题或团长"
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

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map((item) => {
                        const cover =
                            item.imageUrls.split(",")[0] || item.imageUrls;
                        return (
                            <Link
                                key={item.id}
                                href={`/groups/${item.id}`}
                                className="group rounded-3xl border border-[var(--rc-border)] bg-[var(--rc-bg)] p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="overflow-hidden rounded-2xl">
                                    <img
                                        src={cover}
                                        alt={item.title}
                                        className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                </div>
                                <div className="mt-4">
                                    <h2 className="text-lg font-semibold">
                                        {item.title}
                                    </h2>
                                    <p className="mt-2 line-clamp-2 text-sm text-[var(--rc-muted)]">
                                        {item.description}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-lg font-bold text-orange-400">
                                            ￥{item.price.toFixed(2)}
                                        </span>
                                        <span className="rounded-full bg-[rgba(15,23,42,0.6)] px-3 py-1 text-xs text-[var(--rc-muted)]">
                                            库存 {item.stock}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--rc-muted)]">
                                        <span className="rounded-full bg-orange-500/10 px-2 py-1 text-orange-300">
                                            {item.status}
                                        </span>
                                        <span>
                                            {item.deadline
                                                ? `截止：${new Date(
                                                      item.deadline
                                                  ).toLocaleDateString("zh-CN")}`
                                                : "长期开放"}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-sm text-[var(--rc-muted)]">
                                        {item.organizer.avatar ? (
                                            <img
                                                src={item.organizer.avatar}
                                                alt="用户头像"
                                                className="h-6 w-6 rounded-full border object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                                无
                                            </span>
                                        )}
                                        <span>
                                            {item.organizer.nickname ||
                                                item.organizer.username}
                                        </span>
                                        {item.organizer.role === "admin" && (
                                            <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                                管理员
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                    {!groups.length && !message && (
                        <div className="rounded-3xl border border-dashed border-[var(--rc-border)] p-10 text-center text-[var(--rc-muted)]">
                            还没有开团，去发布第一条吧。
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
