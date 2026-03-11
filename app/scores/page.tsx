"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ScoreItem = {
    id: number;
    game: string;
    songTitle: string;
    difficulty: string;
    result: string;
    rank: string;
    comment?: string | null;
    createdAt: string;
    user: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
};

export default function ScoreListPage() {
    const [records, setRecords] = useState<ScoreItem[]>([]);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [user] = useState<StoredUser | null>(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const raw = window.localStorage.getItem("rc_user");
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch {
            window.localStorage.removeItem("rc_user");
            return null;
        }
    });

    useEffect(() => {
        if (!user) {
            return;
        }
        fetch(`/api/scores/user/${user.id}`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setRecords(result.data);
                    return;
                }
                setMessage(result.message || "加载战绩失败");
            })
            .catch(() => setMessage("加载战绩失败"));
    }, [user]);

    const handleDelete = async (recordId: number) => {
        if (!user) {
            setMessage("请先登录后再删除战绩");
            setIsSuccess(false);
            return;
        }
        const confirmed = window.confirm("确认删除这条战绩吗？");
        if (!confirmed) {
            return;
        }

        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/scores/${recordId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    requesterId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success) {
                setRecords((prev) =>
                    prev.filter((record) => record.id !== recordId)
                );
            }
        } catch (error) {
            console.error("删除战绩失败：", error);
            setMessage("删除战绩失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">我的战绩</h1>
                        <p className="mt-2 text-[var(--rc-muted)]">
                            查看你保存的游玩成绩记录。
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {user && (
                            <Link
                                href={`/scores/user/${user.id}`}
                                className="rounded-xl border px-4 py-2 text-sm text-[var(--rc-text)]"
                            >
                                查看战绩图表
                            </Link>
                        )}
                        <Link
                            href="/scores/new"
                            className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                        >
                            添加战绩
                        </Link>
                    </div>
                </div>

                {!user && (
                    <p className="mt-6 text-sm text-red-600">
                        请先登录后再查看个人战绩。
                    </p>
                )}

                {message && isSuccess && (
                    <p className="mt-6 text-sm text-green-600">{message}</p>
                )}
                {message && !isSuccess && (
                    <p className="mt-6 text-sm text-red-600">{message}</p>
                )}

                <div className="mt-8 space-y-4">
                    {records.map((record) => (
                        <div
                            key={record.id}
                            className="rounded-2xl border p-6 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {record.songTitle}
                                    </h2>
                                    <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                        难度：{record.difficulty}
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                        游戏：{record.game}
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                        成绩：{record.result} ・ 评级：
                                        {record.rank}
                                    </p>
                                    {record.comment && (
                                        <p className="mt-3 text-sm text-[var(--rc-muted)]">
                                            备注：{record.comment}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right text-sm text-[var(--rc-muted)]">
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(record.id)}
                                        className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600"
                                    >
                                        删除战绩
                                    </button>
                                    <p>
                                        {record.user.nickname ||
                                            record.user.username}
                                    </p>
                                    {record.user.role === "admin" && (
                                        <span className="mt-1 inline-flex rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                            管理员
                                        </span>
                                    )}
                                    <p className="mt-1">
                                        {new Date(
                                            record.createdAt
                                        ).toLocaleString("zh-CN")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!records.length && !message && (
                        <div className="rounded-2xl border border-dashed p-10 text-center text-[var(--rc-muted)]">
                            还没有战绩，去添加第一条吧。
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
