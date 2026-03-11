import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        if (!id) {
            return NextResponse.json(
                { success: false, message: "开团 ID 不能为空" },
                { status: 400 }
            );
        }

        const activity = await prisma.groupActivity.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                imageUrls: true,
                price: true,
                stock: true,
                status: true,
                deadline: true,
                createdAt: true,
                organizerId: true,
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

        if (!activity) {
            return NextResponse.json(
                { success: false, message: "开团不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "获取开团成功",
            data: activity,
        });
    } catch (error) {
        console.error("获取开团失败：", error);
        return NextResponse.json(
            { success: false, message: "获取开团失败" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        const body = await request.json();
        const { requesterId, action } = body;

        if (!id || !requesterId || action !== "cancel") {
            return NextResponse.json(
                { success: false, message: "请求参数无效" },
                { status: 400 }
            );
        }

        const requester = await prisma.user.findUnique({
            where: { id: Number(requesterId) },
            select: { role: true, isBanned: true },
        });

        if (!requester || requester.isBanned) {
            return NextResponse.json(
                { success: false, message: "没有权限取消该开团" },
                { status: 403 }
            );
        }

        const activity = await prisma.groupActivity.findUnique({
            where: { id },
            select: { organizerId: true, status: true },
        });

        const isAdmin = requester.role === "admin";
        if (!activity || (!isAdmin && activity.organizerId !== Number(requesterId))) {
            return NextResponse.json(
                { success: false, message: "没有权限取消该开团" },
                { status: 403 }
            );
        }

        if (activity.status === "已取消") {
            return NextResponse.json({
                success: true,
                message: "该开团已取消",
                data: { status: "已取消" },
            });
        }

        const updated = await prisma.groupActivity.update({
            where: { id },
            data: { status: "已取消" },
            select: {
                id: true,
                title: true,
                description: true,
                imageUrls: true,
                price: true,
                stock: true,
                status: true,
                deadline: true,
                createdAt: true,
                organizerId: true,
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
            message: "取消开团成功",
            data: updated,
        });
    } catch (error) {
        console.error("取消开团失败：", error);
        return NextResponse.json(
            { success: false, message: "取消开团失败" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        const body = await request.json();
        const { requesterId } = body;

        if (!id || !requesterId) {
            return NextResponse.json(
                { success: false, message: "用户不能为空" },
                { status: 400 }
            );
        }

        const requester = await prisma.user.findUnique({
            where: { id: Number(requesterId) },
            select: { role: true, isBanned: true },
        });

        if (!requester || requester.isBanned) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该开团" },
                { status: 403 }
            );
        }

        const activity = await prisma.groupActivity.findUnique({
            where: { id },
            select: { organizerId: true },
        });

        const isAdmin = requester.role === "admin";
        if (!activity || (!isAdmin && activity.organizerId !== Number(requesterId))) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该开团" },
                { status: 403 }
            );
        }

        await prisma.groupActivity.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "删除开团成功",
        });
    } catch (error) {
        console.error("删除开团失败：", error);
        return NextResponse.json(
            { success: false, message: "删除开团失败" },
            { status: 500 }
        );
    }
}
