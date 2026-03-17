import { NextRequest, NextResponse } from "next/server";
import { joinCommaSeparated } from "@/lib/content-mappers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query")?.trim() || "";

        const fanworks = await prisma.fanwork.findMany({
            where: query
                ? {
                      OR: [
                          {
                              title: {
                                  contains: query,
                                  mode: "insensitive",
                              },
                          },
                          {
                              description: {
                                  contains: query,
                                  mode: "insensitive",
                              },
                          },
                          {
                              tags: {
                                  some: {
                                      name: {
                                          contains: query,
                                          mode: "insensitive",
                                      },
                                  },
                              },
                          },
                      ],
                  }
                : undefined,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                images: {
                    orderBy: { sortOrder: "asc" },
                    select: { url: true },
                },
                tags: {
                    orderBy: { name: "asc" },
                    select: { name: true },
                },
                author: {
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
            message: "获取同人作品列表成功",
            data: fanworks.map((fanwork) => ({
                ...fanwork,
                imageUrls: joinCommaSeparated(
                    fanwork.images.map((item) => item.url)
                ),
                tags: joinCommaSeparated(
                    fanwork.tags.map((item) => item.name)
                ),
            })),
        });
    } catch (error) {
        console.error("获取同人作品列表失败:", error);
        return NextResponse.json(
            { success: false, message: "获取同人作品列表失败" },
            { status: 500 }
        );
    }
}
