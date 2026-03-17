import { NextRequest, NextResponse } from "next/server";
import { joinCommaSeparated } from "@/lib/content-mappers";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        if (!id) {
            return NextResponse.json(
                { success: false, message: "作品 ID 不能为空" },
                { status: 400 }
            );
        }

        const fanwork = await prisma.fanwork.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                images: {
                    orderBy: { sortOrder: "asc" },
                    select: { url: true },
                },
                tags: {
                    orderBy: { name: "asc" },
                    select: { name: true },
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

        if (!fanwork) {
            return NextResponse.json(
                { success: false, message: "作品不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "获取作品成功",
            data: {
                ...fanwork,
                imageUrls: joinCommaSeparated(
                    fanwork.images.map((item) => item.url)
                ),
                tags: joinCommaSeparated(
                    fanwork.tags.map((item) => item.name)
                ),
            },
        });
    } catch (error) {
        console.error("获取作品失败:", error);
        return NextResponse.json(
            { success: false, message: "获取作品失败" },
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
                { success: false, message: "没有权限删除该作品" },
                { status: 403 }
            );
        }

        const fanwork = await prisma.fanwork.findUnique({
            where: { id },
            select: { authorId: true },
        });

        const isAdmin = requester.role === "admin";
        if (!fanwork || (!isAdmin && fanwork.authorId !== Number(requesterId))) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该作品" },
                { status: 403 }
            );
        }

        await prisma.fanwork.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "删除作品成功",
        });
    } catch (error) {
        console.error("删除作品失败:", error);
        return NextResponse.json(
            { success: false, message: "删除作品失败" },
            { status: 500 }
        );
    }
}
