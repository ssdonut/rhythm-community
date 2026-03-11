"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type UserInfo = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
    role?: string | null;
    isBanned?: boolean | null;
};

type ScoreItem = {
    id: number;
    game: string;
    songTitle: string;
    difficulty: string;
    result: string;
    rank: string;
    comment?: string | null;
    createdAt: string;
};

type PostItem = {
    id: number;
    title: string;
    content: string;
    createdAt: string;
};

export default function UserProfilePage() {
    const params = useParams();
    const userId = Number(params.id);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [records, setRecords] = useState<ScoreItem[]>([]);
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [message, setMessage] = useState("");
    const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [selectedGame, setSelectedGame] = useState("");
    const [selectedSong, setSelectedSong] = useState("");
    const gameChartRef = useRef<HTMLCanvasElement | null>(null);
    const gameChartInstance = useRef<any>(null);
    const songChartInstances = useRef<any[]>([]);

    useEffect(() => {
        if (!userId) {
            return;
        }
        fetch(`/api/profile?id=${userId}`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setUser(result.data);
                    return;
                }
                setMessage(result.message || "加载用户信息失败");
            })
            .catch(() => setMessage("加载用户信息失败"));
    }, [userId]);

    useEffect(() => {
        const raw = localStorage.getItem("rc_user");
        if (!raw) {
            return;
        }
        try {
            setCurrentUser(JSON.parse(raw));
        } catch {
            localStorage.removeItem("rc_user");
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            return;
        }
        fetch(`/api/scores/user/${userId}`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setRecords(result.data);
                    return;
                }
                setMessage(result.message || "加载战绩失败");
            })
            .catch(() => setMessage("加载战绩失败"));
    }, [userId]);

    useEffect(() => {
        if (!userId) {
            return;
        }
        fetch(`/api/posts/user/${userId}`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setPosts(result.data);
                    return;
                }
                setMessage(result.message || "加载发帖记录失败");
            })
            .catch(() => setMessage("加载发帖记录失败"));
    }, [userId]);

    const handleBanToggle = async () => {
        if (!currentUser || !user) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch("/api/admin/ban", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    adminId: currentUser.id,
                    targetUserId: user.id,
                    isBanned: !user.isBanned,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setUser(result.data);
            }
        } catch (error) {
            console.error("更新封禁状态失败：", error);
            setMessage("更新封禁状态失败");
            setIsSuccess(false);
        }
    };

    const games = useMemo(() => {
        return Array.from(new Set(records.map((item) => item.game)));
    }, [records]);

    const songs = useMemo(() => {
        const filtered = selectedGame
            ? records.filter((item) => item.game === selectedGame)
            : records;
        return Array.from(new Set(filtered.map((item) => item.songTitle)));
    }, [records, selectedGame]);

    useEffect(() => {
        if (!selectedGame && games.length) {
            setSelectedGame(games[0]);
        }
    }, [games, selectedGame]);

    useEffect(() => {
        if (!selectedSong && songs.length) {
            setSelectedSong(songs[0]);
        }
    }, [songs, selectedSong]);

    const parseResultValue = (value: string) => {
        if (!value) {
            return null;
        }
        const percentMatch = value.match(/(\d+(\.\d+)?)\s*%/);
        if (percentMatch) {
            return Number(percentMatch[1]);
        }
        const numberMatch = value.match(/(\d+(\.\d+)?)/);
        return numberMatch ? Number(numberMatch[1]) : null;
    };

    useEffect(() => {
        if (!gameChartRef.current || !selectedGame) {
            return;
        }
        let disposed = false;
        const buildChart = async () => {
            const module = await import("chart.js/auto");
            const Chart = module.default || module.Chart;
            if (disposed || !gameChartRef.current) {
                return;
            }
            if (gameChartInstance.current) {
                gameChartInstance.current.destroy();
                gameChartInstance.current = null;
            }
            const existingChart = Chart.getChart(gameChartRef.current);
            if (existingChart) {
                existingChart.destroy();
            }
            const gameRecords = records.filter(
                (item) => item.game === selectedGame
            );
            const rankCounts = gameRecords.reduce(
                (acc, item) => {
                    acc[item.rank] = (acc[item.rank] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>
            );
            const labels = Object.keys(rankCounts);
            const data = labels.map((label) => rankCounts[label]);
            gameChartInstance.current = new Chart(gameChartRef.current, {
                type: "pie",
                data: {
                    labels,
                    datasets: [
                        {
                            data,
                            backgroundColor: [
                                "#0f172a",
                                "#1e293b",
                                "#334155",
                                "#64748b",
                                "#94a3b8",
                                "#cbd5f5",
                            ],
                        },
                    ],
                },
                options: {
                    plugins: {
                        legend: {
                            position: "bottom",
                        },
                    },
                },
            });
        };
        void buildChart();

        return () => {
            disposed = true;
            if (gameChartInstance.current) {
                gameChartInstance.current.destroy();
                gameChartInstance.current = null;
            }
        };
    }, [records, selectedGame]);

    useEffect(() => {
        songChartInstances.current.forEach((chart) => chart.destroy());
        songChartInstances.current = [];
        let disposed = false;
        const renderCharts = async () => {
            const module = await import("chart.js/auto");
            const Chart = module.default || module.Chart;
            if (disposed) {
                return;
            }
            const filtered = records.filter(
                (item) =>
                    (!selectedGame || item.game === selectedGame) &&
                    (!selectedSong || item.songTitle === selectedSong)
            );
            const grouped = filtered.reduce(
                (acc, item) => {
                    const key = item.difficulty;
                    acc[key] = acc[key] || [];
                    acc[key].push(item);
                    return acc;
                },
                {} as Record<string, ScoreItem[]>
            );

            Object.entries(grouped).forEach(([difficulty, items]) => {
                const canvas = document.getElementById(
                    `song-chart-${difficulty}`
                ) as HTMLCanvasElement | null;
                if (!canvas) {
                    return;
                }
                const existingChart = Chart.getChart(canvas);
                if (existingChart) {
                    existingChart.destroy();
                }
                const sorted = [...items].sort(
                    (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                );
                const labels = sorted.map((item) =>
                    new Date(item.createdAt).toLocaleDateString("zh-CN")
                );
                const data = sorted
                    .map((item) => parseResultValue(item.result))
                    .filter((value) => value !== null) as number[];

                if (!data.length) {
                    return;
                }
                if (disposed) {
                    return;
                }

                const chart = new Chart(canvas, {
                    type: "line",
                    data: {
                        labels,
                        datasets: [
                            {
                                label: `${selectedSong} - ${difficulty}`,
                                data,
                                borderColor: "#2563eb",
                                backgroundColor: "rgba(37, 99, 235, 0.2)",
                                tension: 0.2,
                                fill: true,
                            },
                        ],
                    },
                    options: {
                        plugins: {
                            legend: {
                                position: "bottom",
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                            },
                        },
                    },
                });
                songChartInstances.current.push(chart);
            });
        };
        void renderCharts();

        return () => {
            disposed = true;
            songChartInstances.current.forEach((chart) => chart.destroy());
            songChartInstances.current = [];
        };
    }, [records, selectedGame, selectedSong]);

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-5xl px-6 py-16">
                <div className="flex items-center justify-between">
                    <Link href="/forum" className="text-sm text-[var(--rc-muted)]">
                        返回论坛
                    </Link>
                    <Link
                        href="/scores"
                        className="rounded-xl border px-4 py-2 text-sm text-[var(--rc-text)]"
                    >
                        我的战绩
                    </Link>
                </div>

                {user ? (
                    <div className="mt-8 rounded-2xl border p-6 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt="用户头像"
                                    className="h-16 w-16 rounded-full border object-cover"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-sm text-[var(--rc-muted)]">
                                    暂无头像
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {user.nickname || user.username}
                                </h1>
                                {user.role === "admin" && (
                                    <span className="mt-2 inline-flex rounded-full bg-black px-2 py-0.5 text-xs text-white">
                                        管理员
                                    </span>
                                )}
                                {currentUser?.role === "admin" &&
                                    user.role !== "admin" && (
                                        <button
                                            type="button"
                                            onClick={handleBanToggle}
                                            className="mt-3 inline-flex rounded-full border px-3 py-1 text-xs text-[var(--rc-text)]"
                                        >
                                            {user.isBanned
                                                ? "解除封禁"
                                                : "封禁用户"}
                                        </button>
                                    )}
                                <p className="mt-1 text-sm text-[var(--rc-muted)]">
                                    用户名：{user.username}
                                </p>
                                <p className="mt-1 text-sm text-[var(--rc-muted)]">
                                    邮箱：{user.email}
                                </p>
                                {user.isBanned && (
                                    <p className="mt-2 text-sm text-red-600">
                                        已被封禁
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="mt-8 text-sm text-[var(--rc-muted)]">
                        正在加载用户信息...
                    </p>
                )}

                <div className="mt-10">
                    <h2 className="text-xl font-semibold">战绩记录</h2>
                    {message && isSuccess && (
                        <p className="mt-4 text-sm text-green-600">
                            {message}
                        </p>
                    )}
                    {message && !isSuccess && (
                        <p className="mt-4 text-sm text-red-600">{message}</p>
                    )}
                    <div className="mt-4 space-y-4">
                        {records.map((record) => (
                            <div
                                key={record.id}
                                className="rounded-2xl border p-6 shadow-sm"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {record.songTitle}
                                        </h3>
                                        <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                            难度：{record.difficulty}
                                        </p>
                                        <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                            游戏：{record.game}
                                        </p>
                                        <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                            成绩：{record.result} · 评级：
                                            {record.rank}
                                        </p>
                                        {record.comment && (
                                            <p className="mt-3 text-sm text-[var(--rc-muted)]">
                                                备注：{record.comment}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right text-sm text-[var(--rc-muted)]">
                                        <p>
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
                                暂无战绩记录。
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-xl font-semibold">战绩图表</h2>
                    <p className="mt-2 text-sm text-[var(--rc-muted)]">
                        选择游戏和曲目，查看评价分布与成绩趋势。
                    </p>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                游戏
                            </label>
                            <select
                                value={selectedGame}
                                onChange={(e) =>
                                    setSelectedGame(e.target.value)
                                }
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            >
                                {games.map((game) => (
                                    <option key={game} value={game}>
                                        {game}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                曲目
                            </label>
                            <select
                                value={selectedSong}
                                onChange={(e) =>
                                    setSelectedSong(e.target.value)
                                }
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            >
                                {songs.map((song) => (
                                    <option key={song} value={song}>
                                        {song}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                        <div className="rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-lg font-semibold">
                                评价分布（按游戏）
                            </h3>
                            <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                当前游戏：{selectedGame || "暂无"}
                            </p>
                            <div className="mt-4">
                                <canvas
                                    ref={gameChartRef}
                                    style={{ maxWidth: "300px", maxHeight: "300px" }}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border p-6 shadow-sm">
                            <h3 className="text-lg font-semibold">
                                成绩趋势（按曲目与难度）
                            </h3>
                            <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                当前曲目：{selectedSong || "暂无"}
                            </p>
                            <div className="mt-4 space-y-6">
                                {records
                                    .filter(
                                        (item) =>
                                            (!selectedGame ||
                                                item.game ===
                                                    selectedGame) &&
                                            (!selectedSong ||
                                                item.songTitle ===
                                                    selectedSong)
                                    )
                                    .reduce(
                                        (acc, item) => {
                                            if (!acc.includes(item.difficulty)) {
                                                acc.push(item.difficulty);
                                            }
                                            return acc;
                                        },
                                        [] as string[]
                                    )
                                    .map((difficulty) => (
                                        <div key={difficulty}>
                                            <p className="text-sm font-medium text-[var(--rc-text)]">
                                                难度：{difficulty}
                                            </p>
                                            <div className="mt-2">
                                                <canvas
                                                    id={`song-chart-${difficulty}`}
                                                    style={{
                                                        maxWidth: "300px",
                                                        maxHeight: "300px",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                {!records.length && (
                                    <p className="text-sm text-[var(--rc-muted)]">
                                        暂无战绩数据，无法生成图表。
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <h2 className="text-xl font-semibold">发帖记录</h2>
                    <div className="mt-4 space-y-4">
                        {posts.map((post) => (
                            <Link
                                key={post.id}
                                href={`/forum/${post.id}`}
                                className="block rounded-2xl border p-5 shadow-sm transition hover:border-[var(--rc-border)]"
                            >
                                <h3 className="text-lg font-semibold">
                                    {post.title}
                                </h3>
                                <p className="mt-2 line-clamp-2 text-sm text-[var(--rc-muted)]">
                                    {post.content}
                                </p>
                                <p className="mt-3 text-xs text-[var(--rc-muted)]">
                                    {new Date(
                                        post.createdAt
                                    ).toLocaleString("zh-CN")}
                                </p>
                            </Link>
                        ))}
                        {!posts.length && (
                            <div className="rounded-2xl border border-dashed p-8 text-center text-[var(--rc-muted)]">
                                暂无发帖记录。
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
