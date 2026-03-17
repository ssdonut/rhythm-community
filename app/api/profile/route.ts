import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "用户ID不能为空",
                },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                nickname: true,
                avatar: true,
                role: true,
                isBanned: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "用户不存在",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "获取个人信息成功",
            data: user,
        });
    } catch (error) {
        console.error("获取个人信息失败：", error);
        return NextResponse.json(
            {
                success: false,
                message: "获取个人信息失败",
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, nickname, avatar } = body;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "用户ID不能为空",
                },
                { status: 400 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                nickname,
                avatar,
            },
            select: {
                id: true,
                username: true,
                email: true,
                nickname: true,
                avatar: true,
                role: true,
                isBanned: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "个人信息修改成功",
            data: updatedUser,
        });
    } catch (error) {
        console.error("个人信息修改失败：", error);
        return NextResponse.json(
            {
                success: false,
                message: "个人信息修改失败",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const id = Number(body?.id);

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    message: "用户ID不能为空",
                },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "用户不存在",
                },
                { status: 404 }
            );
        }

        await prisma.$transaction(async (tx) => {
            const posts = await tx.post.findMany({
                where: { authorId: id },
                select: { id: true },
            });
            const postIds = posts.map((post) => post.id);

            const groups = await tx.groupActivity.findMany({
                where: { organizerId: id },
                select: { id: true },
            });
            const groupIds = groups.map((group) => group.id);

            if (postIds.length > 0) {
                await tx.comment.deleteMany({
                    where: { postId: { in: postIds } },
                });
            }

            await tx.comment.deleteMany({
                where: { authorId: id },
            });

            if (postIds.length > 0) {
                await tx.post.deleteMany({
                    where: { id: { in: postIds } },
                });
            }

            await tx.beatmap.deleteMany({
                where: { uploaderId: id },
            });

            await tx.scoreRecord.deleteMany({
                where: { userId: id },
            });

            await tx.fanwork.deleteMany({
                where: { authorId: id },
            });

            await tx.groupJoin.deleteMany({
                where: { userId: id },
            });

            if (groupIds.length > 0) {
                await tx.groupJoin.deleteMany({
                    where: { groupId: { in: groupIds } },
                });
                await tx.groupActivity.deleteMany({
                    where: { id: { in: groupIds } },
                });
            }

            await tx.user.delete({
                where: { id },
            });
        });

        return NextResponse.json({
            success: true,
            message: "账号注销成功",
        });
    } catch (error) {
        console.error("账号注销失败：", error);
        return NextResponse.json(
            {
                success: false,
                message: "账号注销失败",
            },
            { status: 500 }
        );
    }
}
