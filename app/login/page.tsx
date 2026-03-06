"use client";

import { useState } from "react";

export default function LoginPage() {
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!account || !password) {
            setMessage("账号和密码不能为空");
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
                setPassword("");
            }
            console.log("登录接口返回：", result);
        } catch (error) {
            console.error("请求登录接口失败：", error);
            setMessage("请求失败，请稍后重试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
                <h1 className="text-3xl font-bold">用户登录</h1>
                <p className="mt-3 text-gray-600">
                    请输入用户名或邮箱和密码登录系统。
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            用户名或邮箱
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
                        <label className="mb-2 block text-sm font-medium">密码</label>
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