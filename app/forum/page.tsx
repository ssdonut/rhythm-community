"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FORUM_SECTIONS, getForumSectionMeta } from "@/lib/forum-sections";

type PostItem = {
    id: number;
    title: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    section: string;
    sectionName: string;
    author: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
    _count: {
        comments: number;
    };
};

type UserItem = {
    id: number;
    username: string;
    nickname?: string | null;
    avatar?: string | null;
    role?: string | null;
};

export default function ForumPage() {
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [message, setMessage] = useState("");
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState<UserItem[]>([]);
    const [userMessage, setUserMessage] = useState("");
    const [selectedSection, setSelectedSection] = useState("recent");
    const router = useRouter();

    const fetchPosts = async (nextQuery = query, nextSection = selectedSection) => {
        const params = new URLSearchParams();
        if (nextQuery.trim()) {
            params.set("query", nextQuery.trim());
        }
        if (nextSection !== "recent") {
            params.set("section", nextSection);
        }

        const response = await fetch(
            `/api/posts/list${params.toString() ? `?${params.toString()}` : ""}`
        );
        return response.json();
    };

    useEffect(() => {
        const loadRecentPosts = async () => {
            try {
                const response = await fetch("/api/posts/list");
                const result = await response.json();
                if (result.success && result.data) {
                    setPosts(result.data);
                    return;
                }
                setMessage(result.message || "加载帖子失败");
            } catch {
                setMessage("加载帖子失败");
            }
        };

        void loadRecentPosts();
    }, []);

    const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage("");
        setUserMessage("");
        try {
            const [postResult, userResult] = await Promise.all([
                fetchPosts(query, selectedSection),
                fetch(`/api/users/search?query=${encodeURIComponent(query.trim())}`).then(
                    (response) => response.json()
                ),
            ]);

            if (postResult.success && postResult.data) {
                setPosts(postResult.data);
            } else {
                setMessage(postResult.message || "搜索帖子失败");
            }

            if (userResult.success && userResult.data) {
                setUsers(userResult.data);
            } else {
                setUserMessage(userResult.message || "搜索用户失败");
            }
        } catch (error) {
            console.error("搜索失败：", error);
            setMessage("搜索失败");
            setUserMessage("搜索失败");
        }
    };

    const handleSectionChange = async (sectionId: string) => {
        setSelectedSection(sectionId);
        setMessage("");
        try {
            const result = await fetchPosts(query, sectionId);
            if (result.success && result.data) {
                setPosts(result.data);
                return;
            }
            setMessage(result.message || "加载专区帖子失败");
        } catch (error) {
            console.error("加载专区帖子失败：", error);
            setMessage("加载专区帖子失败");
        }
    };

    const sectionMeta =
        selectedSection === "recent"
            ? {
                  name: "最近帖子",
                  description: "按发布时间倒序展示全站最新帖子。",
              }
            : getForumSectionMeta(selectedSection);

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">论坛分区</h1>
                        <p className="mt-2 text-[var(--rc-muted)]">
                            选择专区浏览帖子，也可以按专区发布内容。
                        </p>
                    </div>
                    <Link
                        href="/forum/new"
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                        发布帖子
                    </Link>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => void handleSectionChange("recent")}
                        className={`rounded-full px-4 py-2 text-sm transition ${
                            selectedSection === "recent"
                                ? "bg-black text-white"
                                : "border border-[var(--rc-border)] text-[var(--rc-text)]"
                        }`}
                    >
                        最近帖子
                    </button>
                    {FORUM_SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            type="button"
                            onClick={() => void handleSectionChange(section.id)}
                            className={`rounded-full px-4 py-2 text-sm transition ${
                                selectedSection === section.id
                                    ? "bg-black text-white"
                                    : "border border-[var(--rc-border)] text-[var(--rc-text)]"
                            }`}
                        >
                            {section.name}
                        </button>
                    ))}
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--rc-border)] p-4">
                    <h2 className="text-sm font-semibold">{sectionMeta.name}</h2>
                    <p className="mt-1 text-sm text-[var(--rc-muted)]">
                        {sectionMeta.description}
                    </p>
                </div>

                <form
                    onSubmit={handleSearch}
                    className="mt-6 flex flex-wrap gap-3"
                >
                    <input
                        type="text"
                        placeholder="搜索帖子或用户"
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

                {users.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-[var(--rc-border)] p-4">
                        <h2 className="text-sm font-semibold text-[var(--rc-text)]">
                            用户搜索结果
                        </h2>
                        <div className="mt-3 flex flex-wrap gap-3">
                            {users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/users/${user.id}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-[var(--rc-border)] px-3 py-1 text-sm text-[var(--rc-text)]"
                                >
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="用户头像"
                                            className="h-6 w-6 rounded-full border object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                            无
                                        </span>
                                    )}
                                    <span>{user.nickname || user.username}</span>
                                    {user.role === "admin" && (
                                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                            管理员
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {userMessage && (
                    <p className="mt-4 text-sm text-red-600">{userMessage}</p>
                )}

                {message && (
                    <p className="mt-6 text-sm text-red-600">{message}</p>
                )}

                <div className="mt-8 space-y-4">
                    {posts.map((post) => (
                        <Link
                            key={post.id}
                            href={`/forum/${post.id}`}
                            className="block rounded-2xl border border-[var(--rc-border)] p-6 shadow-sm transition hover:border-[var(--rc-border)]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-xl font-semibold">
                                            {post.title}
                                        </h2>
                                        <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                                            {post.sectionName}
                                        </span>
                                    </div>
                                    {post.imageUrl && (
                                        <img
                                            src={post.imageUrl}
                                            alt="帖子图片"
                                            className="mt-3 max-h-64 w-full max-w-2xl rounded-2xl border object-contain bg-[rgba(15,23,42,0.6)]"
                                        />
                                    )}
                                    <p className="mt-2 line-clamp-2 text-sm text-[var(--rc-muted)]">
                                        {post.content}
                                    </p>
                                </div>
                                <div className="text-right text-sm text-[var(--rc-muted)]">
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            router.push(
                                                `/users/${post.author.id}`
                                            );
                                        }}
                                        className="inline-flex items-center gap-2"
                                    >
                                        {post.author.avatar ? (
                                            <img
                                                src={post.author.avatar}
                                                alt="用户头像"
                                                className="h-10 w-10 rounded-full border object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                                无
                                            </span>
                                        )}
                                        <span>
                                            {post.author.nickname ||
                                                post.author.username}
                                        </span>
                                        {post.author.role === "admin" && (
                                            <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                                管理员
                                            </span>
                                        )}
                                    </button>
                                    <p className="mt-1">
                                        {new Date(
                                            post.createdAt
                                        ).toLocaleString("zh-CN")}
                                    </p>
                                    <p className="mt-1">
                                        评论 {post._count.comments}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {!posts.length && !message && (
                        <div className="rounded-2xl border border-dashed border-[var(--rc-border)] p-10 text-center text-[var(--rc-muted)]">
                            当前专区还没有帖子。
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
