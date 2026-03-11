import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query")?.trim() || "";

        if (!query) {
            return NextResponse.json({
                success: true,
                message: "查询为空",
                data: [],
            });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        username: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                    {
                        nickname: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                ],
            },
            select: {
                id: true,
                username: true,
                nickname: true,
                avatar: true,
                role: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "获取用户搜索结果成功",
            data: users,
        });
    } catch (error) {
        console.error("获取用户搜索结果失败：", error);
        return NextResponse.json(
            { success: false, message: "获取用户搜索结果失败" },
            { status: 500 }
        );
    }
}
