import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/session";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { email, password, organizationName, name } = body;

    // 1. Server-side validation
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (
      !organizationName ||
      typeof organizationName !== "string" ||
      organizationName.trim().length < 2
    ) {
      return NextResponse.json(
        { error: "Organization name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedOrgName = organizationName.trim();
    const sanitizedName = typeof name === "string" ? name.trim() : null;

    // 2. Check for duplicate email
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 3. Hash password with bcryptjs
    const hashedPassword = await hashPassword(password);

    // 4. Atomic transaction: Organization + Settings + Admin User
    const { organization, user } = await prisma.$transaction(async (tx) => {
      const baseSlug = sanitizedOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const slug = `${baseSlug || "org"}-${randomSuffix}`;

      const newOrg = await tx.organization.create({
        data: {
          name: sanitizedOrgName,
          slug,
        },
      });

      await tx.settings.create({
        data: {
          organizationId: newOrg.id,
          currency: "USD",
          lowStockAlert: true,
          lowStockThreshold: 10,
          timeZone: "UTC",
        },
      });

      const newUser = await tx.user.create({
        data: {
          email: sanitizedEmail,
          name: sanitizedName,
          password: hashedPassword,
          role: "ADMIN",
          organizationId: newOrg.id,
        },
      });

      return { organization: newOrg, user: newUser };
    });

    // 5. Issue JWT and set secure httpOnly cookie
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      organizationId: organization.id,
      organizationName: organization.name,
      role: user.role,
    });

    await setSessionCookie(token);

    // 6. Return sanitized response (never expose password hash)
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
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration. Please try again." },
      { status: 500 }
    );
  }
}

