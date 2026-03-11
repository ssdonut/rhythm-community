import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const [todayPosts, todayBeatmaps, todayFanworks, activeGroups] =
            await Promise.all([
            prisma.post.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                    },
                },
            }),
            prisma.beatmap.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                    },
                },
            }),
            prisma.fanwork.count({
                where: {
                    createdAt: {
                        gte: startOfDay,
                    },
                },
            }),
            prisma.groupActivity.count({
                where: {
                    OR: [
                        { deadline: null },
                        {
                            deadline: {
                                gte: now,
                            },
                        },
                    ],
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                todayPosts,
                todayBeatmaps,
                todayFanworks,
                activeGroups,
            },
        });
    } catch (error) {
        console.error("获取今日节奏失败：", error);
        return NextResponse.json(
            { success: false, message: "获取今日节奏失败" },
            { status: 500 }
        );
    }
}
