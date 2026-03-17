"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type GroupDetail = {
    id: number;
    title: string;
    description: string;
    imageUrls: string;
    price: number;
    stock: number;
    status: string;
    deadline?: string | null;
    createdAt: string;
    organizerId: number;
    organizer: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

type JoinItem = {
    id: number;
    quantity: number;
    status: string;
    createdAt: string;
    user: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
    role?: string | null;
};

export default function GroupDetailPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = Number(params.id);
    const [group, setGroup] = useState<GroupDetail | null>(null);
    const [message, setMessage] = useState("");
    const [joins, setJoins] = useState<JoinItem[]>([]);
    const [user] = useState<StoredUser | null>(() => {
        if (typeof window === "undefined") {
            return null;
        }
        const raw = window.localStorage.getItem("rc_user");
        if (!raw) {
            return null;
        }
        try {
            return JSON.parse(raw);
        } catch {
            window.localStorage.removeItem("rc_user");
            return null;
        }
    });
    const [quantity, setQuantity] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!groupId) {
            return;
        }
        fetch(`/api/groups/${groupId}`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setGroup(result.data);
                    return;
                }
                setMessage(result.message || "加载开团失败");
            })
            .catch(() => setMessage("加载开团失败"));
    }, [groupId]);

    useEffect(() => {
        if (!groupId) {
            return;
        }
        fetch(`/api/groups/${groupId}/joins`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setJoins(result.data);
                    return;
                }
                setMessage(result.message || "加载参团列表失败");
            })
            .catch(() => setMessage("加载参团列表失败"));
    }, [groupId]);

    const canCancelGroup = !!user && !!group;
    const canActuallyCancelGroup =
        !!user &&
        !!group &&
        (user.id === group.organizerId ||
            user.id === group.organizer.id ||
            user.role === "admin");

    const handleJoin = async () => {
        if (!user) {
            setMessage("请先登录后再参团");
            setIsSuccess(false);
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/groups/${groupId}/joins`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: user.id,
                    quantity,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setJoins((prev) => [result.data.join, ...prev]);
                setGroup((prev) =>
                    prev
                        ? {
                              ...prev,
                              stock: result.data.stock,
                          }
                        : prev
                );
            }
        } catch (error) {
            console.error("参团失败：", error);
            setMessage("参团失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const handlePay = async (joinId: number) => {
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/groups/${groupId}/joins`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    joinId,
                    status: "已支付",
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setJoins((prev) =>
                    prev.map((item) =>
                        item.id === joinId ? result.data : item
                    )
                );
            }
        } catch (error) {
            console.error("更新支付状态失败：", error);
            setMessage("更新支付状态失败");
            setIsSuccess(false);
        }
    };

    const handleCancelJoin = async (joinId: number) => {
        if (!user) {
            return;
        }
        const confirmed = window.confirm("确认取消参团吗？");
        if (!confirmed) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/groups/${groupId}/joins`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    joinId,
                    userId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setJoins((prev) =>
                    prev.filter((item) => item.id !== joinId)
                );
                setGroup((prev) =>
                    prev
                        ? {
                              ...prev,
                              stock: result.data.stock,
                          }
                        : prev
                );
            }
        } catch (error) {
            console.error("取消参团失败：", error);
            setMessage("取消参团失败");
            setIsSuccess(false);
        }
    };

    const handleCancelGroup = async () => {
        if (!user || !group) {
            return;
        }
        if (!canActuallyCancelGroup) {
            setMessage("只有团长或管理员可以取消开团");
            setIsSuccess(false);
            return;
        }
        const confirmed = window.confirm("确认取消这个开团吗？");
        if (!confirmed) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    requesterId: user.id,
                    action: "cancel",
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setGroup(result.data);
            }
        } catch (error) {
            console.error("取消开团失败：", error);
            setMessage("取消开团失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="flex items-center justify-between">
                    <Link
                        href="/groups"
                        className="text-sm text-[var(--rc-muted)]"
                    >
                        返回开团列表
                    </Link>
                    <Link
                        href="/groups/new"
                        className="rounded-full bg-orange-500 px-4 py-2 text-sm text-white"
                    >
                        发起开团
                    </Link>
                </div>

                {group ? (
                    <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-4">
                            {group.imageUrls
                                .split(",")
                                .filter(Boolean)
                                .map((url) => (
                                    <div
                                        key={url}
                                        className="overflow-hidden rounded-3xl border border-[var(--rc-border)] bg-[var(--rc-bg)] shadow-sm"
                                    >
                                        <img
                                            src={url}
                                            alt={group.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ))}
                        </div>
                        <div className="rounded-3xl border border-[var(--rc-border)] bg-[var(--rc-bg)] p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs text-orange-300">
                                    {group.status}
                                </span>
                                <span className="text-sm text-[var(--rc-muted)]">
                                    {group.deadline
                                        ? `截止 ${new Date(
                                              group.deadline
                                          ).toLocaleDateString("zh-CN")}`
                                        : "长期开放"}
                                </span>
                            </div>
                            <h1 className="mt-4 text-3xl font-bold">
                                {group.title}
                            </h1>
                            <p className="mt-4 text-[var(--rc-text)]">
                                {group.description}
                            </p>
                            <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                                <p className="text-sm text-[var(--rc-muted)]">
                                    价格
                                </p>
                                <p className="mt-1 text-3xl font-bold text-orange-300">
                                    ￥{group.price.toFixed(2)}
                                </p>
                                <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                    库存：{group.stock}
                                </p>
                            </div>
                            <div className="mt-6 flex items-center gap-3 text-sm text-[var(--rc-muted)]">
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(
                                            `/users/${group.organizer.id}`
                                        )
                                    }
                                    className="inline-flex items-center gap-2"
                                >
                                    {group.organizer.avatar ? (
                                        <img
                                            src={group.organizer.avatar}
                                            alt="用户头像"
                                            className="h-8 w-8 rounded-full border object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                            无
                                        </span>
                                    )}
                                    <span>
                                        {group.organizer.nickname ||
                                            group.organizer.username}
                                    </span>
                                    {group.organizer.role === "admin" && (
                                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                            管理员
                                        </span>
                                    )}
                                </button>
                            </div>
                            <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
                                <h3 className="text-sm font-semibold text-orange-300">
                                    参团与支付
                                </h3>
                                <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                    选择数量后提交参团，状态会显示为待支付。向团长完成支付后，可在下方将状态更新为已支付。
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(e) =>
                                            setQuantity(
                                                Math.max(
                                                    1,
                                                    Number(e.target.value || 1)
                                                )
                                            )
                                        }
                                        className="w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleJoin}
                                        disabled={group.status === "已取消"}
                                        className="rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {group.status === "已取消"
                                            ? "开团已取消"
                                            : "立即参团"}
                                    </button>
                                    {canCancelGroup && (
                                        <button
                                            type="button"
                                            onClick={handleCancelGroup}
                                            disabled={group.status === "已取消"}
                                            className="rounded-full border border-red-300 px-6 py-2 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            title={
                                                canActuallyCancelGroup
                                                    ? "团长和管理员可取消开团"
                                                    : "只有团长或管理员可以取消开团"
                                            }
                                        >
                                            {group.status === "已取消"
                                                ? "已取消开团"
                                                : "取消开团"}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {message && isSuccess && (
                                <p className="mt-4 text-sm text-green-600">
                                    {message}
                                </p>
                            )}
                            {message && !isSuccess && (
                                <p className="mt-4 text-sm text-red-600">
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="mt-8 text-sm text-[var(--rc-muted)]">
                        正在加载开团信息...
                    </p>
                )}

                <div className="mt-12">
                    <h2 className="text-xl font-semibold">参团列表</h2>
                    <div className="mt-4 space-y-3">
                        {joins.map((item) => (
                            <div
                                key={item.id}
                                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--rc-border)] bg-[var(--rc-bg)] p-4"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push(`/users/${item.user.id}`)
                                    }
                                    className="inline-flex items-center gap-2 text-sm text-[var(--rc-muted)]"
                                >
                                    {item.user.avatar ? (
                                        <img
                                            src={item.user.avatar}
                                            alt="用户头像"
                                            className="h-7 w-7 rounded-full border object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                            无
                                        </span>
                                    )}
                                    <span>
                                        {item.user.nickname ||
                                            item.user.username}
                                    </span>
                                    {item.user.role === "admin" && (
                                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                            管理员
                                        </span>
                                    )}
                                </button>
                                <div className="text-sm text-[var(--rc-muted)]">
                                    数量：{item.quantity}
                                </div>
                                <div className="text-sm text-[var(--rc-muted)]">
                                    状态：{item.status}
                                </div>
                                <div className="text-sm text-[var(--rc-muted)]">
                                    {new Date(item.createdAt).toLocaleString(
                                        "zh-CN"
                                    )}
                                </div>
                                {user &&
                                    item.user.id === user.id &&
                                    item.status === "待支付" && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handlePay(item.id)}
                                                className="rounded-full border border-orange-300 px-4 py-1 text-sm text-orange-300"
                                            >
                                                我已支付
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCancelJoin(item.id)
                                                }
                                                className="rounded-full border px-4 py-1 text-sm text-[var(--rc-muted)]"
                                            >
                                                取消参团
                                            </button>
                                        </div>
                                    )}
                            </div>
                        ))}
                        {!joins.length && (
                            <div className="rounded-2xl border border-dashed border-[var(--rc-border)] p-8 text-center text-[var(--rc-muted)]">
                                暂无参团记录。
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
