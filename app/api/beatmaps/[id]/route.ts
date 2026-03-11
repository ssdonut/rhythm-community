import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const id = Number(resolvedParams.id);
        if (!id) {
            return NextResponse.json(
                { success: false, message: "谱面ID不能为空" },
                { status: 400 }
            );
        }

        const beatmap = await prisma.beatmap.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                gameType: true,
                fileUrl: true,
                createdAt: true,
                uploaderId: true,
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

        if (!beatmap) {
            return NextResponse.json(
                { success: false, message: "谱面不存在" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "获取谱面成功",
            data: beatmap,
        });
    } catch (error) {
        console.error("获取谱面失败：", error);
        return NextResponse.json(
            { success: false, message: "获取谱面失败" },
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
        const id = Number(resolvedParams.id);
        const body = await request.json();
        const { title, description, difficulty, gameType, fileUrl, uploaderId } = body;

        if (!id || !title || !description || !difficulty || !gameType || !fileUrl || !uploaderId) {
            return NextResponse.json(
                { success: false, message: "标题、简介、难度、游戏类型、文件和上传者不能为空" },
                { status: 400 }
            );
        }

        const beatmap = await prisma.beatmap.findUnique({
            where: { id },
            select: { uploaderId: true },
        });

        if (!beatmap || beatmap.uploaderId !== Number(uploaderId)) {
            return NextResponse.json(
                { success: false, message: "没有权限编辑该谱面" },
                { status: 403 }
            );
        }

        const updatedBeatmap = await prisma.beatmap.update({
            where: { id },
            data: {
                title,
                description,
                difficulty,
                gameType,
                fileUrl,
            },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                gameType: true,
                fileUrl: true,
                createdAt: true,
                uploaderId: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: "更新谱面成功",
            data: updatedBeatmap,
        });
    } catch (error) {
        console.error("更新谱面失败：", error);
        return NextResponse.json(
            { success: false, message: "更新谱面失败" },
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
                { success: false, message: "没有权限删除该谱面" },
                { status: 403 }
            );
        }

        const beatmap = await prisma.beatmap.findUnique({
            where: { id },
            select: { uploaderId: true },
        });

        const isAdmin = requester.role === "admin";
        if (!beatmap || (!isAdmin && beatmap.uploaderId !== Number(requesterId))) {
            return NextResponse.json(
                { success: false, message: "没有权限删除该谱面" },
                { status: 403 }
            );
        }

        await prisma.beatmap.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "删除谱面成功",
        });
    } catch (error) {
        console.error("删除谱面失败：", error);
        return NextResponse.json(
            { success: false, message: "删除谱面失败" },
            { status: 500 }
        );
    }
}
