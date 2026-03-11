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
