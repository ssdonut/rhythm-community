import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const postId = Number(resolvedParams.id);
        if (!postId) {
            return NextResponse.json(
                { success: false, message: "帖子ID不能为空" },
                { status: 400 }
            );
        }

        const comments = await prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                content: true,
                imageUrl: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                        role: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "获取评论成功",
            data: comments,
        });
    } catch (error) {
        console.error("获取评论失败：", error);
        return NextResponse.json(
            { success: false, message: "获取评论失败" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const postId = Number(resolvedParams.id);
        const body = await request.json();
        const { content, authorId, imageUrl } = body;

        if (!postId || !authorId || (!content && !imageUrl)) {
            return NextResponse.json(
                { success: false, message: "评论内容和作者不能为空" },
                { status: 400 }
            );
        }

        const author = await prisma.user.findUnique({
            where: { id: Number(authorId) },
            select: { isBanned: true },
        });

        if (!author || author.isBanned) {
            return NextResponse.json(
                { success: false, message: "账号已被封禁，无法评论" },
                { status: 403 }
            );
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                imageUrl,
                postId,
                authorId: Number(authorId),
            },
            select: {
                id: true,
                content: true,
                imageUrl: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                        role: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "评论成功",
            data: comment,
        });
    } catch (error) {
        console.error("评论失败：", error);
        return NextResponse.json(
            { success: false, message: "评论失败" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const postId = Number(resolvedParams.id);
        const body = await request.json();
        const { commentId, content, authorId, imageUrl } = body;

        if (!postId || !commentId || !authorId || (!content && !imageUrl)) {
            return NextResponse.json(
                { success: false, message: "评论内容和作者不能为空" },
                { status: 400 }
            );
        }

        const comment = await prisma.comment.findUnique({
            where: { id: Number(commentId) },
            select: { authorId: true, postId: true },
        });

        if (
            !comment ||
            comment.authorId !== Number(authorId) ||
            comment.postId !== postId
        ) {
            return NextResponse.json(
                { success: false, message: "没有权限编辑该评论" },
                { status: 403 }
            );
        }

        const updatedComment = await prisma.comment.update({
            where: { id: Number(commentId) },
            data: { content, imageUrl },
            select: {
                id: true,
                content: true,
                imageUrl: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                        role: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "评论更新成功",
            data: updatedComment,
        });
    } catch (error) {
        console.error("评论更新失败：", error);
        return NextResponse.json(
            { success: false, message: "评论更新失败" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const postId = Number(resolvedParams.id);
        const body = await request.json();
        const { commentId, requesterId } = body;

        if (!postId || !commentId || !requesterId) {
            return NextResponse.json(
                { success: false, message: "作者不能为空" },
                { status: 400 }
            );
        }

        const requester = await prisma.user.findUnique({
            where: { id: Number(requesterId) },
            select: { role: true, isBanned: true },
        });

        if (!requester || requester.isBanned) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该评论" },
                { status: 403 }
            );
        }

        const comment = await prisma.comment.findUnique({
            where: { id: Number(commentId) },
            select: { authorId: true, postId: true },
        });

        const isAdmin = requester.role === "admin";
        if (!comment || comment.postId !== postId) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该评论" },
                { status: 403 }
            );
        }

        if (!isAdmin && comment.authorId !== Number(requesterId)) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该评论" },
                { status: 403 }
            );
        }

        await prisma.comment.delete({
            where: { id: Number(commentId) },
        });

        return NextResponse.json({
            success: true,
            message: "删除评论成功",
        });
    } catch (error) {
        console.error("删除评论失败：", error);
        return NextResponse.json(
            { success: false, message: "删除评论失败" },
            { status: 500 }
        );
    }
}
