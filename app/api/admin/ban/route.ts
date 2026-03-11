import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminId, targetUserId, isBanned } = body;

        if (!adminId || !targetUserId) {
            return NextResponse.json(
                { success: false, message: "参数不能为空" },
                { status: 400 }
            );
        }

        const admin = await prisma.user.findUnique({
            where: { id: Number(adminId) },
            select: { role: true, isBanned: true },
        });

        if (!admin || admin.isBanned || admin.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "没有权限执行该操作" },
                { status: 403 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(targetUserId) },
            data: { isBanned: Boolean(isBanned) },
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
            message: "封禁状态已更新",
            data: updatedUser,
        });
    } catch (error) {
        console.error("更新封禁状态失败：", error);
        return NextResponse.json(
            { success: false, message: "更新封禁状态失败" },
            { status: 500 }
        );
    }
}
