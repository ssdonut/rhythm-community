import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { account, password } = body;

        if (!account || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "账号和密码不能为空",
                },
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [{ username: account }, { email: account }],
            },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "用户不存在",
                },
                { status: 404 }
            );
        }

        if (user.isBanned) {
            return NextResponse.json(
                {
                    success: false,
                    message: "账号已被封禁",
                },
                { status: 403 }
            );
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return NextResponse.json(
                {
                    success: false,
                    message: "密码错误",
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "登录成功",
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isBanned: user.isBanned,
            },
        });
    } catch (error) {
        console.error("登录接口错误：", error);

        return NextResponse.json(
            {
                success: false,
                message: "请求处理失败",
            },
            { status: 500 }
        );
    }
}
