import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const records = await prisma.scoreRecord.findMany({
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
            message: "获取战绩列表成功",
            data: records,
        });
    } catch (error) {
        console.error("获取战绩列表失败：", error);
        return NextResponse.json(
            { success: false, message: "获取战绩列表失败" },
            { status: 500 }
        );
    }
}
