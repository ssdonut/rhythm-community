import { NextRequest, NextResponse } from "next/server";
import { joinCommaSeparated } from "@/lib/content-mappers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query")?.trim() || "";

        const groups = await prisma.groupActivity.findMany({
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
                              status: {
                                  contains: query,
                                  mode: "insensitive",
                              },
                          },
                          {
                              organizer: {
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
                : undefined,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                price: true,
                stock: true,
                status: true,
                deadline: true,
                createdAt: true,
                images: {
                    orderBy: { sortOrder: "asc" },
                    select: { url: true },
                },
                organizer: {
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
            message: "获取开团列表成功",
            data: groups.map((group) => ({
                ...group,
                imageUrls: joinCommaSeparated(
                    group.images.map((item) => item.url)
                ),
            })),
        });
    } catch (error) {
        console.error("获取开团列表失败:", error);
        return NextResponse.json(
            { success: false, message: "获取开团列表失败" },
            { status: 500 }
        );
    }
}
