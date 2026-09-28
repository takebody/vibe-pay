import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getActiveTossKeys,
  DEFAULT_TOSS_CLIENT_KEY,
  DEFAULT_TOSS_SECRET_KEY,
} from "@/lib/toss";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const keys = await getActiveTossKeys();
    return NextResponse.json({
      success: true,
      clientKey: keys.clientKey,
      secretKey: keys.secretKey,
      isCustom: keys.isCustom,
      defaultClientKey: DEFAULT_TOSS_CLIENT_KEY,
      defaultSecretKey: DEFAULT_TOSS_SECRET_KEY,
    });
  } catch (error: unknown) {
    console.error("Get keys error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "API 키 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientKey, secretKey, reset } = body;

    // Reset to default keys
    if (reset) {
      await prisma.systemConfig.deleteMany({
        where: {
          key: { in: ["TOSS_CLIENT_KEY", "TOSS_SECRET_KEY"] },
        },
      });

      return NextResponse.json({
        success: true,
        message: "기본 토스 샌드박스 테스트 키로 복원되었습니다.",
        clientKey: DEFAULT_TOSS_CLIENT_KEY,
        secretKey: DEFAULT_TOSS_SECRET_KEY,
        isCustom: false,
      });
    }

    if (!clientKey || !secretKey) {
      return NextResponse.json(
        { error: "클라이언트 키와 시크릿 키를 모두 입력해 주세요." },
        { status: 400 }
      );
    }

    const trimmedClientKey = clientKey.trim();
    const trimmedSecretKey = secretKey.trim();

    if (!trimmedClientKey.startsWith("test_ck_") && !trimmedClientKey.startsWith("live_ck_")) {
      return NextResponse.json(
        { error: "클라이언트 키는 'test_ck_'로 시작해야 합니다." },
        { status: 400 }
      );
    }

    if (!trimmedSecretKey.startsWith("test_sk_") && !trimmedSecretKey.startsWith("live_sk_")) {
      return NextResponse.json(
        { error: "시크릿 키는 'test_sk_'로 시작해야 합니다." },
        { status: 400 }
      );
    }

    // Save to SystemConfig in DB
    await prisma.$transaction([
      prisma.systemConfig.upsert({
        where: { key: "TOSS_CLIENT_KEY" },
        create: { key: "TOSS_CLIENT_KEY", value: trimmedClientKey },
        update: { value: trimmedClientKey },
      }),
      prisma.systemConfig.upsert({
        where: { key: "TOSS_SECRET_KEY" },
        create: { key: "TOSS_SECRET_KEY", value: trimmedSecretKey },
        update: { value: trimmedSecretKey },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "토스페이먼츠 API 키가 성공적으로 변경되었습니다.",
      clientKey: trimmedClientKey,
      secretKey: trimmedSecretKey,
      isCustom: true,
    });
  } catch (error: unknown) {
    console.error("Save keys error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "API 키 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
