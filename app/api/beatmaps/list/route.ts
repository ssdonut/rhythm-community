import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query")?.trim();
        const where = query
            ? {
                  OR: [
                      { title: { contains: query, mode: "insensitive" } },
                      { description: { contains: query, mode: "insensitive" } },
                      { gameType: { contains: query, mode: "insensitive" } },
                      { difficulty: { contains: query, mode: "insensitive" } },
                      {
                          uploader: {
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
                      },
                  ],
              }
            : undefined;
        const beatmaps = await prisma.beatmap.findMany({
            orderBy: { createdAt: "desc" },
            where,
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                gameType: true,
                fileUrl: true,
                createdAt: true,
                uploader: {
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
            message: "获取谱面列表成功",
            data: beatmaps,
        });
    } catch (error) {
        console.error("获取谱面列表失败：", error);
        return NextResponse.json(
            { success: false, message: "获取谱面列表失败" },
            { status: 500 }
        );
    }
}
