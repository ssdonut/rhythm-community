import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const allowedTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { success: false, message: "请选择要上传的图片" },
                { status: 400 }
            );
        }

        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, message: "图片不能超过 20MB" },
                { status: 400 }
            );
        }

        const ext = allowedTypes[file.type];
        if (!ext) {
            return NextResponse.json(
                { success: false, message: "不支持的图片格式" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);

        return NextResponse.json({
            success: true,
            message: "上传成功",
            data: {
                url: `/uploads/${filename}`,
            },
        });
    } catch (error) {
        console.error("上传失败：", error);
        return NextResponse.json(
            { success: false, message: "上传失败" },
            { status: 500 }
        );
    }
}
