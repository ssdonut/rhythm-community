"use client";

import { useState } from "react";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            setMessage("请输入用户名、邮箱、密码和确认密码");
            setIsSuccess(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage("请输入正确的邮箱地址");
            setIsSuccess(false);
            return;
        }

        if (password.length < 6) {
            setMessage("密码长度不能少于 6 位");
            setIsSuccess(false);
            return;
        }

        if (password !== confirmPassword) {
            setMessage("两次输入的密码不一致");
            setIsSuccess(false);
            return;
        }

        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                }),
            });

            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);

            if (result.success) {
                setUsername("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
            }
        } catch (error) {
            console.error("注册失败：", error);
            setMessage("注册失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
                <h1 className="text-3xl font-bold">注册</h1>
                <p className="mt-3 text-[var(--rc-muted)]">
                    创建一个社区账号，开始发布和参与讨论。
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            用户名
                        </label>
                        <input
                            type="text"
                            placeholder="请输入用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            邮箱
                        </label>
                        <input
                            type="email"
                            placeholder="请输入邮箱"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            确认密码
                        </label>
                        <input
                            type="password"
                            placeholder="请再次输入密码"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                        注册
                    </button>
                </form>
            </div>
        </main>
    );
}
