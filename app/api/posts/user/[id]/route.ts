import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const userId = Number(resolvedParams.id);
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "用户ID不能为空" },
                { status: 400 }
            );
        }

        const posts = await prisma.post.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                content: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "获取发帖记录成功",
            data: posts,
        });
    } catch (error) {
        console.error("获取发帖记录失败：", error);
        return NextResponse.json(
            { success: false, message: "获取发帖记录失败" },
            { status: 500 }
        );
    }
}
