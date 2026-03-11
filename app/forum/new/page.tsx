"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FORUM_SECTIONS, getForumSectionMeta } from "@/lib/forum-sections";

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
};

const storageKey = "rc_user";

export default function NewPostPage() {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [section, setSection] = useState("general");
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

    const sectionMeta = getForumSectionMeta(section);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setMessage("请先登录后再发帖");
            setIsSuccess(false);
            return;
        }
        if (!title || !content) {
            setMessage("请完整填写帖子信息");
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
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    content,
                    imageUrl,
                    section,
                    authorId: user.id,
                }),
            });

            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success) {
                setTitle("");
                setContent("");
                setImageUrl("");
                setSection("general");
                router.push("/forum");
            }
        } catch (error) {
            console.error("发帖请求失败：", error);
            setMessage("发帖失败，请稍后再试");
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
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            if (result.success && result.data) {
                setImageUrl(result.data.url);
            } else {
                setMessage(result.message || "图片上传失败");
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("图片上传请求失败：", error);
            setMessage("图片上传失败，请稍后再试");
            setIsSuccess(false);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold">发布帖子</h1>
                <p className="mt-3 text-[var(--rc-muted)]">
                    发帖时选择一个合适的专区。
                </p>

                <div className="mt-6 rounded-2xl border border-[var(--rc-border)] p-4">
                    <p className="text-sm font-medium">当前选择专区</p>
                    <p className="mt-2 inline-flex rounded-full bg-black px-3 py-1 text-sm text-white">
                        {sectionMeta.name}
                    </p>
                    <p className="mt-2 text-sm text-[var(--rc-muted)]">
                        {sectionMeta.description}
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border border-[var(--rc-border)] p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            所属专区
                        </label>
                        <select
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        >
                            {FORUM_SECTIONS.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            帖子标题
                        </label>
                        <input
                            type="text"
                            placeholder="请输入帖子标题"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            帖子内容
                        </label>
                        <textarea
                            placeholder="请输入帖子内容"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-40 w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            帖子图片
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUpload}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                        {imageUrl && (
                            <img
                                src={imageUrl}
                                alt="帖子图片"
                                className="mt-3 max-h-64 w-full max-w-2xl rounded-2xl border object-contain bg-[rgba(15,23,42,0.6)]"
                            />
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
                        发布帖子
                    </button>
                </form>
            </div>
        </main>
    );
}
