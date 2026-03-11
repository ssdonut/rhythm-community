import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
                { success: false, message: "没有权限删除该战绩" },
                { status: 403 }
            );
        }

        const record = await prisma.scoreRecord.findUnique({
            where: { id },
            select: { userId: true },
        });

        const isAdmin = requester.role === "admin";
        if (!record || (!isAdmin && record.userId !== Number(requesterId))) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该战绩" },
                { status: 403 }
            );
        }

        await prisma.scoreRecord.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "删除战绩成功",
        });
    } catch (error) {
        console.error("删除战绩失败：", error);
        return NextResponse.json(
            { success: false, message: "删除战绩失败" },
            { status: 500 }
        );
    }
}
