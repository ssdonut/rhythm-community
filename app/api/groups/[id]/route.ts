import { NextRequest, NextResponse } from "next/server";
import { joinCommaSeparated } from "@/lib/content-mappers";
import { prisma } from "@/lib/prisma";

const CANCELLED_STATUS = "\u5df2\u53d6\u6d88";

function normalizeGroupActivity<T extends { images: Array<{ url: string }> }>(
    activity: T
) {
    return {
        ...activity,
        imageUrls: joinCommaSeparated(activity.images.map((item) => item.url)),
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = Number(resolvedParams.id);
        if (!id) {
            return NextResponse.json(
                { success: false, message: "Invalid group id" },
                { status: 400 }
            );
        }

        const activity = await prisma.groupActivity.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                price: true,
                stock: true,
                status: true,
                deadline: true,
                createdAt: true,
                organizerId: true,
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

        if (!activity) {
            return NextResponse.json(
                { success: false, message: "Group not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Group fetched successfully",
            data: normalizeGroupActivity(activity),
        });
    } catch (error) {
        console.error("Failed to fetch group:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch group" },
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
                { success: false, message: "Invalid request" },
                { status: 400 }
            );
        }

        const requester = await prisma.user.findUnique({
            where: { id: Number(requesterId) },
            select: { role: true, isBanned: true },
        });

        if (!requester || requester.isBanned) {
            return NextResponse.json(
                { success: false, message: "No permission to cancel this group" },
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
                { success: false, message: "No permission to cancel this group" },
                { status: 403 }
            );
        }

        if (activity.status === CANCELLED_STATUS) {
            return NextResponse.json({
                success: true,
                message: "Group already cancelled",
                data: { status: CANCELLED_STATUS },
            });
        }

        const updated = await prisma.groupActivity.update({
            where: { id },
            data: { status: CANCELLED_STATUS },
            select: {
                id: true,
                title: true,
                description: true,
                price: true,
                stock: true,
                status: true,
                deadline: true,
                createdAt: true,
                organizerId: true,
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
            message: "Group cancelled successfully",
            data: normalizeGroupActivity(updated),
        });
    } catch (error) {
        console.error("Failed to cancel group:", error);
        return NextResponse.json(
            { success: false, message: "Failed to cancel group" },
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
                { success: false, message: "Invalid user" },
                { status: 400 }
            );
        }

        const requester = await prisma.user.findUnique({
            where: { id: Number(requesterId) },
            select: { role: true, isBanned: true },
        });

        if (!requester || requester.isBanned) {
            return NextResponse.json(
                { success: false, message: "No permission to delete this group" },
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
                { success: false, message: "No permission to delete this group" },
                { status: 403 }
            );
        }

        await prisma.groupActivity.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Group deleted successfully",
        });
    } catch (error) {
        console.error("Failed to delete group:", error);
        return NextResponse.json(
            { success: false, message: "Failed to delete group" },
            { status: 500 }
        );
    }
}
