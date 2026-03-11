"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FORUM_SECTIONS } from "@/lib/forum-sections";

type StoredUser = {
    id: number;
    username: string;
    email: string;
    nickname?: string | null;
    avatar?: string | null;
    role?: string | null;
    isBanned?: boolean | null;
};

type PostDetail = {
    id: number;
    title: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    section: string;
    sectionName: string;
    authorId: number;
    author: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

type CommentItem = {
    id: number;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    author: {
        id: number;
        username: string;
        nickname?: string | null;
        avatar?: string | null;
        role?: string | null;
    };
};

const storageKey = "rc_user";

export default function PostDetailPage() {
    const params = useParams();
    const postId = Number(params.id);
    const [post, setPost] = useState<PostDetail | null>(null);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [commentContent, setCommentContent] = useState("");
    const [commentImageUrl, setCommentImageUrl] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [user, setUser] = useState<StoredUser | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [editSection, setEditSection] = useState("general");
    const [isUploadingPostImage, setIsUploadingPostImage] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
        null
    );
    const [editCommentContent, setEditCommentContent] = useState("");
    const [editCommentImageUrl, setEditCommentImageUrl] = useState("");
    const [isUploadingCommentImage, setIsUploadingCommentImage] =
        useState(false);

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

    useEffect(() => {
        if (!postId) {
            return;
        }
        fetch(`/api/posts/${postId}`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setPost(result.data);
                    setEditTitle(result.data.title);
                    setEditContent(result.data.content);
                    setEditImageUrl(result.data.imageUrl ?? "");
                    setEditSection(result.data.section);
                    return;
                }
                setMessage(result.message || "加载帖子失败");
            })
            .catch(() => setMessage("加载帖子失败"));

        fetch(`/api/posts/${postId}/comments`)
            .then((response) => response.json())
            .then((result) => {
                if (result.success && result.data) {
                    setComments(result.data);
                    return;
                }
                setMessage(result.message || "加载评论失败");
            })
            .catch(() => setMessage("加载评论失败"));
    }, [postId]);

    const uploadImage = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });
        return response.json();
    };

    const handleUploadPostImage = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        setIsUploadingPostImage(true);
        try {
            const result = await uploadImage(file);
            if (result.success && result.data) {
                setEditImageUrl(result.data.url);
            } else {
                setMessage(result.message || "上传失败");
            }
        } catch (error) {
            console.error("请求上传失败：", error);
            setMessage("上传失败，请稍后再试");
        } finally {
            setIsUploadingPostImage(false);
        }
    };

    const handleUploadCommentImage = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        setIsUploadingCommentImage(true);
        try {
            const result = await uploadImage(file);
            if (result.success && result.data) {
                setCommentImageUrl(result.data.url);
            } else {
                setMessage(result.message || "上传失败");
            }
        } catch (error) {
            console.error("请求上传失败：", error);
            setMessage("上传失败，请稍后再试");
        } finally {
            setIsUploadingCommentImage(false);
        }
    };

    const handleUploadEditCommentImage = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        setIsUploadingCommentImage(true);
        try {
            const result = await uploadImage(file);
            if (result.success && result.data) {
                setEditCommentImageUrl(result.data.url);
            } else {
                setMessage(result.message || "上传失败");
            }
        } catch (error) {
            console.error("请求上传失败：", error);
            setMessage("上传失败，请稍后再试");
        } finally {
            setIsUploadingCommentImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            setMessage("请先登录再评论");
            setIsSuccess(false);
            return;
        }
        if (!commentContent && !commentImageUrl) {
            setMessage("评论内容和图片不能同时为空");
            setIsSuccess(false);
            return;
        }
        if (isUploadingCommentImage) {
            setMessage("图片正在上传，请稍后");
            setIsSuccess(false);
            return;
        }

        setMessage("");
        setIsSuccess(false);

        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: commentContent,
                    imageUrl: commentImageUrl,
                    authorId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setComments((prev) => [...prev, result.data]);
                setCommentContent("");
                setCommentImageUrl("");
            }
        } catch (error) {
            console.error("请求评论失败：", error);
            setMessage("请求失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const handleEditComment = (comment: CommentItem) => {
        setEditingCommentId(comment.id);
        setEditCommentContent(comment.content);
        setEditCommentImageUrl(comment.imageUrl ?? "");
    };

    const handleUpdateComment = async () => {
        if (!user || !editingCommentId) {
            return;
        }
        if (!editCommentContent && !editCommentImageUrl) {
            setMessage("评论内容和图片不能同时为空");
            setIsSuccess(false);
            return;
        }
        if (isUploadingCommentImage) {
            setMessage("图片正在上传，请稍后");
            setIsSuccess(false);
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    commentId: editingCommentId,
                    content: editCommentContent,
                    imageUrl: editCommentImageUrl,
                    authorId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setComments((prev) =>
                    prev.map((item) =>
                        item.id === editingCommentId ? result.data : item
                    )
                );
                setEditingCommentId(null);
                setEditCommentContent("");
                setEditCommentImageUrl("");
            }
        } catch (error) {
            console.error("请求更新评论失败：", error);
            setMessage("请求失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!user) {
            return;
        }
        const confirmed = window.confirm("确认删除这条评论吗？");
        if (!confirmed) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    commentId,
                    requesterId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success) {
                setComments((prev) =>
                    prev.filter((item) => item.id !== commentId)
                );
            }
        } catch (error) {
            console.error("请求删除评论失败：", error);
            setMessage("请求失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const handleUpdatePost = async () => {
        if (!post || !user) {
            return;
        }
        if (!editTitle || !editContent) {
            setMessage("标题和内容不能为空");
            setIsSuccess(false);
            return;
        }
        if (isUploadingPostImage) {
            setMessage("图片正在上传，请稍后");
            setIsSuccess(false);
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/posts/${post.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: editTitle,
                    content: editContent,
                    imageUrl: editImageUrl,
                    section: editSection,
                    authorId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success && result.data) {
                setPost((prev) =>
                    prev
                        ? {
                              ...prev,
                              title: result.data.title,
                              content: result.data.content,
                              imageUrl: result.data.imageUrl,
                              section: result.data.section,
                              sectionName: result.data.sectionName,
                          }
                        : prev
                );
                setIsEditing(false);
            }
        } catch (error) {
            console.error("请求更新帖子失败：", error);
            setMessage("请求失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const handleDeletePost = async () => {
        if (!post || !user) {
            return;
        }
        setMessage("");
        setIsSuccess(false);
        try {
            const response = await fetch(`/api/posts/${post.id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    requesterId: user.id,
                }),
            });
            const result = await response.json();
            setMessage(result.message);
            setIsSuccess(result.success);
            if (result.success) {
                window.location.href = "/forum";
            }
        } catch (error) {
            console.error("请求删除帖子失败：", error);
            setMessage("请求失败，请稍后再试");
            setIsSuccess(false);
        }
    };

    const isAdmin = user?.role === "admin";

    return (
        <main className="min-h-screen bg-[var(--rc-bg)] text-[var(--rc-text)]">
            <div className="mx-auto max-w-4xl px-6 py-16">
                <div className="flex items-center justify-between">
                    <Link href="/forum" className="text-sm text-[var(--rc-muted)]">
                        返回论坛
                    </Link>
                    <Link
                        href="/forum/new"
                        className="rounded-xl bg-black px-4 py-2 text-sm text-white"
                    >
                        发布新帖
                    </Link>
                </div>

                {post ? (
                    <div className="mt-8 rounded-2xl border p-6 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="w-full">
                                {isEditing ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) =>
                                                setEditTitle(e.target.value)
                                            }
                                            className="w-full rounded-xl border px-4 py-2 text-2xl font-bold outline-none"
                                        />
                                        <div className="mt-4">
                                            <label className="mb-2 block text-sm font-medium">
                                                所属专区
                                            </label>
                                            <select
                                                value={editSection}
                                                onChange={(e) =>
                                                    setEditSection(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-xl border px-4 py-2 outline-none"
                                            >
                                                {FORUM_SECTIONS.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mt-4">
                                            <label className="mb-2 block text-sm font-medium">
                                                帖子图片
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={
                                                    handleUploadPostImage
                                                }
                                                className="w-full rounded-xl border px-4 py-2 outline-none"
                                            />
                                            {editImageUrl && (
                                                <img
                                                    src={editImageUrl}
                                                    alt="帖子图片"
                                                    className="mt-3 max-h-72 w-full max-w-2xl rounded-2xl border object-contain bg-[rgba(15,23,42,0.6)]"
                                                />
                                            )}
                                            {isUploadingPostImage && (
                                                <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                                    图片上传中...
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-3xl font-bold">
                                            {post.title}
                                        </h1>
                                        <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                                            {post.sectionName}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {user && (user.id === post.authorId || isAdmin) && (
                                <div className="flex flex-wrap gap-2">
                                    {isEditing && user.id === post.authorId ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleUpdatePost}
                                                className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                                            >
                                                保存修改
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsEditing(false)
                                                }
                                                className="rounded-lg border px-4 py-2 text-sm text-[var(--rc-text)]"
                                            >
                                                取消
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            {user.id === post.authorId && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsEditing(true)
                                                    }
                                                    className="rounded-lg border px-4 py-2 text-sm text-[var(--rc-text)]"
                                                >
                                                    编辑帖子
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleDeletePost}
                                                className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600"
                                            >
                                                删除帖子
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-sm text-[var(--rc-muted)]">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/users/${post.author.id}`}
                                    className="inline-flex items-center"
                                >
                                    {post.author.avatar ? (
                                        <img
                                            src={post.author.avatar}
                                            alt="用户头像"
                                            style={{
                                                width: "50px",
                                                height: "50px",
                                            }}
                                            className="rounded-full border object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                            无
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href={`/users/${post.author.id}`}
                                    className="whitespace-nowrap"
                                >
                                    {post.author.nickname ||
                                        post.author.username}
                                </Link>
                                {post.author.role === "admin" && (
                                    <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                        管理员
                                    </span>
                                )}
                            </div>
                            <span>·</span>
                            <span className="whitespace-nowrap">
                                {new Date(post.createdAt).toLocaleString(
                                    "zh-CN"
                                )}
                            </span>
                        </div>
                        {isEditing ? (
                            <textarea
                                value={editContent}
                                onChange={(e) =>
                                    setEditContent(e.target.value)
                                }
                                className="mt-6 min-h-40 w-full rounded-xl border px-4 py-2 outline-none"
                            />
                        ) : (
                            <>
                                {post.imageUrl && (
                                    <img
                                        src={post.imageUrl}
                                        alt="帖子图片"
                                        className="mt-6 max-h-[520px] w-full max-w-3xl rounded-2xl border object-contain bg-[rgba(15,23,42,0.6)]"
                                    />
                                )}
                                <p className="mt-6 whitespace-pre-wrap text-[var(--rc-text)]">
                                    {post.content}
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <p className="mt-8 text-sm text-[var(--rc-muted)]">
                        正在加载帖子...
                    </p>
                )}

                <div className="mt-10">
                    <h2 className="text-xl font-semibold">
                        评论（{comments.length}）
                    </h2>
                    <div className="mt-4 space-y-4">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="rounded-2xl border p-4"
                            >
                                <div className="flex items-center justify-between gap-3 text-sm text-[var(--rc-muted)]">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/users/${comment.author.id}`}
                                            className="inline-flex items-center"
                                        >
                                            {comment.author.avatar ? (
                                                <img
                                                    src={comment.author.avatar}
                                                    alt="用户头像"
                                                    style={{
                                                        width: "50px",
                                                        height: "50px",
                                                    }}
                                                    className="rounded-full border object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-[50px] w-[50px] items-center justify-center rounded-full border bg-[rgba(15,23,42,0.6)] text-[10px] text-[var(--rc-muted)]">
                                                    无
                                                </span>
                                            )}
                                        </Link>
                                        <Link
                                            href={`/users/${comment.author.id}`}
                                            className="whitespace-nowrap"
                                        >
                                            {comment.author.nickname ||
                                                comment.author.username}
                                        </Link>
                                        {comment.author.role === "admin" && (
                                            <span className="rounded-full bg-black px-2 py-0.5 text-[10px] text-white">
                                                管理员
                                            </span>
                                        )}
                                        <span>·</span>
                                        <span className="whitespace-nowrap">
                                            {new Date(
                                                comment.createdAt
                                            ).toLocaleString("zh-CN")}
                                        </span>
                                    </div>
                                    {user &&
                                        (user.id === comment.author.id ||
                                            isAdmin) && (
                                        <div className="flex gap-2">
                                            {editingCommentId ===
                                                comment.id &&
                                            user.id === comment.author.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={
                                                            handleUpdateComment
                                                        }
                                                        className="rounded-lg border px-3 py-1 text-xs text-[var(--rc-text)]"
                                                    >
                                                        保存
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingCommentId(
                                                                null
                                                            );
                                                            setEditCommentContent(
                                                                ""
                                                            );
                                                            setEditCommentImageUrl(
                                                                ""
                                                            );
                                                        }}
                                                        className="rounded-lg border px-3 py-1 text-xs text-[var(--rc-text)]"
                                                    >
                                                        取消
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {user.id ===
                                                        comment.author.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEditComment(
                                                                    comment
                                                                )
                                                            }
                                                            className="rounded-lg border px-3 py-1 text-xs text-[var(--rc-text)]"
                                                        >
                                                            编辑
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteComment(
                                                                comment.id
                                                            )
                                                        }
                                                        className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-600"
                                                    >
                                                        删除
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {editingCommentId === comment.id ? (
                                    <>
                                        <textarea
                                            value={editCommentContent}
                                            onChange={(e) =>
                                                setEditCommentContent(
                                                    e.target.value
                                                )
                                            }
                                            className="mt-2 min-h-24 w-full rounded-xl border px-4 py-2 outline-none"
                                        />
                                        <div className="mt-3">
                                            <label className="mb-2 block text-sm font-medium">
                                                评论图片
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={
                                                    handleUploadEditCommentImage
                                                }
                                                className="w-full rounded-xl border px-4 py-2 outline-none"
                                            />
                                            {editCommentImageUrl && (
                                                <img
                                                    src={editCommentImageUrl}
                                                    alt="评论图片"
                                                    style={{
                                                        maxWidth: "300px",
                                                        maxHeight: "300px",
                                                        width: "auto",
                                                        height: "auto",
                                                    }}
                                                    className="mt-3 rounded-lg border object-contain bg-[rgba(15,23,42,0.6)]"
                                                />
                                            )}
                                            {isUploadingCommentImage && (
                                                <p className="mt-2 text-sm text-[var(--rc-muted)]">
                                                    图片上传中...
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {comment.imageUrl && (
                                            <img
                                                src={comment.imageUrl}
                                                alt="评论图片"
                                                style={{
                                                    maxWidth: "300px",
                                                    maxHeight: "300px",
                                                    width: "auto",
                                                    height: "auto",
                                                }}
                                                className="mt-2 rounded-lg border object-contain bg-[rgba(15,23,42,0.6)]"
                                            />
                                        )}
                                {comment.content && (
                                    <p className="mt-2 whitespace-pre-wrap text-[var(--rc-text)]">
                                        {comment.content}
                                    </p>
                                )}
                                    </>
                                )}
                            </div>
                        ))}
                        {!comments.length && (
                            <div className="rounded-2xl border border-dashed p-8 text-center text-[var(--rc-muted)]">
                                还没有评论，来写第一条吧。
                            </div>
                        )}
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-10 space-y-4 rounded-2xl border p-6 shadow-sm"
                >
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            发表评论
                        </label>
                        <textarea
                            placeholder="请输入评论内容"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            className="min-h-32 w-full rounded-xl border px-4 py-2 outline-none"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            评论图片
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleUploadCommentImage}
                            className="w-full rounded-xl border px-4 py-2 outline-none"
                        />
                        {commentImageUrl && (
                            <img
                                src={commentImageUrl}
                                alt="评论图片"
                                style={{
                                    maxWidth: "300px",
                                    maxHeight: "300px",
                                    width: "auto",
                                    height: "auto",
                                }}
                                className="mt-3 rounded-lg border object-contain bg-[rgba(15,23,42,0.6)]"
                            />
                        )}
                        {isUploadingCommentImage && (
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
                        disabled={isUploadingCommentImage}
                        className="w-full rounded-xl bg-black px-4 py-2 text-white"
                    >
                        发布评论
                    </button>
                </form>
            </div>
        </main>
    );
}
