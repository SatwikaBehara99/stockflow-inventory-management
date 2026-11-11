import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // 1. Validation
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // 2. Basic login rate limiting (5 attempts per 15 min per IP/email)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const rateLimitKey = `login:${clientIp}:${sanitizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // 3. User lookup
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        organization: true,
      },
    });

    // 4. Constant-time / generic credential verification
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 5. Successful login: reset rate limit
    resetRateLimit(rateLimitKey);

    // 6. Sign JWT and issue secure httpOnly cookie
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organization.id,
      organizationName: user.organization.name,
      role: user.role,
    });

    await setSessionCookie(token);

    // 7. Sanitized response
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error during login. Please try again." },
      { status: 500 }
    );
  }
}

