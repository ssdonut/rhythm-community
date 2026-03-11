"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
};

const storageKey = "rc_user";

export default function BeatmapNewPage() {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [gameType, setGameType] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [fileName, setFileName] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return;
        }
        try {
            setUser(JSON.parse(raw));
        } catch {
            localStorage.removeItem(storageKey);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setMessage("请先登录后再发布谱面");
            setIsSuccess(false);
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
            const response = await fetch("/api/beatmaps", {
                method: "POST",
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
            if (result.success) {
                setTitle("");
                setDescription("");
                setDifficulty("");
                setGameType("");
                setFileUrl("");
                setFileName("");
                router.push("/beatmaps");
            }
        } catch (error) {
            console.error("发布谱面请求失败：", error);
            setMessage("发布谱面失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const handleUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
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
                setMessage(result.message || "文件上传失败");
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("文件上传请求失败：", error);
            setMessage("文件上传失败，请稍后再试");
            setIsSuccess(false);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold">发布谱面</h1>
                <p className="mt-3 text-[var(--rc-muted)]">
                    发布谱面文件与描述信息，方便玩家下载体验。
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border border-[var(--rc-border)] p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            谱面标题
                        </label>
                        <input
                            type="text"
                            placeholder="请输入谱面标题"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            谱面介绍
                        </label>
                        <textarea
                            placeholder="请输入谱面介绍"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-32 w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                难度
                            </label>
                            <input
                                type="text"
                                placeholder="例如 8.5 / Hard"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                游戏类型
                            </label>
                            <input
                                type="text"
                                placeholder="例如 osu! / maimai"
                                value={gameType}
                                onChange={(e) => setGameType(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            谱面文件
                        </label>
                        <input
                            type="file"
                            accept=".osz,.osu,.json,.zip,.rar,.7z"
                            onChange={handleUpload}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                        {fileName && (
                            <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                已选择文件：{fileName}
                            </p>
                        )}
                        {isUploading && (
                            <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                文件上传中...
                            </p>
                        )}
                    </div>

                    {message && isSuccess && (
                        <p className="text-sm text-green-600">{message}</p>
                    )}
                    {message && !isSuccess && (
                        <p className="text-sm text-red-600">{message}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isUploading}
                        className="w-full rounded-xl bg-black px-4 py-2 text-white"
                    >
                        发布谱面
                    </button>
                </form>
            </div>
        </main>
    );
}
