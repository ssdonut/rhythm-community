"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
};

const storageKey = "rc_user";

export default function ScoreNewPage() {
    const [user] = useState<StoredUser | null>(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch {
            window.localStorage.removeItem(storageKey);
            return null;
        }
    });
    const [game, setGame] = useState("");
    const [songTitle, setSongTitle] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [result, setResult] = useState("");
    const [rank, setRank] = useState("");
    const [comment, setComment] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setMessage("请先登录后再添加战绩");
            setIsSuccess(false);
            return;
        }
        if (!game || !songTitle || !difficulty || !result || !rank) {
            setMessage("请完整填写战绩信息");
            setIsSuccess(false);
            return;
        }

        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch("/api/scores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    game,
                    songTitle,
                    difficulty,
                    result,
                    rank,
                    comment,
                    userId: user.id,
                }),
            });
            const responseData = await response.json();
            setMessage(responseData.message);
            setIsSuccess(responseData.success);
            if (responseData.success) {
                setGame("");
                setSongTitle("");
                setDifficulty("");
                setResult("");
                setRank("");
                setComment("");
                router.push("/scores");
            }
        } catch (error) {
            console.error("添加战绩失败：", error);
            setMessage("添加战绩失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold">添加战绩</h1>
                <p className="mt-3 text-[var(--rc-muted)]">
                    记录你的游玩成绩、评级和心得。
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            游戏
                        </label>
                        <input
                            type="text"
                            placeholder="例如 osu! / maimai / Arcaea"
                            value={game}
                            onChange={(e) => setGame(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            曲目名称
                        </label>
                        <input
                            type="text"
                            placeholder="请输入曲目名称"
                            value={songTitle}
                            onChange={(e) => setSongTitle(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                难度
                            </label>
                            <input
                                type="text"
                                placeholder="例如 Hard / 9+"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                成绩
                            </label>
                            <input
                                type="text"
                                placeholder="例如 1000000 / 98.5%"
                                value={result}
                                onChange={(e) => setResult(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                评级
                            </label>
                            <input
                                type="text"
                                placeholder="例如 S / A+ / FC"
                                value={rank}
                                onChange={(e) => setRank(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            备注
                        </label>
                        <textarea
                            placeholder="可以补充游玩心得或设备信息"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-24 w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    {message && isSuccess && (
                        <p className="text-sm text-green-600">{message}</p>
                    )}
                    {message && !isSuccess && (
                        <p className="text-sm text-red-600">{message}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full rounded-xl bg-black px-4 py-2 text-white"
                    >
                        提交战绩
                    </button>
                </form>
            </div>
        </main>
    );
}
