import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const allowedExtensions = new Set([".osz", ".osu", ".json", ".zip", ".rar", ".7z"]);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { success: false, message: "请选择要上传的谱面文件" },
                { status: 400 }
            );
        }

        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, message: "文件不能超过 50MB" },
                { status: 400 }
            );
        }

        const originalName = file.name || "";
        const ext = path.extname(originalName).toLowerCase();
        if (!allowedExtensions.has(ext)) {
            return NextResponse.json(
                { success: false, message: "仅支持 .osz/.osu/.json/.zip/.rar/.7z 文件" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "beatmaps");

        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);

        return NextResponse.json({
            success: true,
            message: "上传成功",
            data: {
                url: `/beatmaps/${filename}`,
                filename: originalName,
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
