"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
    role?: string | null;
    isBanned?: boolean | null;
};

type BeatmapDetail = {
    id: number;
    title: string;
    description: string;
    difficulty: string;
    gameType: string;
    fileUrl: string;
    createdAt: string;
    uploaderId: number;
    uploader: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

export default function BeatmapDetailPage() {
    const params = useParams();
    const beatmapId = Number(params.id);
    const [beatmap, setBeatmap] = useState<BeatmapDetail | null>(null);
    const [message, setMessage] = useState("");
    const [user, setUser] = useState<StoredUser | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [gameType, setGameType] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        const raw = localStorage.getItem("rc_user");
        if (!raw) {
            return;
        }
        try {
            setUser(JSON.parse(raw));
        } catch {
            localStorage.removeItem("rc_user");
        }
    }, []);

    useEffect(() => {
        if (!beatmapId) {
            return;
        }
        fetch(`/api/beatmaps/${beatmapId}`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setBeatmap(result.data);
                    setTitle(result.data.title);
                    setDescription(result.data.description);
                    setDifficulty(result.data.difficulty);
                    setGameType(result.data.gameType);
                    setFileUrl(result.data.fileUrl);
                    return;
                }
                setMessage(result.message || "加载谱面失败");
            })
            .catch(() => setMessage("加载谱面失败"));
    }, [beatmapId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await fetch("/api/beatmaps/upload", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            if (result.success && result.data) {
                setFileUrl(result.data.url);
                setFileName(result.data.filename || "");
            } else {
                setMessage(result.message || "上传失败");
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("请求上传失败：", error);
            setMessage("上传失败，请稍后再试");
            setIsSuccess(false);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdate = async () => {
        if (!user || !beatmap) {
            return;
        }
        if (!title || !description || !difficulty || !gameType || !fileUrl) {
            setMessage("请完整填写谱面信息");
            setIsSuccess(false);
            return;
        }
        if (isUploading) {
            setMessage("文件正在上传，请稍后");
            setIsSuccess(false);
            return;
        }

        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch(`/api/beatmaps/${beatmap.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    description,
                    difficulty,
                    gameType,
                    fileUrl,
                    uploaderId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setBeatmap((prev) =>
                    prev
                        ? {
                              ...prev,
                              title: result.data.title,
                              description: result.data.description,
                              difficulty: result.data.difficulty,
                              gameType: result.data.gameType,
                              fileUrl: result.data.fileUrl,
                          }
                        : prev
                );
                setIsEditing(false);
            }
        } catch (error) {
            console.error("更新谱面失败：", error);
            setMessage("更新谱面失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const handleDelete = async () => {
        if (!user || !beatmap) {
            return;
        }
        const confirmed = window.confirm("确认删除这个谱面吗？");
        if (!confirmed) {
            return;
        }

        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch(`/api/beatmaps/${beatmap.id}`, {
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
                window.location.href = "/beatmaps";
            }
        } catch (error) {
            console.error("删除谱面失败：", error);
            setMessage("删除谱面失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-4xl px-6 py-16">
                <div className="flex items-center justify-between">
                    <Link
                        href="/beatmaps"
                        className="text-sm text-[var(--rc-muted)]"
                    >
                        返回谱面列表
                    </Link>
                    <Link
                        href="/beatmaps/new"
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                        发布谱面
                    </Link>
                </div>

                {beatmap ? (
                    <div className="mt-8 rounded-2xl border p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-xl border px-4 py-2 text-2xl font-bold outline-none"
                                />
                            ) : (
                                <h1 className="text-3xl font-bold">
                                    {beatmap.title}
                                </h1>
                            )}
                            {user &&
                                (user.id === beatmap.uploaderId || isAdmin) && (
                                    <div className="flex flex-wrap gap-2">
                                        {isEditing &&
                                        user.id === beatmap.uploaderId ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handleUpdate}
                                                    className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                                                >
                                                    保存修改
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsEditing(false)
                                                    }
                                                    className="rounded-lg border px-4 py-2 text-sm text-[var(--rc-text)]"
                                                >
                                                    取消
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {user.id === beatmap.uploaderId && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setIsEditing(true)
                                                        }
                                                        className="rounded-lg border px-4 py-2 text-sm text-[var(--rc-text)]"
                                                    >
                                                        编辑谱面
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={handleDelete}
                                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600"
                                                >
                                                    删除谱面
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[var(--rc-muted)]">
                            <Link
                                href={`/users/${beatmap.uploader.id}`}
                                className="inline-flex items-center gap-2"
                            >
                                {beatmap.uploader.avatar ? (
                                    <img
                                        src={beatmap.uploader.avatar}
                                        alt="上传者头像"
                                        className="h-8 w-8 rounded-full border object-cover"
                                    />
                                ) : (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                        无
                                    </span>
                                )}
                                <span>
                                    {beatmap.uploader.nickname ||
                                        beatmap.uploader.username}
                                </span>
                                {beatmap.uploader.role === "admin" && (
                                    <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                        管理员
                                    </span>
                                )}
                            </Link>
                            <span>・</span>
                            <span>
                                {new Date(beatmap.createdAt).toLocaleString(
                                    "zh-CN"
                                )}
                            </span>
                        </div>

                        <div className="mt-4 text-sm text-[var(--rc-muted)]">
                            {isEditing ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        value={difficulty}
                                        onChange={(e) =>
                                            setDifficulty(e.target.value)
                                        }
                                        placeholder="难度"
                                        className="w-full rounded-xl border px-4 py-2 outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={gameType}
                                        onChange={(e) =>
                                            setGameType(e.target.value)
                                        }
                                        placeholder="游戏类型"
                                        className="w-full rounded-xl border px-4 py-2 outline-none"
                                    />
                                </div>
                            ) : (
                                <>
                                    难度：{beatmap.difficulty} ・ 类型：
                                    {beatmap.gameType}
                                </>
                            )}
                        </div>

                        {isEditing ? (
                            <textarea
                                value={description}
                                onChange={(e) =>
                                    setDescription(e.target.value)
                                }
                                className="mt-6 min-h-32 w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        ) : (
                            <p className="mt-6 whitespace-pre-wrap text-[var(--rc-text)]">
                                {beatmap.description}
                            </p>
                        )}

                        <div className="mt-6 rounded-xl border bg-[rgba(15,23,42,0.6)] p-4">
                            <p className="text-sm text-[var(--rc-muted)]">
                                谱面文件
                            </p>
                            {isEditing ? (
                                <>
                                    <input
                                        type="file"
                                        accept=".osz,.osu,.json,.zip,.rar,.7z"
                                        onChange={handleUpload}
                                        className="mt-2 w-full rounded-xl border px-4 py-2 outline-none"
                                    />
                                    {fileName && (
                                        <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                            已选择：{fileName}
                                        </p>
                                    )}
                                    {isUploading && (
                                        <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                            文件上传中...
                                        </p>
                                    )}
                                </>
                            ) : (
                                <a
                                    href={beatmap.fileUrl}
                                    className="mt-2 inline-block text-sm text-blue-600 underline"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    点击下载谱面文件
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="mt-8 text-sm text-[var(--rc-muted)]">
                        正在加载谱面...
                    </p>
                )}

                {message && isSuccess && (
                    <p className="mt-6 text-sm text-green-600">{message}</p>
                )}
                {message && !isSuccess && (
                    <p className="mt-6 text-sm text-red-600">{message}</p>
                )}
            </div>
        </main>
    );
}
