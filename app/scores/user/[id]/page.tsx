"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Chart as ChartJS } from "chart.js/auto";

type UserInfo = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
    role?: string | null;
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
    user: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

export default function UserScorePage() {
    const params = useParams();
    const userId = Number(params.id);
    const [records, setRecords] = useState<ScoreItem[]>([]);
    const [user, setUser] = useState<UserInfo | null>(null);
    const [message, setMessage] = useState("");
    const [selectedGame, setSelectedGame] = useState("");
    const [selectedSong, setSelectedSong] = useState("");
    const gameChartRef = useRef<HTMLCanvasElement | null>(null);
    const gameChartInstance = useRef<ChartJS | null>(null);
    const songChartInstances = useRef<ChartJS[]>([]);

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

    const games = useMemo(
        () => Array.from(new Set(records.map((item) => item.game))),
        [records]
    );

    const songs = useMemo(() => {
        const filtered = selectedGame
            ? records.filter((item) => item.game === selectedGame)
            : records;
        return Array.from(new Set(filtered.map((item) => item.songTitle)));
    }, [records, selectedGame]);

    useEffect(() => {
        if (games.length && !games.includes(selectedGame)) {
            setSelectedGame(games[0]);
        }
        if (!games.length && selectedGame) {
            setSelectedGame("");
        }
    }, [games, selectedGame]);

    useEffect(() => {
        if (songs.length && !songs.includes(selectedSong)) {
            setSelectedSong(songs[0]);
        }
        if (!songs.length && selectedSong) {
            setSelectedSong("");
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
            const chartModule = await import("chart.js/auto");
            const Chart = chartModule.default || chartModule.Chart;
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

            if (!labels.length) {
                return;
            }

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
                                "#cbd5e1",
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
            const chartModule = await import("chart.js/auto");
            const Chart = chartModule.default || chartModule.Chart;
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
                const points = sorted
                    .map((item) => ({
                        label: new Date(item.createdAt).toLocaleDateString(
                            "zh-CN"
                        ),
                        value: parseResultValue(item.result),
                    }))
                    .filter((item) => item.value !== null) as {
                    label: string;
                    value: number;
                }[];

                if (!points.length || disposed) {
                    return;
                }

                const chart = new Chart(canvas, {
                    type: "line",
                    data: {
                        labels: points.map((item) => item.label),
                        datasets: [
                            {
                                label: `${selectedSong} - ${difficulty}`,
                                data: points.map((item) => item.value),
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

    const filteredDifficulties = Array.from(
        new Set(
            records
                .filter(
                    (item) =>
                        (!selectedGame || item.game === selectedGame) &&
                        (!selectedSong || item.songTitle === selectedSong)
                )
                .map((item) => item.difficulty)
        )
    );

    const userName = user?.nickname || user?.username || "该用户";

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-5xl px-6 py-16">
                <div className="flex items-center justify-between">
                    <Link
                        href="/scores"
                        className="rounded-xl border px-4 py-2 text-sm text-[var(--rc-text)]"
                    >
                        返回我的战绩
                    </Link>
                    <Link
                        href="/scores/new"
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                        添加战绩
                    </Link>
                </div>

                <div className="mt-8 rounded-2xl border p-6 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt="用户头像"
                                className="h-16 w-16 rounded-full border object-cover"
                            />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-sm text-[var(--rc-muted)]">
                                无头像
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold">
                                {userName}的战绩图表
                            </h1>
                            <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                按游戏、曲目和难度查看评级分布与成绩趋势。
                            </p>
                        </div>
                    </div>
                </div>

                {message && (
                    <p className="mt-6 text-sm text-red-600">{message}</p>
                )}

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            游戏
                        </label>
                        <select
                            value={selectedGame}
                            onChange={(e) => setSelectedGame(e.target.value)}
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
                            onChange={(e) => setSelectedSong(e.target.value)}
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
                        <h2 className="text-lg font-semibold">
                            评级分布
                        </h2>
                        <p className="mt-2 text-sm text-[var(--rc-muted)]">
                            当前游戏：{selectedGame || "暂无"}
                        </p>
                        <div className="mt-4">
                            <canvas
                                ref={gameChartRef}
                                style={{ maxWidth: "320px", maxHeight: "320px" }}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border p-6 shadow-sm">
                        <h2 className="text-lg font-semibold">
                            成绩趋势
                        </h2>
                        <p className="mt-2 text-sm text-[var(--rc-muted)]">
                            当前曲目：{selectedSong || "暂无"}
                        </p>
                        <div className="mt-4 space-y-6">
                            {filteredDifficulties.map((difficulty) => (
                                <div key={difficulty}>
                                    <p className="text-sm font-medium">
                                        难度：{difficulty}
                                    </p>
                                    <div className="mt-2">
                                        <canvas
                                            id={`song-chart-${difficulty}`}
                                            style={{
                                                maxWidth: "360px",
                                                maxHeight: "320px",
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

                <div className="mt-10">
                    <h2 className="text-xl font-semibold">战绩明细</h2>
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
            </div>
        </main>
    );
}
