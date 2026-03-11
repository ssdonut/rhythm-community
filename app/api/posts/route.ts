import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FORUM_SECTIONS, getForumSectionMeta } from "@/lib/forum-sections";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content, authorId, imageUrl, section } = body;

        if (!title || !content || !authorId || !section) {
            return NextResponse.json(
                {
                    success: false,
                    message: "标题、内容、专区和作者不能为空",
                },
                { status: 400 }
            );
        }

        if (!FORUM_SECTIONS.some((item) => item.id === section)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "专区无效",
                },
                { status: 400 }
            );
        }

        const author = await prisma.user.findUnique({
            where: { id: Number(authorId) },
            select: { isBanned: true },
        });

        if (!author || author.isBanned) {
            return NextResponse.json(
                {
                    success: false,
                    message: "账号已被封禁，无法发帖",
                },
                { status: 403 }
            );
        }

        const post = await prisma.post.create({
            data: {
                title,
                content,
                imageUrl,
                section,
                authorId: Number(authorId),
            },
        });

        return NextResponse.json({
            success: true,
            message: "发帖成功",
            data: {
                ...post,
                section,
                sectionName: getForumSectionMeta(section).name,
            },
        });
    } catch (error) {
        console.error("发帖失败：", error);
        return NextResponse.json(
            {
                success: false,
                message: "发帖失败",
            },
            { status: 500 }
        );
    }
}
