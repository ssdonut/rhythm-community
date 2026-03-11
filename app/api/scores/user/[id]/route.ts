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

        const records = await prisma.scoreRecord.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                game: true,
                songTitle: true,
                difficulty: true,
                result: true,
                rank: true,
                comment: true,
                createdAt: true,
                user: {
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
            message: "获取用户战绩成功",
            data: records,
        });
    } catch (error) {
        console.error("获取用户战绩失败：", error);
        return NextResponse.json(
            { success: false, message: "获取用户战绩失败" },
            { status: 500 }
        );
    }
}
