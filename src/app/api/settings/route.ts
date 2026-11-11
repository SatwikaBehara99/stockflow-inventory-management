import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const [organization, settings, user] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: session.organizationId },
      }),
      prisma.settings.findUnique({
        where: { organizationId: session.organizationId },
      }),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ organization, settings, user }, { status: 200 });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { lowStockThreshold, currency, timeZone } = body;

    let threshold = 10;
    if (lowStockThreshold !== undefined && lowStockThreshold !== null) {
      const num = Number(lowStockThreshold);
      if (!Number.isInteger(num) || num < 0) {
        return NextResponse.json(
          { error: "Low stock threshold must be a non-negative integer." },
          { status: 400 }
        );
      }
      threshold = num;
    }

    const updatedSettings = await prisma.settings.upsert({
      where: { organizationId: session.organizationId },
      update: {
        lowStockThreshold: threshold,
        currency: typeof currency === "string" ? currency.trim() : undefined,
        timeZone: typeof timeZone === "string" ? timeZone.trim() : undefined,
      },
      create: {
        organizationId: session.organizationId,
        lowStockThreshold: threshold,
        currency: typeof currency === "string" ? currency.trim() : "USD",
        timeZone: typeof timeZone === "string" ? timeZone.trim() : "UTC",
      },
    });

    return NextResponse.json(
      { success: true, settings: updatedSettings },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 }
    );
  }
}

