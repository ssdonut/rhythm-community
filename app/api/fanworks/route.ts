import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, imageUrls, tags, authorId } = body;

        if (!title || !description || !imageUrls || !tags || !authorId) {
            return NextResponse.json(
                { success: false, message: "标题、简介、封面、标签和作者不能为空" },
                { status: 400 }
            );
        }

        const author = await prisma.user.findUnique({
            where: { id: Number(authorId) },
            select: { isBanned: true },
        });

        if (!author || author.isBanned) {
            return NextResponse.json(
                { success: false, message: "账号已被封禁，无法发布作品" },
                { status: 403 }
            );
        }

        const fanwork = await prisma.fanwork.create({
            data: {
                title,
                description,
                imageUrls,
                tags,
                authorId: Number(authorId),
            },
        });

        return NextResponse.json({
            success: true,
            message: "同人作品发布成功",
            data: fanwork,
        });
    } catch (error) {
        console.error("同人作品发布失败：", error);
        return NextResponse.json(
            { success: false, message: "同人作品发布失败" },
            { status: 500 }
        );
    }
}
