import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FORUM_SECTIONS, getForumSectionMeta } from "@/lib/forum-sections";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query")?.trim() || "";
        const section = searchParams.get("section")?.trim() || "recent";

        const posts = await prisma.post.findMany({
            where: {
                ...(query
                    ? {
                          OR: [
                              {
                                  title: {
                                      contains: query,
                                      mode: "insensitive",
                                  },
                              },
                              {
                                  content: {
                                      contains: query,
                                      mode: "insensitive",
                                  },
                              },
                          ],
                      }
                    : {}),
                ...(section !== "recent" &&
                FORUM_SECTIONS.some((item) => item.id === section)
                    ? { section }
                    : {}),
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                content: true,
                imageUrl: true,
                createdAt: true,
                section: true,
                author: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        avatar: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });

        const normalizedPosts = posts.map((post) => ({
            ...post,
            sectionName: getForumSectionMeta(post.section).name,
        }));

        return NextResponse.json({
            success: true,
            message: "获取帖子列表成功",
            data: normalizedPosts,
        });
    } catch (error) {
        console.error("获取帖子列表失败：", error);
        return NextResponse.json(
            {
                success: false,
                message: "获取帖子列表失败",
            },
            { status: 500 }
        );
    }
}
