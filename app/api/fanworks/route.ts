import { NextRequest, NextResponse } from "next/server";
import { splitCommaSeparated } from "@/lib/content-mappers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, description, imageUrls, tags, authorId } = body;
        const normalizedImages = splitCommaSeparated(imageUrls);
        const normalizedTags = Array.from(new Set(splitCommaSeparated(tags)));

        if (
            !title ||
            !description ||
            !normalizedImages.length ||
            !normalizedTags.length ||
            !authorId
        ) {
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
                authorId: Number(authorId),
                images: {
                    create: normalizedImages.map((url, index) => ({
                        url,
                        sortOrder: index,
                    })),
                },
                tags: {
                    create: normalizedTags.map((name) => ({
                        name,
                    })),
                },
            },
            include: {
                images: {
                    orderBy: { sortOrder: "asc" },
                    select: { url: true },
                },
                tags: {
                    orderBy: { name: "asc" },
                    select: { name: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: "同人作品发布成功",
            data: {
                ...fanwork,
                imageUrls: fanwork.images.map((item) => item.url).join(","),
                tags: fanwork.tags.map((item) => item.name).join(","),
            },
        });
    } catch (error) {
        console.error("同人作品发布失败:", error);
        return NextResponse.json(
            { success: false, message: "同人作品发布失败" },
            { status: 500 }
        );
    }
}
