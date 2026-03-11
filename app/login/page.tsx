"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const storageKey = "rc_user";

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!account || !password) {
            setMessage("请输入账号和密码");
            setIsSuccess(false);
            return;
        }

        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    account,
                    password,
                }),
            });

            const result = await response.json();

            setMessage(result.message);
            setIsSuccess(result.success);

            if (result.success) {
                if (result.data) {
                    const nextUser = result.data;
                    try {
                        const profileResponse = await fetch(
                            `/api/profile?id=${nextUser.id}`
                        );
                        const profileResult = await profileResponse.json();
                        if (profileResult.success && profileResult.data) {
                            nextUser.nickname =
                                profileResult.data.nickname ?? null;
                            nextUser.avatar =
                                profileResult.data.avatar ?? null;
                            nextUser.role = profileResult.data.role ?? null;
                            nextUser.isBanned =
                                profileResult.data.isBanned ?? null;
                        }
                    } catch {
                        // Keep base user info if profile fetch fails.
                    }
                    localStorage.setItem(storageKey, JSON.stringify(nextUser));
                    window.dispatchEvent(new Event("rc-user-updated"));
                }
                setPassword("");
                router.push("/");
            }
        } catch (error) {
            console.error("登录失败：", error);
            setMessage("登录失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
                <h1 className="text-3xl font-bold">登录</h1>
                <p className="mt-3 text-[var(--rc-muted)]">
                    输入用户名或邮箱，登录你的社区账号。
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            账号或邮箱
                        </label>
                        <input
                            type="text"
                            placeholder="请输入用户名或邮箱"
                            value={account}
                            onChange={(e) => setAccount(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            密码
                        </label>
                        <input
                            type="password"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
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
                        登录
                    </button>
                </form>
            </div>
        </main>
    );
}
