import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Independently verify the JWT on every API call
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. No valid session found." },
        { status: 401 }
      );
    }

    // 2. Fetch fresh user & organization state from database
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account no longer exists." },
        { status: 401 }
      );
    }

    // 3. Return sanitized profile (never exposing password hash)
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        organization: user.organization,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching user profile." },
      { status: 500 }
    );
  }
}

