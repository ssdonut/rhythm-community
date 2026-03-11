import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const groupId = Number(resolvedParams.id);
        if (!groupId) {
            return NextResponse.json(
                { success: false, message: "开团ID不能为空" },
                { status: 400 }
            );
        }

        const joins = await prisma.groupJoin.findMany({
            where: { groupId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                quantity: true,
                status: true,
                createdAt: true,
                user: {
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
            message: "获取参团列表成功",
            data: joins,
        });
    } catch (error) {
        console.error("获取参团列表失败：", error);
        return NextResponse.json(
            { success: false, message: "获取参团列表失败" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const groupId = Number(resolvedParams.id);
        const body = await request.json();
        const { userId, quantity } = body;

        if (!groupId || !userId) {
            return NextResponse.json(
                { success: false, message: "用户不能为空" },
                { status: 400 }
            );
        }

        const requester = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: { isBanned: true },
        });

        if (!requester || requester.isBanned) {
            return NextResponse.json(
                { success: false, message: "账号已被封禁，无法参团" },
                { status: 403 }
            );
        }

        const count = Math.max(1, Number(quantity || 1));

        const [updatedGroup, join] = await prisma.$transaction(async (tx) => {
            const group = await tx.groupActivity.findUnique({
                where: { id: groupId },
                select: { stock: true, status: true },
            });

            if (!group) {
                throw new Error("GROUP_NOT_FOUND");
            }

            if (group.status === "已取消") {
                throw new Error("GROUP_CANCELLED");
            }

            if (group.stock < count) {
                throw new Error("OUT_OF_STOCK");
            }

            const updated = await tx.groupActivity.update({
                where: { id: groupId },
                data: { stock: group.stock - count },
                select: { stock: true },
            });

            const createdJoin = await tx.groupJoin.create({
                data: {
                    groupId,
                    userId: Number(userId),
                    quantity: count,
                    status: "待支付",
                },
                select: {
                    id: true,
                    quantity: true,
                    status: true,
                    createdAt: true,
                    user: {
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

            return [updated, createdJoin];
        });

        return NextResponse.json({
            success: true,
            message: "参团成功",
            data: {
                join,
                stock: updatedGroup.stock,
            },
        });
    } catch (error) {
        console.error("参团失败：", error);
        if (error instanceof Error) {
            if (error.message === "OUT_OF_STOCK") {
                return NextResponse.json(
                    { success: false, message: "库存不足" },
                    { status: 400 }
                );
            }
            if (error.message === "GROUP_CANCELLED") {
                return NextResponse.json(
                    { success: false, message: "该开团已取消，无法参团" },
                    { status: 400 }
                );
            }
            if (error.message === "GROUP_NOT_FOUND") {
                return NextResponse.json(
                    { success: false, message: "开团不存在" },
                    { status: 404 }
                );
            }
        }
        return NextResponse.json(
            { success: false, message: "参团失败" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const groupId = Number(resolvedParams.id);
        const body = await request.json();
        const { joinId, status } = body;

        if (!groupId || !joinId || !status) {
            return NextResponse.json(
                { success: false, message: "状态不能为空" },
                { status: 400 }
            );
        }

        const updated = await prisma.groupJoin.update({
            where: { id: Number(joinId) },
            data: { status },
            select: {
                id: true,
                quantity: true,
                status: true,
                createdAt: true,
                user: {
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
            message: "支付状态已更新",
            data: updated,
        });
    } catch (error) {
        console.error("更新支付状态失败：", error);
        return NextResponse.json(
            { success: false, message: "更新支付状态失败" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const groupId = Number(resolvedParams.id);
        const body = await request.json();
        const { joinId, userId } = body;

        if (!groupId || !joinId || !userId) {
            return NextResponse.json(
                { success: false, message: "参数不能为空" },
                { status: 400 }
            );
        }

        const [updatedGroup, deletedJoin] = await prisma.$transaction(
            async (tx) => {
                const join = await tx.groupJoin.findUnique({
                    where: { id: Number(joinId) },
                    select: {
                        id: true,
                        userId: true,
                        quantity: true,
                        groupId: true,
                    },
                });

                if (!join || join.groupId !== groupId) {
                    throw new Error("JOIN_NOT_FOUND");
                }

                if (join.userId !== Number(userId)) {
                    throw new Error("FORBIDDEN");
                }

                const updated = await tx.groupActivity.update({
                    where: { id: groupId },
                    data: { stock: { increment: join.quantity } },
                    select: { stock: true },
                });

                const removed = await tx.groupJoin.delete({
                    where: { id: join.id },
                    select: { id: true },
                });

                return [updated, removed];
            }
        );

        return NextResponse.json({
            success: true,
            message: "已取消参团",
            data: {
                joinId: deletedJoin.id,
                stock: updatedGroup.stock,
            },
        });
    } catch (error) {
        console.error("取消参团失败：", error);
        if (error instanceof Error) {
            if (error.message === "JOIN_NOT_FOUND") {
                return NextResponse.json(
                    { success: false, message: "参团记录不存在" },
                    { status: 404 }
                );
            }
            if (error.message === "FORBIDDEN") {
                return NextResponse.json(
                    { success: false, message: "没有权限取消该参团" },
                    { status: 403 }
                );
            }
        }
        return NextResponse.json(
            { success: false, message: "取消参团失败" },
            { status: 500 }
        );
    }
}
