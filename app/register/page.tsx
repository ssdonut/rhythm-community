"use client";

import { useState } from "react";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username || !email || !password) {
            setMessage("用户名、邮箱和密码不能为空");
            setIsSuccess(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            setMessage("请输入正确的邮箱格式");
            setIsSuccess(false);
            return;
        }

        if (password.length < 6) {
            setMessage("密码长度不能少于6位");
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
            }

            console.log("注册接口返回：", result);
        } catch (error) {
            console.error("请求注册接口失败：", error);
            setMessage("请求失败，请稍后重试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
                <h1 className="text-3xl font-bold">用户注册</h1>
                <p className="mt-3 text-gray-600">
                    这是音游论坛交流平台的注册页面。
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-4 rounded-2xl border p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">用户名</label>
                        <input
                            type="text"
                            placeholder="请输入用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">邮箱</label>
                        <input
                            type="email"
                            placeholder="请输入邮箱"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        <p className="text-sm text-green-600">
                            {message}
                        </p>
                    )}

                    {message && !isSuccess && (
                        <p className="text-sm text-red-600">
                            {message}
                        </p>
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