import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getForumSectionMeta } from "@/lib/forum-sections";

type RecommendedPost = {
    id: number;
    title: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
    section: string;
    username: string;
    nickname: string | null;
    role: string | null;
};

export async function GET() {
    try {
        const posts = await prisma.$queryRaw<RecommendedPost[]>`
           SELECT p."id",
                  p."title",
                  p."content",
                  p."imageUrl",
                  p."createdAt",
                  p."section",
                  u."username",
                  u."nickname",
                  u."role"
            FROM "Post" p
            JOIN "User" u ON u."id" = p."authorId"
            ORDER BY RANDOM()
            LIMIT 5
        `;

        return NextResponse.json({
            success: true,
            message: "获取推荐帖子成功",
            data: posts.map((post) => ({
                ...post,
                sectionName: getForumSectionMeta(post.section).name,
            })),
        });
    } catch (error) {
        console.error("获取推荐帖子失败：", error);
        return NextResponse.json(
            { success: false, message: "获取推荐帖子失败" },
            { status: 500 }
        );
    }
}
