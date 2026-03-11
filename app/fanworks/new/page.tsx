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

export default function FanworkNewPage() {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [imageUrls, setImageUrls] = useState<string[]>([]);
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

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) {
            return;
        }
        if (files.length > 9) {
            setMessage("最多只能上传 9 张图片");
            setIsSuccess(false);
            return;
        }

        setMessage("");
        setIsSuccess(false);
        setIsUploading(true);

        try {
            const uploaded: string[] = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const result = await response.json();
                if (result.success && result.data) {
                    uploaded.push(result.data.url);
                } else {
                    setMessage(result.message || "图片上传失败");
                    setIsSuccess(false);
                    return;
                }
            }
            setImageUrls(uploaded);
        } catch (error) {
            console.error("图片上传请求失败：", error);
            setMessage("图片上传失败，请稍后再试");
            setIsSuccess(false);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setMessage("请先登录后再发布作品");
            setIsSuccess(false);
            return;
        }
        if (!title || !description || !tags.trim() || !imageUrls.length) {
            setMessage("请完整填写作品信息");
            setIsSuccess(false);
            return;
        }
        if (isUploading) {
            setMessage("图片正在上传，请稍后");
            setIsSuccess(false);
            return;
        }

        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch("/api/fanworks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    description,
                    imageUrls: imageUrls.join(","),
                    tags,
                    authorId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);

            if (result.success) {
                setTitle("");
                setDescription("");
                setTags("");
                setImageUrls([]);
                router.push("/fanworks");
            }
        } catch (error) {
            console.error("发布作品请求失败：", error);
            setMessage("发布作品失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold">发布作品</h1>
                <p className="mt-3 text-[var(--rc-muted)]">
                    上传作品图片并填写标签，方便大家浏览和检索。
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border border-[var(--rc-border)] p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            作品标题
                        </label>
                        <input
                            type="text"
                            placeholder="请输入作品标题"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            作品介绍
                        </label>
                        <textarea
                            placeholder="请输入作品介绍"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-32 w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            标签
                        </label>
                        <input
                            type="text"
                            placeholder="例如 插画, 初音未来, live2d"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            作品图片（最多 9 张）
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUpload}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                        {imageUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {imageUrls.map((url, index) => (
                                    <div
                                        key={url}
                                        className="relative overflow-hidden rounded-2xl border"
                                    >
                                        <img
                                            src={url}
                                            alt={`作品图片 ${index + 1}`}
                                            className="h-28 w-full object-cover"
                                        />
                                        {index === 0 && (
                                            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                                                封面
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {isUploading && (
                            <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                图片上传中...
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
                        发布作品
                    </button>
                </form>
            </div>
        </main>
    );
}
