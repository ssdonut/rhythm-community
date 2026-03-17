import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FORUM_SECTIONS, getForumSectionMeta } from "@/lib/forum-sections";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        if (!id) {
            return NextResponse.json(
                { success: false, message: "帖子 ID 不能为空" },
                { status: 400 }
            );
        }

        const post = await prisma.post.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                content: true,
                imageUrl: true,
                section: true,
                createdAt: true,
                authorId: true,
                sectionMeta: {
                    select: {
                        name: true,
                    },
                },
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

        if (!post) {
            return NextResponse.json(
                { success: false, message: "帖子不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "获取帖子成功",
            data: {
                ...post,
                sectionName:
                    post.sectionMeta?.name ||
                    getForumSectionMeta(post.section).name,
            },
        });
    } catch (error) {
        console.error("获取帖子失败:", error);
        return NextResponse.json(
            { success: false, message: "获取帖子失败" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        const body = await request.json();
        const { title, content, authorId, imageUrl, section } = body;

        if (!id || !title || !content || !authorId || !section) {
            return NextResponse.json(
                { success: false, message: "标题、内容、专区和作者不能为空" },
                { status: 400 }
            );
        }

        if (!FORUM_SECTIONS.some((item) => item.id === section)) {
            return NextResponse.json(
                { success: false, message: "专区无效" },
                { status: 400 }
            );
        }

        const [post, sectionRecord] = await Promise.all([
            prisma.post.findUnique({
                where: { id },
                select: { authorId: true },
            }),
            prisma.forumSection.findUnique({
                where: { id: section },
                select: { id: true, name: true },
            }),
        ]);

        if (!post || post.authorId !== Number(authorId)) {
            return NextResponse.json(
                { success: false, message: "没有权限编辑该帖子" },
                { status: 403 }
            );
        }

        if (!sectionRecord) {
            return NextResponse.json(
                { success: false, message: "专区无效" },
                { status: 400 }
            );
        }

        const updatedPost = await prisma.post.update({
            where: { id },
            data: {
                title,
                content,
                imageUrl,
                section,
            },
            select: {
                id: true,
                title: true,
                content: true,
                imageUrl: true,
                section: true,
                createdAt: true,
                authorId: true,
                sectionMeta: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "更新帖子成功",
            data: {
                ...updatedPost,
                sectionName:
                    updatedPost.sectionMeta?.name ||
                    sectionRecord.name ||
                    getForumSectionMeta(section).name,
            },
        });
    } catch (error) {
        console.error("更新帖子失败:", error);
        return NextResponse.json(
            { success: false, message: "更新帖子失败" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        const body = await request.json();
        const { requesterId } = body;

        if (!id || !requesterId) {
            return NextResponse.json(
                { success: false, message: "用户不能为空" },
                { status: 400 }
            );
        }

        const requester = await prisma.user.findUnique({
            where: { id: Number(requesterId) },
            select: { role: true, isBanned: true },
        });

        if (!requester || requester.isBanned) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该帖子" },
                { status: 403 }
            );
        }

        const post = await prisma.post.findUnique({
            where: { id },
            select: { authorId: true },
        });

        const isAdmin = requester.role === "admin";
        if (!post || (!isAdmin && post.authorId !== Number(requesterId))) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该帖子" },
                { status: 403 }
            );
        }

        await prisma.post.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "删除帖子成功",
        });
    } catch (error) {
        console.error("删除帖子失败:", error);
        return NextResponse.json(
            { success: false, message: "删除帖子失败" },
            { status: 500 }
        );
    }
}
