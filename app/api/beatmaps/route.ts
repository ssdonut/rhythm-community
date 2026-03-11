import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, difficulty, gameType, fileUrl, uploaderId } = body;

        if (!title || !description || !difficulty || !gameType || !fileUrl || !uploaderId) {
            return NextResponse.json(
                { success: false, message: "标题、简介、难度、游戏类型、文件和上传者不能为空" },
                { status: 400 }
            );
        }

        const uploader = await prisma.user.findUnique({
            where: { id: Number(uploaderId) },
            select: { isBanned: true },
        });

        if (!uploader || uploader.isBanned) {
            return NextResponse.json(
                { success: false, message: "账号已被封禁，无法发布谱面" },
                { status: 403 }
            );
        }

        const beatmap = await prisma.beatmap.create({
            data: {
                title,
                description,
                difficulty,
                gameType,
                fileUrl,
                uploaderId: Number(uploaderId),
            },
        });

        return NextResponse.json({
            success: true,
            message: "谱面发布成功",
            data: beatmap,
        });
    } catch (error) {
        console.error("谱面发布失败：", error);
        return NextResponse.json(
            { success: false, message: "谱面发布失败" },
            { status: 500 }
        );
    }
}
