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

export default function GroupNewPage() {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [status, setStatus] = useState("预售中");
    const [deadline, setDeadline] = useState("");
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

    const handleUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
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
                    setIsUploading(false);
                    return;
                }
            }
            setImageUrls(uploaded);
        } catch (error) {
            console.error("图片上传失败：", error);
            setMessage("图片上传失败，请稍后再试");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setMessage("请先登录再发起开团");
            setIsSuccess(false);
            return;
        }
        if (!title || !description || !price || !stock || !imageUrls.length) {
            setMessage("请完整填写开团信息");
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
            const response = await fetch("/api/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    description,
                    imageUrls: imageUrls.join(","),
                    price: Number(price),
                    stock: Number(stock),
                    status,
                    deadline: deadline || null,
                    organizerId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success) {
                setTitle("");
                setDescription("");
                setPrice("");
                setStock("");
                setStatus("预售中");
                setDeadline("");
                setImageUrls([]);
                router.push("/groups");
            }
        } catch (error) {
            console.error("发起开团失败：", error);
            setMessage("发起开团失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-3xl px-6 py-16">
                <h1 className="text-3xl font-bold">发起开团</h1>
                <p className="mt-2 text-[var(--rc-muted)]">
                    填写开团信息，展示团购说明与商品详情。
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-3xl border border-[var(--rc-border)] bg-[var(--rc-bg)] p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            开团标题
                        </label>
                        <input
                            type="text"
                            placeholder="请输入开团标题"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            开团描述
                        </label>
                        <textarea
                            placeholder="请输入开团描述"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-32 w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                价格
                            </label>
                            <input
                                type="number"
                                placeholder="例如 88"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                库存
                            </label>
                            <input
                                type="number"
                                placeholder="例如 30"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                状态
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            >
                                <option value="预售中">预售中</option>
                                <option value="制作中">制作中</option>
                                <option value="已结束">已结束</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                截止日期
                            </label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            介绍图片（最多 9 张）
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUpload}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                        {imageUrls.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-3">
                                {imageUrls.map((url, index) => (
                                    <div
                                        key={url}
                                        className="relative overflow-hidden rounded-2xl border"
                                    >
                                        <img
                                            src={url}
                                            alt="开团图片"
                                            className="h-24 w-full object-cover"
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
                        {imageUrls.length > 0 && (
                            <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                默认第一张作为封面展示。
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
                        className="w-full rounded-xl bg-orange-500 px-4 py-2 text-white"
                    >
                        发布开团
                    </button>
                </form>
            </div>
        </main>
    );
}