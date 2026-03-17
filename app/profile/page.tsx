"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
    role?: string | null;
    isBanned?: boolean | null;
};

const storageKey = "rc_user";

export default function ProfilePage() {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [savedNickname, setSavedNickname] = useState("");
    const [savedAvatar, setSavedAvatar] = useState("");
    const [editNickname, setEditNickname] = useState("");
    const [editAvatar, setEditAvatar] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const updateStoredUser = (next: StoredUser) => {
        localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(new Event("rc-user-updated"));
    };

    useEffect(() => {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return;
        }
        try {
            const storedUser = JSON.parse(raw) as StoredUser;
            setUser(storedUser);
            fetch(`/api/profile?id=${storedUser.id}`)
                .then((response) => response.json())
                .then((result) => {
                    if (result.success && result.data) {
                        const nextNickname = result.data.nickname ?? "";
                        const nextAvatar = result.data.avatar ?? "";
                        setSavedNickname(nextNickname);
                        setSavedAvatar(nextAvatar);
                        setEditNickname(nextNickname);
                        setEditAvatar(nextAvatar);
                        updateStoredUser({
                            ...storedUser,
                            nickname: nextNickname || null,
                            avatar: nextAvatar || null,
                            role: result.data.role ?? storedUser.role ?? null,
                            isBanned:
                                result.data.isBanned ??
                                storedUser.isBanned ??
                                null,
                        });
                    }
                })
                .catch(() => {
                    setMessage("加载个人信息失败，请稍后再试");
                    setIsSuccess(false);
                });
        } catch {
            localStorage.removeItem(storageKey);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: user.id,
                    nickname: editNickname,
                    avatar: editAvatar,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data && user) {
                const nextNickname = result.data.nickname ?? "";
                const nextAvatar = result.data.avatar ?? "";
                setSavedNickname(nextNickname);
                setSavedAvatar(nextAvatar);
                updateStoredUser({
                    ...user,
                    nickname: nextNickname || null,
                    avatar: nextAvatar || null,
                    role: result.data.role ?? user.role ?? null,
                    isBanned: result.data.isBanned ?? user.isBanned ?? null,
                });
            }
        } catch (error) {
            console.error("更新个人信息失败：", error);
            setMessage("更新个人信息失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        const maxFileSize = 2 * 1024 * 1024;
        if (file.size > maxFileSize) {
            setMessage("头像文件不能超过 2MB");
            setIsSuccess(false);
            return;
        }
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                setMessage("读取头像失败，请重试");
                setIsSuccess(false);
                setIsUploading(false);
                return;
            }
            const img = new Image();
            img.onload = () => {
                const maxSize = 256;
                const scale = Math.min(
                    1,
                    maxSize / img.width,
                    maxSize / img.height
                );
                const targetWidth = Math.max(1, Math.round(img.width * scale));
                const targetHeight = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement("canvas");
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    setMessage("处理头像失败，请重试");
                    setIsSuccess(false);
                    setIsUploading(false);
                    return;
                }
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                const compressed = canvas.toDataURL("image/jpeg", 0.8);
                setEditAvatar(compressed);
                setIsUploading(false);
            };
            img.onerror = () => {
                setMessage("处理头像失败，请重试");
                setIsSuccess(false);
                setIsUploading(false);
            };
            img.src = result;
        };
        reader.onerror = () => {
            setMessage("读取头像失败，请重试");
            setIsSuccess(false);
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteAccount = async () => {
        if (!user) {
            return;
        }

        const confirmed = window.confirm(
            "确认注销账号吗？此操作会删除你的个人资料、帖子、评论、谱面、同人、战绩和开团记录，且无法恢复。"
        );
        if (!confirmed) {
            return;
        }

        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch("/api/profile", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);

            if (result.success) {
                localStorage.removeItem(storageKey);
                window.dispatchEvent(new Event("rc-user-updated"));
                setUser(null);
                router.push("/register");
            }
        } catch (error) {
            console.error("注销账号失败：", error);
            setMessage("注销账号失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    if (!user) {
        return (
            <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
                <div className="mx-auto max-w-3xl px-6 py-16">
                    <h1 className="text-3xl font-bold">个人中心</h1>
                    <p className="mt-4 text-[var(--rc-muted)]">
                        请先登录后查看和编辑个人信息。
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold">个人中心</h1>
                <div className="mt-8 rounded-2xl border border-[var(--rc-border)] p-6 shadow-sm">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <p className="text-sm text-[var(--rc-muted)]">头像</p>
                            {savedAvatar ? (
                                <img
                                    src={savedAvatar}
                                    alt="用户头像"
                                    className="mt-3 h-20 w-20 rounded-full border object-cover"
                                />
                            ) : (
                                <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                    暂未设置头像
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-[var(--rc-muted)]">用户名</p>
                            <div className="mt-1 flex items-center gap-2 text-lg font-medium">
                                <span>{user.username}</span>
                                {user.role === "admin" && (
                                    <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                                        管理员
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--rc-muted)]">昵称</p>
                            <p className="mt-1 text-lg font-medium">
                                {savedNickname || "暂无"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--rc-muted)]">邮箱</p>
                            <p className="mt-1 text-lg font-medium">
                                {user.email}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--rc-muted)]">用户ID</p>
                            <p className="mt-1 text-lg font-medium">
                                {user.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <a
                        href={`/scores/user/${user.id}`}
                        className="rounded-xl border px-4 py-2 text-sm text-[var(--rc-text)]"
                    >
                        查看我的战绩图
                    </a>
                    <a
                        href="/scores/new"
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                        添加战绩
                    </a>
                    <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="rounded-xl border border-red-300 px-4 py-2 text-sm text-red-600"
                    >
                        注销账号
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border border-[var(--rc-border)] p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            昵称
                        </label>
                        <input
                            type="text"
                            placeholder="请输入昵称"
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            上传头像
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                        <p className="mt-2 text-sm text-[var(--rc-muted)]">
                            头像将压缩到 256x256 以内以确保显示正常。
                        </p>
                        {editAvatar ? (
                            <img
                                src={editAvatar}
                                alt="预览头像"
                                className="mt-3 h-16 w-16 rounded-full border object-cover"
                            />
                        ) : null}
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
                        保存修改
                    </button>
                </form>
            </div>
        </main>
    );
}
