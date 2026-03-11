import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            description,
            imageUrls,
            price,
            stock,
            deadline,
            status,
            organizerId,
        } = body;

        if (
            !title ||
            !description ||
            !imageUrls ||
            price === undefined ||
            stock === undefined ||
            !status ||
            !organizerId
        ) {
            return NextResponse.json(
                { success: false, message: "请完整填写开团信息" },
                { status: 400 }
            );
        }

        const organizer = await prisma.user.findUnique({
            where: { id: Number(organizerId) },
            select: { isBanned: true },
        });

        if (!organizer || organizer.isBanned) {
            return NextResponse.json(
                { success: false, message: "账号已被封禁，无法发起开团" },
                { status: 403 }
            );
        }

        const activity = await prisma.groupActivity.create({
            data: {
                title,
                description,
                imageUrls,
                price: Number(price),
                stock: Number(stock),
                deadline: deadline ? new Date(deadline) : null,
                status,
                organizerId: Number(organizerId),
            },
        });

        return NextResponse.json({
            success: true,
            message: "开团发布成功",
            data: activity,
        });
    } catch (error) {
        console.error("开团发布失败：", error);
        return NextResponse.json(
            { success: false, message: "开团发布失败" },
            { status: 500 }
        );
    }
}
