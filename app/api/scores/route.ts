import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            game,
            songTitle,
            result,
            difficulty,
            rank,
            comment,
            userId,
        } = body;

        if (
            !game ||
            !songTitle ||
            !result ||
            !difficulty ||
            !rank ||
            !userId
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "游戏、曲目、难度、成绩、评级和用户不能为空",
                },
                { status: 400 }
            );
        }

        const player = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { isBanned: true },
        });

        if (!player || player.isBanned) {
            return NextResponse.json(
                { success: false, message: "账号已被封禁，无法添加战绩" },
                { status: 403 }
            );
        }

        const record = await prisma.scoreRecord.create({
            data: {
                game,
                songTitle,
                difficulty,
                result,
                rank,
                comment: comment || null,
                userId: Number(userId),
            },
        });

        return NextResponse.json({
            success: true,
            message: "战绩添加成功",
            data: record,
        });
    } catch (error) {
        console.error("战绩添加失败：", error);
        return NextResponse.json(
            { success: false, message: "战绩添加失败" },
            { status: 500 }
        );
    }
}
