import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const userCount = await prisma.user.count();

        return NextResponse.json({
            success: true,
            message: "数据库连接成功",
            data: {
                userCount,
            },
        });
    } catch (error) {
        console.error("测试数据库连接失败：", error);

        return NextResponse.json(
            {
                success: false,
                message: "数据库连接失败",
            },
            { status: 500 }
        );
    }
}